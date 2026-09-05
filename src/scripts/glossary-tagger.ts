#!/usr/bin/env npx tsx
/**
 * Glossary Auto-Tagger
 *
 * Phase 1: Scan diary entries for glossary alias matches and report candidates.
 * Finds paragraphs that mention glossary entities but lack the corresponding tag.
 *
 * Usage:
 *   npx tsx src/scripts/glossary-tagger.ts scan 068                    # Scan one carnet
 *   npx tsx src/scripts/glossary-tagger.ts scan 068 --json             # JSON output
 *   npx tsx src/scripts/glossary-tagger.ts scan 068 --category people  # Only people
 *   npx tsx src/scripts/glossary-tagger.ts scan 068 --min-alias-len 5  # Skip short aliases
 *   npx tsx src/scripts/glossary-tagger.ts scan 068 --verbose          # Show all matches
 *   npx tsx src/scripts/glossary-tagger.ts apply 068 --dry-run         # Preview tag insertion
 *   npx tsx src/scripts/glossary-tagger.ts apply 068                   # Apply tags
 *   npx tsx src/scripts/glossary-tagger.ts apply 068 --accept accept.json  # Apply from accept list
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { writeFileAtomic } from './lib/atomic-write.js';

const CONTENT_DIR = path.resolve('content/_original');
const GLOSSARY_DIR = path.resolve('content/_original/_glossary');

// ── Types ────────────────────────────────────────────────────────────

interface GlossaryEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string;        // e.g., "people/aristocracy"
  glossaryPath: string;     // e.g., "people/aristocracy/DUKE_OF_HAMILTON.md"
  displayName: string;      // e.g., "Duke_of_Hamilton"
}

interface ScanCandidate {
  entryFile: string;        // relative path: "068/1876-12-12.md"
  paraId: string;           // "068.0003"
  glossaryId: string;       // "DUKE_OF_HAMILTON"
  glossaryPath: string;     // "people/aristocracy/DUKE_OF_HAMILTON.md"
  displayName: string;
  matchedAlias: string;     // the alias that matched
  textSnippet: string;      // context around match
  confidence: 'high' | 'medium' | 'low';  // based on alias specificity
}

// ── Glossary Loading ─────────────────────────────────────────────────

function loadGlossaryEntries(filterCategory?: string): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md') && entry.name !== 'CLAUDE.md' && entry.name !== 'README.md') {
        const filePath = path.join(dir, entry.name);
        const relPath = path.relative(GLOSSARY_DIR, filePath);
        const category = path.dirname(relPath);
        const id = path.basename(filePath, '.md');

        if (filterCategory && !category.startsWith(filterCategory)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        let aliases: string[] = [];
        let name = id;

        // Parse frontmatter
        if (content.startsWith('---\n')) {
          const endIdx = content.indexOf('\n---\n', 4);
          if (endIdx !== -1) {
            try {
              const fm = YAML.parse(content.substring(4, endIdx)) ?? {};
              aliases = fm.aliases || [];
              name = fm.name || id;
            } catch { /* skip */ }
          }
        }

        if (aliases.length === 0) continue; // No aliases = can't match

        // Derive display name from ID
        const displayName = id.split('_').map((w, i) => {
          const lower = w.toLowerCase();
          if (i > 0 && ['of', 'de', 'du', 'des', 'la', 'le', 'les', 'et', 'the', 'and', 'von', 'van'].includes(lower)) {
            return lower;
          }
          return w.charAt(0) + w.slice(1).toLowerCase();
        }).join('_');

        entries.push({
          id,
          name,
          aliases,
          category,
          glossaryPath: relPath,
          displayName,
        });
      }
    }
  }

  walk(GLOSSARY_DIR);
  return entries;
}

// ── Paragraph Parsing (reused from theme-tagger) ─────────────────────

const PARA_ID_PATTERN = /^%%\s*(?:\d{2,3}|GLO_[A-Z0-9_]+|SUM\.\d{3})\.\d+\s*%%$/;
const OLD_PARA_ID_PATTERN = /^\[\/\/\]: # \(\d+\.\d+\)$/;

interface ParagraphBlock {
  startLine: number;
  endLine: number;
  paraId: string;
  textLines: string[];
  allLines: string[];
  existingGlossaryIds: Set<string>;  // glossary IDs already tagged
}

function parseBlocks(content: string): { frontmatter: string; blocks: ParagraphBlock[]; trailing: string } {
  const lines = content.split('\n');
  const blocks: ParagraphBlock[] = [];

  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        bodyStart = i + 1;
        break;
      }
    }
  }

  const frontmatter = lines.slice(0, bodyStart).join('\n');
  let currentBlock: ParagraphBlock | null = null;

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    const isNewId = PARA_ID_PATTERN.test(trimmed);
    const isOldId = OLD_PARA_ID_PATTERN.test(trimmed);

    if (isNewId || isOldId) {
      if (currentBlock) {
        currentBlock.endLine = i;
        blocks.push(currentBlock);
      }

      let paraId = '';
      if (isNewId) {
        const match = trimmed.match(/^%%\s*(.+?)\s*%%$/);
        if (match) paraId = match[1];
      } else {
        const match = trimmed.match(/^\[\/\/\]: # \((.+?)\)$/);
        if (match) paraId = match[1];
      }

      currentBlock = {
        startLine: i,
        endLine: -1,
        paraId,
        textLines: [],
        allLines: [],
        existingGlossaryIds: new Set(),
      };
      currentBlock.allLines.push(lines[i]);
      continue;
    }

    if (currentBlock) {
      currentBlock.allLines.push(lines[i]);

      // Extract existing glossary tags
      if (trimmed.startsWith('%%') && trimmed.endsWith('%%') && trimmed.includes('[#')) {
        // Parse all glossary links: [#DisplayName](../_glossary/category/ID.md)
        const tagMatches = trimmed.matchAll(/\[#[^\]]*\]\(\.\.\/\_glossary\/([^)]+)\)/g);
        for (const m of tagMatches) {
          const glossaryId = path.basename(m[1], '.md');
          currentBlock.existingGlossaryIds.add(glossaryId);
        }
      } else if (trimmed.startsWith('[//]: #') && trimmed.includes('[#')) {
        const tagMatches = trimmed.matchAll(/\[#[^\]]*\]\(\.\.\/\_glossary\/([^)]+)\)/g);
        for (const m of tagMatches) {
          const glossaryId = path.basename(m[1], '.md');
          currentBlock.existingGlossaryIds.add(glossaryId);
        }
      } else if (trimmed && !trimmed.startsWith('%%') && !trimmed.startsWith('[//]: #') && !trimmed.startsWith('[^') && !trimmed.startsWith('#')) {
        currentBlock.textLines.push(trimmed);
      } else if (trimmed.startsWith('#')) {
        // Headers can contain names too
        currentBlock.textLines.push(trimmed);
      }
    }
  }

  if (currentBlock) {
    currentBlock.endLine = lines.length;
    blocks.push(currentBlock);
  }

  const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].endLine : bodyStart;
  const trailing = lines.slice(lastEnd).join('\n');

  return { frontmatter, blocks, trailing };
}

// ── Alias Matching ───────────────────────────────────────────────────

/**
 * Ambiguous aliases that commonly appear as regular French words.
 * These need AI evaluation (Phase 2) or are simply too noisy.
 */
const AMBIGUOUS_ALIASES = new Set([
  // French common words that are also glossary entries
  'Nice',       // city vs "nice" (adj) - but French "nice" isn't common, actually ok case-sensitive
  'portrait',   // art term vs generic
  'salon',      // room vs social event vs art exhibition
  'atelier',    // workshop vs generic
  'concert',    // event vs generic
  'album',      // book vs generic
  'bal',        // dance vs generic
  'break',      // carriage vs generic
  'roman',      // novel vs generic
  'composition',// art term vs generic
  'dessin',     // drawing vs generic
  'peinture',   // painting vs generic
  'tableau',    // painting vs generic
  'sculpture',  // art form vs generic
  'toilette',   // dressing vs generic
  'promenade',  // walk vs specific activity
  'voiture',    // carriage vs generic
]);

/**
 * Build a word-boundary-aware regex for an alias.
 * Case-sensitive for short aliases, case-insensitive for longer ones with accents.
 */
function buildAliasRegex(alias: string): RegExp {
  // Escape regex special chars
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundaries
  const pattern = `\\b${escaped}\\b`;
  // Case-sensitive for proper nouns (starts with uppercase)
  // Case-insensitive only if the alias contains accented chars that might appear without accents
  const hasAccents = /[àâäéèêëïîôùûüÿçæœÀÂÄÉÈÊËÏÎÔÙÛÜŸÇÆŒ]/.test(alias);
  return new RegExp(pattern, hasAccents ? 'i' : '');
}

/**
 * Determine match confidence based on alias properties.
 */
function getConfidence(alias: string, glossaryEntry: GlossaryEntry): 'high' | 'medium' | 'low' {
  const lowerAlias = alias.toLowerCase();

  // Ambiguous common words → low
  if (AMBIGUOUS_ALIASES.has(alias) || AMBIGUOUS_ALIASES.has(lowerAlias)) {
    return 'low';
  }

  // Very short aliases (<=4 chars) → low unless it's a known proper noun
  if (alias.length <= 4 && !alias.includes(' ')) {
    return 'low';
  }

  // Single word, 5-7 chars → medium (could be a common word)
  if (!alias.includes(' ') && alias.length <= 7) {
    return 'medium';
  }

  // Multi-word aliases → high (very specific)
  if (alias.includes(' ') && alias.length >= 10) {
    return 'high';
  }

  // Default: medium for single words, high for multi-word
  return alias.includes(' ') ? 'high' : 'medium';
}

/**
 * Extract a text snippet around the match for context.
 */
function extractSnippet(text: string, alias: string, maxLen: number = 100): string {
  const idx = text.toLowerCase().indexOf(alias.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen);

  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + alias.length + 30);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet += '...';
  return snippet;
}

// ── Scanning ─────────────────────────────────────────────────────────

function scanCarnet(
  carnet: string,
  glossaryEntries: GlossaryEntry[],
  options: {
    minAliasLen: number;
    minConfidence: 'high' | 'medium' | 'low';
    verbose: boolean;
  }
): ScanCandidate[] {
  const carnetDir = path.join(CONTENT_DIR, carnet);
  if (!fs.existsSync(carnetDir)) {
    console.error(`Carnet directory not found: ${carnetDir}`);
    return [];
  }

  const files = fs.readdirSync(carnetDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('README') && !f.startsWith('_'))
    .sort();

  const rawCandidates: ScanCandidate[] = [];
  const confidenceOrder = { high: 3, medium: 2, low: 1 };

  // Pre-build regexes for all aliases
  const aliasIndex: { regex: RegExp; alias: string; entry: GlossaryEntry; confidence: 'high' | 'medium' | 'low' }[] = [];

  for (const entry of glossaryEntries) {
    for (const alias of entry.aliases) {
      if (alias.length < options.minAliasLen) continue;

      const confidence = getConfidence(alias, entry);
      if (confidenceOrder[confidence] < confidenceOrder[options.minConfidence]) continue;

      try {
        aliasIndex.push({
          regex: buildAliasRegex(alias),
          alias,
          entry,
          confidence,
        });
      } catch {
        // Invalid regex — skip
      }
    }
  }

  if (options.verbose) {
    console.error(`Loaded ${aliasIndex.length} alias patterns from ${glossaryEntries.length} glossary entries`);
  }

  for (const file of files) {
    const filePath = path.join(carnetDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { blocks } = parseBlocks(content);
    const relFile = `${carnet}/${file}`;

    for (const block of blocks) {
      if (block.textLines.length === 0) continue;

      const fullText = block.textLines.join(' ');

      for (const { regex, alias, entry, confidence } of aliasIndex) {
        // Skip if already tagged with this glossary entry
        if (block.existingGlossaryIds.has(entry.id)) continue;

        // Test match
        if (regex.test(fullText)) {
          rawCandidates.push({
            entryFile: relFile,
            paraId: block.paraId,
            glossaryId: entry.id,
            glossaryPath: entry.glossaryPath,
            displayName: entry.displayName,
            matchedAlias: alias,
            textSnippet: extractSnippet(fullText, alias),
            confidence,
          });
        }
      }
    }
  }

  // Deduplicate: when multiple glossary entries match via the same alias text
  // in the same paragraph, keep only the one whose ID best matches the alias.
  return deduplicateCandidates(rawCandidates);
}

/**
 * Deduplicate candidates where the same alias text matches multiple glossary entries
 * in the same paragraph. Keeps the best match per (paraId, matchedAlias) group.
 *
 * Scoring: prefer entries where the glossary ID closely matches the alias text,
 * or where the alias is the entry's primary (longest) alias.
 */
function deduplicateCandidates(candidates: ScanCandidate[]): ScanCandidate[] {
  // Group by (paraId, matched alias text lowercased)
  const groups = new Map<string, ScanCandidate[]>();
  for (const c of candidates) {
    const key = `${c.entryFile}:${c.paraId}:${c.matchedAlias.toLowerCase()}`;
    const list = groups.get(key) || [];
    list.push(c);
    groups.set(key, list);
  }

  const result: ScanCandidate[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Score each candidate in the group
    const scored = group.map(c => {
      let score = 0;
      const aliasLower = c.matchedAlias.toLowerCase().replace(/[^a-z]/g, '');
      const idLower = c.glossaryId.toLowerCase().replace(/_/g, '');

      // Exact ID match (alias is basically the ID)
      if (idLower === aliasLower) score += 100;
      // ID contains the alias
      else if (idLower.includes(aliasLower)) score += 50;
      // ID starts with alias
      else if (idLower.startsWith(aliasLower)) score += 40;

      // Prefer entries with shorter IDs (more specific to this alias, less compound)
      score -= c.glossaryId.length;

      // Higher confidence = better
      score += c.confidence === 'high' ? 10 : c.confidence === 'medium' ? 5 : 0;

      return { candidate: c, score };
    });

    // Sort by score descending, take the best one
    scored.sort((a, b) => b.score - a.score);
    result.push(scored[0].candidate);
  }

  return result;
}

// ── Tag Application ──────────────────────────────────────────────────

function buildTagLine(displayName: string, glossaryPath: string): string {
  return `%% [#${displayName}](../_glossary/${glossaryPath}) %%`;
}

function insertGlossaryTag(blockLines: string[], displayName: string, glossaryPath: string): string[] {
  const tagLine = buildTagLine(displayName, glossaryPath);
  const result = [blockLines[0]]; // paragraph ID line

  let insertIdx = 1;

  // Skip existing glossary tag lines
  while (insertIdx < blockLines.length) {
    const trimmed = blockLines[insertIdx].trim();
    if (trimmed.startsWith('%%') && trimmed.endsWith('%%') && trimmed.includes('[#')) {
      result.push(blockLines[insertIdx]);
      insertIdx++;
      continue;
    }
    if (trimmed.startsWith('[//]: # (') && trimmed.includes('[#')) {
      result.push(blockLines[insertIdx]);
      insertIdx++;
      continue;
    }
    break;
  }

  result.push(tagLine);

  for (let i = insertIdx; i < blockLines.length; i++) {
    result.push(blockLines[i]);
  }

  return result;
}

interface ApplyResult {
  file: string;
  tagsAdded: number;
  tags: { paraId: string; glossaryId: string; displayName: string }[];
}

/**
 * An accept list is an external JSON file, so every field it carries is checked
 * against the carnet actually being tagged before anything is written.
 */
function candidateProblem(carnet: string, c: ScanCandidate): string | null {
  for (const field of ['entryFile', 'paraId', 'glossaryId', 'glossaryPath', 'displayName'] as const) {
    if (typeof c[field] !== 'string' || c[field].length === 0) return `missing ${field}`;
  }

  const segments = c.entryFile.split('/');
  if (segments.length !== 2 || segments[0] !== carnet || segments.includes('..')) {
    return `entry file is not in carnet ${carnet}`;
  }

  if (!fs.existsSync(path.join(CONTENT_DIR, c.entryFile))) {
    return 'entry file does not exist';
  }

  if (path.isAbsolute(c.glossaryPath) || !/^[A-Z0-9_]+\.md$/.test(path.basename(c.glossaryPath))) {
    return `glossary entry not found: ${c.glossaryPath}`;
  }

  // The path comes from an external JSON file: keep it inside the glossary tree
  // and make it name the entry it claims to be.
  const glossaryFile = path.resolve(GLOSSARY_DIR, c.glossaryPath);
  const withinGlossary = path.relative(GLOSSARY_DIR, glossaryFile);
  if (!withinGlossary || withinGlossary.startsWith('..') || path.isAbsolute(withinGlossary)) {
    return `glossary path escapes the glossary tree: ${c.glossaryPath}`;
  }

  if (path.basename(glossaryFile) !== `${c.glossaryId}.md`) {
    return `glossary path does not match id ${c.glossaryId}: ${c.glossaryPath}`;
  }

  if (!fs.existsSync(glossaryFile)) {
    return `glossary entry not found: ${c.glossaryPath}`;
  }

  return null;
}

function applyToCarnet(
  carnet: string,
  candidates: ScanCandidate[],
  dryRun: boolean,
): { results: ApplyResult[]; skipped: string[] } {
  const skipped: string[] = [];

  // Group candidates by file
  const byFile = new Map<string, ScanCandidate[]>();
  for (const c of candidates) {
    const problem = candidateProblem(carnet, c);
    if (problem) {
      skipped.push(`${c.entryFile} §${c.paraId} [${c.glossaryId}] — ${problem}`);
      continue;
    }
    const list = byFile.get(c.entryFile) || [];
    list.push(c);
    byFile.set(c.entryFile, list);
  }

  const results: ApplyResult[] = [];

  for (const [relFile, fileCandidates] of byFile) {
    const filePath = path.join(CONTENT_DIR, relFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, blocks, trailing } = parseBlocks(content);

    const knownParaIds = new Set(blocks.map(b => b.paraId));
    for (const c of fileCandidates) {
      if (!knownParaIds.has(c.paraId)) {
        skipped.push(`${c.entryFile} §${c.paraId} [${c.glossaryId}] — paragraph not found`);
      }
    }

    const result: ApplyResult = { file: relFile, tagsAdded: 0, tags: [] };
    let modified = false;

    // Deduplicate: one glossary ID per paragraph
    const candidatesByPara = new Map<string, Map<string, ScanCandidate>>();
    for (const c of fileCandidates) {
      if (!knownParaIds.has(c.paraId)) continue;
      if (!candidatesByPara.has(c.paraId)) {
        candidatesByPara.set(c.paraId, new Map());
      }
      const paraMap = candidatesByPara.get(c.paraId)!;
      // Keep highest-confidence match per glossary ID
      const existing = paraMap.get(c.glossaryId);
      if (!existing || getConfidenceOrder(c.confidence) > getConfidenceOrder(existing.confidence)) {
        paraMap.set(c.glossaryId, c);
      }
    }

    for (const block of blocks) {
      const paraMap = candidatesByPara.get(block.paraId);
      if (!paraMap) continue;

      for (const [glossaryId, candidate] of paraMap) {
        if (block.existingGlossaryIds.has(glossaryId)) continue;

        block.allLines = insertGlossaryTag(block.allLines, candidate.displayName, candidate.glossaryPath);
        block.existingGlossaryIds.add(glossaryId);
        modified = true;
        result.tagsAdded++;
        result.tags.push({ paraId: candidate.paraId, glossaryId, displayName: candidate.displayName });
      }
    }

    if (modified && !dryRun) {
      const parts: string[] = [];
      if (frontmatter) parts.push(frontmatter);

      const bodyLines: string[] = [];
      for (const block of blocks) {
        if (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] !== '') {
          bodyLines.push('');
        }
        bodyLines.push(...block.allLines);
      }
      parts.push(bodyLines.join('\n'));

      if (trailing.trim()) parts.push(trailing);

      const newContent = parts.join('\n');
      const sizeDelta = Math.abs(newContent.length - content.length);
      const maxDelta = result.tagsAdded * 200;
      if (sizeDelta <= maxDelta + 100) {
        writeFileAtomic(filePath, newContent);
      } else {
        console.error(`WARNING: ${relFile} — size delta ${sizeDelta} exceeds expected ${maxDelta}. Skipping write.`);
      }
    }

    if (result.tagsAdded > 0) {
      results.push(result);
    }
  }

  return { results, skipped };
}

function getConfidenceOrder(c: string): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1;
}

// ── Output ───────────────────────────────────────────────────────────

function printCandidates(candidates: ScanCandidate[], jsonOutput: boolean): void {
  if (jsonOutput) {
    console.log(JSON.stringify(candidates, null, 2));
    return;
  }

  // Group by confidence
  const byConfidence = { high: [] as ScanCandidate[], medium: [] as ScanCandidate[], low: [] as ScanCandidate[] };
  for (const c of candidates) {
    byConfidence[c.confidence].push(c);
  }

  // Group by file for display
  for (const level of ['high', 'medium', 'low'] as const) {
    const group = byConfidence[level];
    if (group.length === 0) continue;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${level.toUpperCase()} confidence (${group.length} candidates)`);
    console.log('='.repeat(60));

    const byFile = new Map<string, ScanCandidate[]>();
    for (const c of group) {
      const list = byFile.get(c.entryFile) || [];
      list.push(c);
      byFile.set(c.entryFile, list);
    }

    for (const [file, fileCandidates] of byFile) {
      console.log(`\n  ${file}:`);
      for (const c of fileCandidates) {
        console.log(`    §${c.paraId} [${c.glossaryId}] matched "${c.matchedAlias}"`);
        console.log(`      "${c.textSnippet}"`);
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY:');
  console.log(`  Total candidates: ${candidates.length}`);
  console.log(`  High confidence:  ${byConfidence.high.length}`);
  console.log(`  Medium confidence: ${byConfidence.medium.length}`);
  console.log(`  Low confidence:   ${byConfidence.low.length}`);

  // Unique glossary entries matched
  const uniqueIds = new Set(candidates.map(c => c.glossaryId));
  console.log(`  Unique glossary entries: ${uniqueIds.size}`);

  // Unique paragraphs matched
  const uniqueParas = new Set(candidates.map(c => `${c.entryFile}:${c.paraId}`));
  console.log(`  Unique paragraphs: ${uniqueParas.size}`);
}

// ── Batch Generation ─────────────────────────────────────────────────

interface EvalBatch {
  batchId: string;
  confidence: 'medium' | 'low';
  entryFile: string;
  candidates: ScanCandidate[];
}

/**
 * Generate evaluation batches grouped by entry file.
 * Writes batch files to outputDir for subagent consumption.
 */
function generateBatches(
  carnet: string,
  candidates: ScanCandidate[],
  outputDir: string,
): { medium: EvalBatch[]; low: EvalBatch[] } {
  fs.mkdirSync(outputDir, { recursive: true });

  const medium: EvalBatch[] = [];
  const low: EvalBatch[] = [];

  // Group by (confidence, entryFile)
  const groups = new Map<string, ScanCandidate[]>();
  for (const c of candidates) {
    if (c.confidence === 'high') continue; // Auto-accept, no evaluation needed
    const key = `${c.confidence}:${c.entryFile}`;
    const list = groups.get(key) || [];
    list.push(c);
    groups.set(key, list);
  }

  let batchIdx = 0;
  for (const [key, groupCandidates] of groups) {
    const [confidence, entryFile] = key.split(':', 2) as ['medium' | 'low', string];
    batchIdx++;

    const batch: EvalBatch = {
      batchId: `${carnet}-${String(batchIdx).padStart(3, '0')}`,
      confidence,
      entryFile,
      candidates: groupCandidates,
    };

    const batchFile = path.join(outputDir, `${batch.batchId}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf-8');

    if (confidence === 'medium') medium.push(batch);
    else low.push(batch);
  }

  return { medium, low };
}

// ── Result Collection ────────────────────────────────────────────────

interface EvalDecision {
  paraId: string;
  glossaryId: string;
  decision: 'accept' | 'reject';
  reason: string;
}

interface EvalResult {
  batchId: string;
  decisions: EvalDecision[];
}

/**
 * Collect evaluation results from batch result files and build an accept list.
 * Also includes auto-accepted high-confidence candidates.
 */
function collectResults(evalDir: string): { accepted: ScanCandidate[]; rejected: EvalDecision[]; missing: string[] } {
  const accepted: ScanCandidate[] = [];
  const rejected: EvalDecision[] = [];
  const missing: string[] = [];

  // Load auto-accept high-confidence
  const highFile = path.join(evalDir, 'auto-accept-high.json');
  if (fs.existsSync(highFile)) {
    const highCandidates: ScanCandidate[] = JSON.parse(fs.readFileSync(highFile, 'utf-8'));
    accepted.push(...highCandidates);
  }

  // Find all batch files and their results
  const batchFiles = fs.readdirSync(evalDir)
    .filter(f => f.match(/^\d{3}-\d{3}\.json$/))
    .sort();

  for (const batchFile of batchFiles) {
    const batchId = path.basename(batchFile, '.json');
    const resultFile = path.join(evalDir, `${batchId}-result.json`);

    if (!fs.existsSync(resultFile)) {
      missing.push(batchId);
      continue;
    }

    const batch: EvalBatch = JSON.parse(fs.readFileSync(path.join(evalDir, batchFile), 'utf-8'));
    const result: EvalResult = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));

    // Build lookup from decisions
    const decisionMap = new Map<string, EvalDecision>();
    for (const d of result.decisions) {
      decisionMap.set(`${d.paraId}:${d.glossaryId}`, d);
    }

    for (const candidate of batch.candidates) {
      const key = `${candidate.paraId}:${candidate.glossaryId}`;
      const decision = decisionMap.get(key);

      if (!decision) {
        // No decision for this candidate — treat as missing
        missing.push(`${batchId}:${key}`);
        continue;
      }

      if (decision.decision === 'accept') {
        accepted.push(candidate);
      } else {
        rejected.push(decision);
      }
    }
  }

  return { accepted, rejected, missing };
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === 'help') {
    console.log(`
Glossary Auto-Tagger

Commands:
  scan <carnet> [options]      Scan for alias matches (Phase 1)
  batch <carnet> [options]     Generate evaluation batches (Phase 2 prep)
  collect <carnet> [options]   Collect evaluation results and build accept list
  apply <carnet> [options]     Apply tags to entries

Scan options:
  --json                      Output as JSON
  --category <cat>            Filter glossary by category (e.g., "people", "places")
  --min-alias-len <n>         Minimum alias length (default: 4)
  --min-confidence <level>    Minimum confidence: high, medium, low (default: low)
  --verbose                   Show progress info

Batch options:
  --output-dir <dir>          Output directory (default: /tmp/glossary-eval/<carnet>)

Apply options:
  --dry-run                   Preview without writing
  --accept <file>             Use accept list (JSON file with accepted candidates)
  --min-confidence <level>    Minimum confidence to auto-apply (default: high)

Examples:
  glossary-tagger scan 068
  glossary-tagger scan 068 --category people --min-confidence medium
  glossary-tagger scan 068 --json > candidates-068.json
  glossary-tagger batch 068
  glossary-tagger apply 068 --dry-run
  glossary-tagger apply 068 --accept /tmp/glossary-eval/068/accepted.json
`);
    return;
  }

  const carnet = args[1];
  if (!carnet || !/^\d{3}$/.test(carnet)) {
    console.error('Error: Provide a 3-digit carnet number (e.g., 068)');
    process.exit(1);
  }

  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');

  const catIdx = args.indexOf('--category');
  const category = catIdx >= 0 ? args[catIdx + 1] : undefined;

  const minLenIdx = args.indexOf('--min-alias-len');
  const minAliasLen = minLenIdx >= 0 ? parseInt(args[minLenIdx + 1], 10) : 4;

  const minConfIdx = args.indexOf('--min-confidence');
  const minConfidence = (minConfIdx >= 0 ? args[minConfIdx + 1] : 'low') as 'high' | 'medium' | 'low';

  // Load glossary
  if (!jsonOutput) console.error('Loading glossary entries...');
  const glossaryEntries = loadGlossaryEntries(category);
  if (!jsonOutput) console.error(`Loaded ${glossaryEntries.length} entries with aliases`);

  if (command === 'scan') {
    const candidates = scanCarnet(carnet, glossaryEntries, { minAliasLen, minConfidence, verbose });
    printCandidates(candidates, jsonOutput);
  } else if (command === 'batch') {
    const outDirIdx = args.indexOf('--output-dir');
    const outputDir = outDirIdx >= 0 ? args[outDirIdx + 1] : `/tmp/glossary-eval/${carnet}`;

    const candidates = scanCarnet(carnet, glossaryEntries, { minAliasLen, minConfidence: 'low', verbose });
    const { medium, low } = generateBatches(carnet, candidates, outputDir);

    // Also write the high-confidence auto-accepts
    const highCandidates = candidates.filter(c => c.confidence === 'high');
    if (highCandidates.length > 0) {
      fs.writeFileSync(
        path.join(outputDir, 'auto-accept-high.json'),
        JSON.stringify(highCandidates, null, 2),
        'utf-8',
      );
    }

    console.log(`Batches written to ${outputDir}/`);
    console.log(`  High confidence (auto-accept): ${highCandidates.length} candidates`);
    console.log(`  Medium confidence batches: ${medium.length} (${medium.reduce((s, b) => s + b.candidates.length, 0)} candidates)`);
    console.log(`  Low confidence batches: ${low.length} (${low.reduce((s, b) => s + b.candidates.length, 0)} candidates)`);
    console.log(`\nSubagent evaluation:`);
    console.log(`  Medium batches → give to a fast evaluator (Sonnet-class)`);
    console.log(`  Low batches → give to a careful evaluator (Opus-class) with more context`);
    console.log(`\nTools available to evaluators:`);
    console.log(`  just glossary-fm-get <ID>             # Read glossary entry frontmatter`);
    console.log(`  cat content/_original/<entry_file>     # Read full diary entry`);
    console.log(`  just glossary-find <ID>               # Find all references to an entry`);
  } else if (command === 'collect') {
    const outDirIdx = args.indexOf('--output-dir');
    const evalDir = outDirIdx >= 0 ? args[outDirIdx + 1] : `/tmp/glossary-eval/${carnet}`;

    const { accepted, rejected, missing } = collectResults(evalDir);

    if (missing.length > 0) {
      console.log(`WARNING: ${missing.length} batches/candidates missing results:`);
      for (const m of missing.slice(0, 10)) {
        console.log(`  ${m}`);
      }
      if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`);
      console.log('');
    }

    console.log(`Results collected from ${evalDir}/`);
    console.log(`  Accepted: ${accepted.length} tags`);
    console.log(`  Rejected: ${rejected.length} tags`);

    // Write accept list
    const acceptFile = path.join(evalDir, 'accepted.json');
    fs.writeFileSync(acceptFile, JSON.stringify(accepted, null, 2), 'utf-8');
    console.log(`\nAccept list written to ${acceptFile}`);
    console.log(`Apply with: npx tsx src/scripts/glossary-tagger.ts apply ${carnet} --accept ${acceptFile}`);

    if (jsonOutput) {
      console.log(JSON.stringify({ accepted: accepted.length, rejected: rejected.length, missing: missing.length }, null, 2));
    }
  } else if (command === 'apply') {
    const acceptFile = args.indexOf('--accept') >= 0 ? args[args.indexOf('--accept') + 1] : undefined;
    const applyConfidence = (minConfIdx >= 0 ? args[minConfIdx + 1] : 'high') as 'high' | 'medium' | 'low';

    // Get candidates
    let candidates: ScanCandidate[];
    if (acceptFile) {
      // Use explicit accept list
      candidates = JSON.parse(fs.readFileSync(acceptFile, 'utf-8'));
    } else {
      // Scan and filter by confidence
      candidates = scanCarnet(carnet, glossaryEntries, { minAliasLen, minConfidence: applyConfidence, verbose });
    }

    if (!jsonOutput) {
      console.log(`${dryRun ? 'DRY RUN: ' : ''}Applying ${candidates.length} tags to carnet ${carnet}`);
    }

    const { results, skipped } = applyToCarnet(carnet, candidates, dryRun);

    if (skipped.length > 0) {
      console.error(`Skipped ${skipped.length} candidate(s):`);
      for (const s of skipped) console.error(`  ${s}`);
      process.exitCode = 1;
    }

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      let totalTags = 0;
      for (const r of results) {
        totalTags += r.tagsAdded;
        console.log(`  ${r.file}: +${r.tagsAdded} tags`);
        for (const t of r.tags) {
          console.log(`    §${t.paraId} [${t.glossaryId}]`);
        }
      }
      console.log(`\nTotal: ${totalTags} tags ${dryRun ? 'would be' : ''} applied to ${results.length} files`);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main();
