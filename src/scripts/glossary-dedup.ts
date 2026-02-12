#!/usr/bin/env npx tsx

/**
 * Glossary Dedup + Restructure CLI
 *
 * Deduplicate glossary entries (same filename in multiple categories)
 * and restructure into the target category system — in one pass.
 *
 * Usage:
 *   npx tsx src/scripts/glossary-dedup.ts analyze              # Generate dedup-plan.yaml
 *   npx tsx src/scripts/glossary-dedup.ts execute plan.yaml     # Execute plan
 *   npx tsx src/scripts/glossary-dedup.ts execute --dry-run plan.yaml
 *
 * The analyze step:
 *   1. Finds all duplicate IDs (same filename in multiple categories)
 *   2. For simple cases (1 content + stubs): auto-decides to keep content file
 *   3. For multi-content cases: calls Claude to decide merge vs rename
 *   4. Finds entries in wrong/deprecated categories and plans moves
 *   5. Outputs a YAML plan file for human review
 *
 * The execute step reads the plan and applies all changes.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as yaml from 'yaml';

const BASE_PATH = process.cwd();
const GLOSSARY_BASE = path.join(BASE_PATH, 'content/_original/_glossary');
const CONTENT_BASE = path.join(BASE_PATH, 'content');

const GLOSSARY_LINK_PATTERN = /\[([^\]]*)\]\(\.\.\/_glossary\/([^)]+\.md)\)/g;
const FRONTMATTER_ITEM_PATTERN = /^(\s+-\s+)(\S+)$/;

// ── Target category structure ───────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'people/core', 'people/family', 'people/recurring', 'people/mentioned',
  'people/aristocracy', 'people/artists', 'people/politicians', 'people/religious',
  'people/writers', 'people/service', 'people/doctors', 'people/historical',
  'people/society',
  'places/cities', 'places/countries', 'places/regions', 'places/residences',
  'places/hotels', 'places/theaters', 'places/churches', 'places/social',
  'places/travel', 'places/schools', 'places/shops', 'places/parks',
  'places/landmarks', 'places/buildings', 'places/streets', 'places/neighborhoods',
  'places/venues', 'places/cafes', 'places/government',
  'culture/literature', 'culture/music', 'culture/theater', 'culture/art',
  'culture/history', 'culture/newspapers', 'culture/institutions',
  'culture/languages', 'culture/fashion', 'culture/education', 'culture/politics',
  'culture/leisure',
]);

/** Map deprecated/overlapping categories → target categories */
const CATEGORY_MAP: Record<string, string> = {
  'society/aristocracy': 'people/aristocracy',
  'society/clubs': 'people/mentioned',
  'society/artists': 'people/artists',
  'society/politics': 'people/politicians',
  'society/phenomena': 'culture/history',
  'people/art': 'people/artists',
  'people/politics': 'people/politicians',
  'people/servants': 'people/service',
  'people/household': 'people/service',
  'people/medical': 'people/doctors',
  'people/nobility': 'people/aristocracy',
  'people/royalty': 'people/aristocracy',
  'people/rulers': 'people/aristocracy',
  'people/scandalous': 'people/mentioned',
  'people/acquaintances': 'people/mentioned',
  'people/romantic': 'people/recurring',
  'people/teachers': 'people/recurring',
  'people/occult': 'people/mentioned',
  'languages': 'culture/languages',
  'concepts': 'culture/history',
  'events': 'culture/history',
  'references/biblical': 'culture/literature',
  'references/cultural': 'culture/literature',
  'references/literature': 'culture/literature',
  'culture/opera': 'culture/music',
  'culture/operas': 'culture/music',
  'culture/press': 'culture/newspapers',
  'culture/historical': 'culture/history',
  'culture/events': 'culture/history',
  'culture/exhibitions': 'culture/history',
  'culture/holidays': 'culture/history',
  'culture/symbols': 'culture/history',
  'culture/restaurants': 'culture/leisure',
  'places/paris': 'places/neighborhoods',
  'places/towns': 'places/cities',
  'places/avenues': 'places/streets',
  'places/squares': 'places/streets',
  'places/districts': 'places/neighborhoods',
  'places/departments': 'places/regions',
  'places/promenades': 'places/landmarks',
  'places/monuments': 'places/landmarks',
  'places/museums': 'places/landmarks',
  'places/newspapers': 'culture/newspapers',
  'places/institutions': 'culture/institutions',
  'places/religious': 'places/churches',
  'places/addresses': 'places/residences',
};

// ── Types ───────────────────────────────────────────────────────────────────

interface GlossaryCopy {
  relPath: string; // relative to _glossary/
  size: number;
  category: string; // e.g., "people/mentioned"
}

interface DedupKeepAction {
  id: string;
  type: 'DEDUP_KEEP';
  keep: string;
  move_to?: string;
  delete: string[];
  refs_to_rewrite: number;
}

interface DedupMergeAction {
  id: string;
  type: 'DEDUP_MERGE';
  target: string;
  merge_from: string[];
  delete?: string[];
  refs_to_rewrite: number;
}

interface DedupRenameAction {
  id: string;
  type: 'DEDUP_RENAME';
  entries: Array<{
    path: string;
    keep_as?: string;
    rename_to?: string;
    move_to: string;
  }>;
  delete?: string[];
  refs_to_rewrite: number;
}

interface MoveAction {
  id: string;
  type: 'MOVE';
  from: string;
  to: string;
  refs_to_rewrite: number;
}

type Action = DedupKeepAction | DedupMergeAction | DedupRenameAction | MoveAction;

interface Plan {
  generated: string;
  summary: {
    duplicate_groups: number;
    dedup_keep: number;
    dedup_merge: number;
    dedup_rename: number;
    moves: number;
    total_refs_to_rewrite: number;
  };
  actions: Action[];
}

// ── Utility functions ───────────────────────────────────────────────────────

function getAllContentFiles(): string[] {
  const files: string[] = [];
  const langDirs = ['_original', 'cz', 'en', 'uk', 'fr'];

  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_BASE, lang);
    if (!fs.existsSync(langDir)) continue;

    const items = fs.readdirSync(langDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('_')) continue;
      const carnetDir = path.join(langDir, item.name);
      try {
        const mdFiles = fs.readdirSync(carnetDir)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(carnetDir, f));
        files.push(...mdFiles);
      } catch { /* skip unreadable */ }
    }
  }

  return files.sort();
}

function buildGlossaryIndex(): Map<string, GlossaryCopy[]> {
  const index = new Map<string, GlossaryCopy[]>();

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name.startsWith('_')) continue;
        walk(fullPath);
      } else if (item.name.endsWith('.md')) {
        const id = item.name.replace('.md', '');
        const relPath = path.relative(GLOSSARY_BASE, fullPath);
        const size = fs.statSync(fullPath).size;
        const category = path.dirname(relPath);

        if (!index.has(id)) index.set(id, []);
        index.get(id)!.push({ relPath, size, category });
      }
    }
  };

  walk(GLOSSARY_BASE);
  return index;
}

function buildRefIndex(contentFiles: string[]): Map<string, number> {
  const refCounts = new Map<string, number>();

  for (const file of contentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const pattern = new RegExp(GLOSSARY_LINK_PATTERN.source, 'g');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const linkPath = match[2];
      refCounts.set(linkPath, (refCounts.get(linkPath) || 0) + 1);
    }
  }

  return refCounts;
}

function getCategory(relPath: string): string {
  return path.dirname(relPath);
}

function getTargetCategory(currentCategory: string): string | null {
  if (VALID_CATEGORIES.has(currentCategory)) return null; // already valid
  return CATEGORY_MAP[currentCategory] || null;
}

function isStub(size: number): boolean {
  return size <= 60;
}

// ── Claude integration ──────────────────────────────────────────────────────

function callClaude(prompt: string, timeout = 120_000): string | null {
  try {
    const result = execSync(
      `claude -p --permission-mode bypassPermissions ${JSON.stringify(prompt)}`,
      {
        encoding: 'utf-8',
        maxBuffer: 2 * 1024 * 1024,
        timeout,
        cwd: BASE_PATH,
      }
    );
    const trimmed = result.trim();
    if (!trimmed || trimmed.length < 10) return null;
    return trimmed;
  } catch (e) {
    console.error(`  Claude call failed: ${e}`);
    return null;
  }
}

function smartMergeGlossaryContent(
  sourceId: string,
  sourceContent: string,
  targetId: string,
  targetContent: string,
): string | null {
  const prompt = `You are merging two glossary entries about the same entity in the Marie Bashkirtseff diary project.

TARGET entry (${targetId}) — this is the primary entry to keep:
---
${targetContent}
---

SOURCE entry (${sourceId}) — this will be merged into the target and deleted:
---
${sourceContent}
---

Produce a single merged glossary entry that:
1. Uses the TARGET's frontmatter (id, name, type, category) as the base
2. Combines all unique information from both entries — do NOT lose any facts, dates, or details
3. Eliminates redundant/duplicate content
4. Maintains coherent structure with clear sections
5. Preserves all RSR/research comments (with timestamps) from both entries
6. Updates last_updated to today's date
7. Sets research_status based on combined content quality

Output ONLY the merged markdown file content, nothing else. No explanation, no code fences.`;

  return callClaude(prompt);
}

function analyzeMultiContentGroup(
  id: string,
  copies: GlossaryCopy[],
  refCounts: Map<string, number>,
): Action | null {
  const copyDetails = copies.map(c => {
    const refs = refCounts.get(c.relPath) || 0;
    const content = fs.readFileSync(path.join(GLOSSARY_BASE, c.relPath), 'utf-8');
    const preview = content.substring(0, 500);
    return { ...c, refs, preview, content };
  });

  const prompt = `You are analyzing duplicate glossary entries in the Marie Bashkirtseff diary project.

The ID "${id}" exists in ${copies.length} locations. Determine if these are:
A) The SAME entity (merge into one)
B) DIFFERENT entities that share a name (rename one)

Here are the copies:

${copyDetails.map((c, i) => `--- Copy ${i + 1}: ${c.relPath} (${c.size} bytes, ${c.refs} references) ---
${c.preview}
---`).join('\n\n')}

Valid target categories: ${Array.from(VALID_CATEGORIES).join(', ')}

Respond in EXACTLY this YAML format (no extra text, no code fences):

For SAME entity (merge):
decision: MERGE
target_category: <category like "people/politicians">
reason: <one line explanation>

For DIFFERENT entities (rename):
decision: RENAME
entries:
  - path: <path of entry to KEEP as ${id}>
    category: <target category>
  - path: <path of entry to RENAME>
    new_id: <NEW_UNIQUE_ID>
    category: <target category>
reason: <one line explanation>`;

  const result = callClaude(prompt, 60_000);
  if (!result) {
    console.error(`  Failed to analyze ${id}, skipping`);
    return null;
  }

  try {
    const decision = yaml.parse(result);

    if (decision.decision === 'MERGE') {
      const contentCopies = copyDetails.filter(c => !isStub(c.size));
      contentCopies.sort((a, b) => b.size - a.size);
      const stubs = copyDetails.filter(c => isStub(c.size));

      const targetCat = decision.target_category || contentCopies[0].category;
      const targetPath = `${targetCat}/${id}.md`;

      // merge_from = all content copies NOT already at the target path
      const mergeFrom = contentCopies.filter(c => c.relPath !== targetPath);

      const totalRefsToRewrite = copyDetails
        .filter(c => c.relPath !== targetPath)
        .reduce((sum, c) => sum + c.refs, 0);

      const action: DedupMergeAction = {
        id,
        type: 'DEDUP_MERGE',
        target: targetPath,
        merge_from: mergeFrom.map(c => c.relPath),
        delete: stubs.map(c => c.relPath),
        refs_to_rewrite: totalRefsToRewrite,
      };
      return action;

    } else if (decision.decision === 'RENAME') {
      const entries = decision.entries.map((e: any) => {
        if (e.new_id) {
          return {
            path: e.path,
            rename_to: e.new_id,
            move_to: `${e.category}/${e.new_id}.md`,
          };
        } else {
          return {
            path: e.path,
            keep_as: id,
            move_to: `${e.category}/${id}.md`,
          };
        }
      });

      const stubs = copyDetails.filter(c =>
        !entries.some((e: any) => e.path === c.relPath)
      );

      const totalRefsToRewrite = copyDetails.reduce((sum, c) => sum + c.refs, 0);

      const action: DedupRenameAction = {
        id,
        type: 'DEDUP_RENAME',
        entries,
        delete: stubs.map(c => c.relPath),
        refs_to_rewrite: totalRefsToRewrite,
      };
      return action;
    }
  } catch (e) {
    console.error(`  Failed to parse Claude response for ${id}: ${e}`);
    console.error(`  Response was: ${result.substring(0, 200)}`);
  }

  return null;
}

// ── Analyze command ─────────────────────────────────────────────────────────

async function analyze(): Promise<void> {
  console.log('Phase 1: Building glossary index...');
  const glossaryIndex = buildGlossaryIndex();
  console.log(`  ${glossaryIndex.size} unique IDs found`);

  console.log('\nPhase 2: Building reference index...');
  const contentFiles = getAllContentFiles();
  console.log(`  Scanning ${contentFiles.length} content files...`);
  const refCounts = buildRefIndex(contentFiles);
  console.log(`  ${refCounts.size} unique glossary paths referenced`);

  // Separate duplicates from singletons
  const duplicates = new Map<string, GlossaryCopy[]>();
  const singletons = new Map<string, GlossaryCopy>();

  for (const [id, copies] of glossaryIndex) {
    if (copies.length > 1) {
      duplicates.set(id, copies);
    } else {
      singletons.set(id, copies[0]);
    }
  }

  console.log(`\n  Duplicate IDs: ${duplicates.size}`);
  console.log(`  Singleton IDs: ${singletons.size}`);

  const actions: Action[] = [];

  // ── Process duplicates ──────────────────────────────────────────────────

  console.log('\nPhase 3: Processing duplicate groups...');

  let simpleCount = 0;
  let multiCount = 0;

  for (const [id, copies] of duplicates) {
    const contentCopies = copies.filter(c => !isStub(c.size));
    const stubCopies = copies.filter(c => isStub(c.size));

    if (contentCopies.length <= 1) {
      // Simple case: 1 content + stubs (or all stubs)
      simpleCount++;
      const keeper = contentCopies[0] || stubCopies[0]; // prefer content, fallback to first stub
      const toDelete = copies.filter(c => c.relPath !== keeper.relPath);

      // Determine target category
      const targetCat = getTargetCategory(keeper.category);
      const finalPath = targetCat
        ? `${targetCat}/${id}.md`
        : keeper.relPath;

      const refsToRewrite = toDelete.reduce(
        (sum, c) => sum + (refCounts.get(c.relPath) || 0),
        0
      ) + (finalPath !== keeper.relPath ? (refCounts.get(keeper.relPath) || 0) : 0);

      const action: DedupKeepAction = {
        id,
        type: 'DEDUP_KEEP',
        keep: keeper.relPath,
        ...(finalPath !== keeper.relPath ? { move_to: finalPath } : {}),
        delete: toDelete.map(c => c.relPath),
        refs_to_rewrite: refsToRewrite,
      };

      actions.push(action);
    } else {
      // Multi-content case: needs Claude
      multiCount++;
      process.stdout.write(`  Analyzing ${id} (${contentCopies.length} content files)... `);

      const action = analyzeMultiContentGroup(id, copies, refCounts);
      if (action) {
        actions.push(action);
        console.log(action.type === 'DEDUP_MERGE' ? 'MERGE' : 'RENAME');
      } else {
        console.log('FAILED (skipped)');
      }
    }
  }

  console.log(`\n  Simple dedup (auto): ${simpleCount}`);
  console.log(`  Multi-content (Claude): ${multiCount}`);

  // ── Process singletons in wrong categories ────────────────────────────

  console.log('\nPhase 4: Checking singletons for category moves...');

  let moveCount = 0;

  for (const [id, copy] of singletons) {
    const targetCat = getTargetCategory(copy.category);
    if (targetCat) {
      const newPath = `${targetCat}/${id}.md`;
      const refs = refCounts.get(copy.relPath) || 0;

      actions.push({
        id,
        type: 'MOVE',
        from: copy.relPath,
        to: newPath,
        refs_to_rewrite: refs,
      });
      moveCount++;
    }
  }

  console.log(`  ${moveCount} entries need category moves`);

  // ── Generate plan ─────────────────────────────────────────────────────

  const plan: Plan = {
    generated: new Date().toISOString(),
    summary: {
      duplicate_groups: duplicates.size,
      dedup_keep: actions.filter(a => a.type === 'DEDUP_KEEP').length,
      dedup_merge: actions.filter(a => a.type === 'DEDUP_MERGE').length,
      dedup_rename: actions.filter(a => a.type === 'DEDUP_RENAME').length,
      moves: actions.filter(a => a.type === 'MOVE').length,
      total_refs_to_rewrite: actions.reduce((sum, a) => sum + a.refs_to_rewrite, 0),
    },
    actions,
  };

  const planPath = path.join(BASE_PATH, 'dedup-plan.yaml');
  fs.writeFileSync(planPath, yaml.stringify(plan, { lineWidth: 120 }), 'utf-8');

  console.log(`\n=== Plan written to ${planPath} ===`);
  console.log(`  DEDUP_KEEP:   ${plan.summary.dedup_keep}`);
  console.log(`  DEDUP_MERGE:  ${plan.summary.dedup_merge}`);
  console.log(`  DEDUP_RENAME: ${plan.summary.dedup_rename}`);
  console.log(`  MOVE:         ${plan.summary.moves}`);
  console.log(`  Total refs:   ${plan.summary.total_refs_to_rewrite}`);
  console.log('\nReview the plan, then run: just glossary-dedup-execute dedup-plan.yaml');
}

// ── Execute command ─────────────────────────────────────────────────────────

function rewriteRefs(
  contentFiles: string[],
  pathMap: Map<string, string>, // old glossary path → new glossary path
  idMap: Map<string, string>,   // old ID → new ID (for frontmatter + display text)
  dryRun: boolean,
): { filesUpdated: number; refsUpdated: number; frontmatterUpdated: number } {
  let filesUpdated = 0;
  let refsUpdated = 0;
  let frontmatterUpdated = 0;

  for (const file of contentFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    // Rewrite glossary links
    content = content.replace(
      new RegExp(GLOSSARY_LINK_PATTERN.source, 'g'),
      (match, displayText, linkPath) => {
        const newPath = pathMap.get(linkPath);
        if (!newPath) return match;

        refsUpdated++;
        // Also update display text if ID changed
        const oldId = path.basename(linkPath, '.md');
        const newId = idMap.get(oldId);
        const newDisplay = newId ? displayText.replace(oldId, newId) : displayText;
        return `[${newDisplay}](../_glossary/${newPath})`;
      }
    );

    // Rewrite frontmatter entity lists (for RENAME actions)
    if (idMap.size > 0 && file.includes('/_original/')) {
      const lines = content.split('\n');
      let inFrontmatter = false;
      let inRelevantList = false;
      const relevantLists = ['people:', 'places:', 'themes:', 'culture:'];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === '---') {
          inFrontmatter = !inFrontmatter;
          if (!inFrontmatter) inRelevantList = false;
          continue;
        }
        if (!inFrontmatter) continue;

        if (relevantLists.some(l => line.startsWith(l))) {
          inRelevantList = true;
          continue;
        }
        if (inRelevantList && !line.startsWith(' ') && !line.startsWith('\t') && line.trim() !== '') {
          inRelevantList = false;
        }

        if (inRelevantList) {
          const itemMatch = line.match(FRONTMATTER_ITEM_PATTERN);
          if (itemMatch) {
            const [, prefix, value] = itemMatch;
            const newId = idMap.get(value);
            if (newId) {
              lines[i] = `${prefix}${newId}`;
              frontmatterUpdated++;
            }
          }
        }
      }
      content = lines.join('\n');
    }

    if (content !== original) {
      filesUpdated++;
      if (!dryRun) {
        fs.writeFileSync(file, content, 'utf-8');
      }
    }
  }

  return { filesUpdated, refsUpdated, frontmatterUpdated };
}

function deleteFile(relPath: string, dryRun: boolean): void {
  const fullPath = path.join(GLOSSARY_BASE, relPath);
  if (!fs.existsSync(fullPath)) return;

  if (!dryRun) {
    fs.unlinkSync(fullPath);
    // Clean up empty parent directories
    let dir = path.dirname(fullPath);
    while (dir !== GLOSSARY_BASE) {
      try {
        const items = fs.readdirSync(dir);
        if (items.length === 0) {
          fs.rmdirSync(dir);
          dir = path.dirname(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

function moveFile(fromRel: string, toRel: string, dryRun: boolean): void {
  const fromFull = path.join(GLOSSARY_BASE, fromRel);
  const toFull = path.join(GLOSSARY_BASE, toRel);

  if (!fs.existsSync(fromFull)) {
    console.error(`  Warning: source file not found: ${fromRel}`);
    return;
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(toFull), { recursive: true });
    fs.renameSync(fromFull, toFull);

    // Clean up empty source directory
    let dir = path.dirname(fromFull);
    while (dir !== GLOSSARY_BASE) {
      try {
        const items = fs.readdirSync(dir);
        if (items.length === 0) {
          fs.rmdirSync(dir);
          dir = path.dirname(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

async function execute(planPath: string, dryRun: boolean): Promise<void> {
  if (!fs.existsSync(planPath)) {
    console.error(`Error: Plan file not found: ${planPath}`);
    process.exit(1);
  }

  const planContent = fs.readFileSync(planPath, 'utf-8');
  const plan: Plan = yaml.parse(planContent);

  if (dryRun) {
    console.log('=== DRY RUN (no changes will be made) ===\n');
  }

  console.log(`Plan: ${plan.actions.length} actions`);
  console.log(`  DEDUP_KEEP:   ${plan.summary.dedup_keep}`);
  console.log(`  DEDUP_MERGE:  ${plan.summary.dedup_merge}`);
  console.log(`  DEDUP_RENAME: ${plan.summary.dedup_rename}`);
  console.log(`  MOVE:         ${plan.summary.moves}`);

  console.log('\nScanning content files...');
  const contentFiles = getAllContentFiles();
  console.log(`  ${contentFiles.length} content files`);

  let totalFilesUpdated = 0;
  let totalRefsRewritten = 0;
  let totalFrontmatterUpdated = 0;
  let totalFilesDeleted = 0;
  let totalFilesMoved = 0;
  let totalMerges = 0;
  let errors: string[] = [];

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i];
    const progress = `[${i + 1}/${plan.actions.length}]`;

    try {
      switch (action.type) {
        case 'DEDUP_KEEP': {
          const finalPath = action.move_to || action.keep;
          console.log(`${progress} DEDUP_KEEP ${action.id} → ${finalPath}`);

          // Build path map: all old paths → final path
          const pathMap = new Map<string, string>();
          for (const del of action.delete) {
            pathMap.set(del, finalPath);
          }
          if (action.move_to && action.move_to !== action.keep) {
            pathMap.set(action.keep, action.move_to);
          }

          // Rewrite refs
          if (pathMap.size > 0) {
            const result = rewriteRefs(contentFiles, pathMap, new Map(), dryRun);
            totalFilesUpdated += result.filesUpdated;
            totalRefsRewritten += result.refsUpdated;
          }

          // Delete stubs
          for (const del of action.delete) {
            deleteFile(del, dryRun);
            totalFilesDeleted++;
          }

          // Move file if category changed
          if (action.move_to && action.move_to !== action.keep) {
            moveFile(action.keep, action.move_to, dryRun);
            totalFilesMoved++;
          }
          break;
        }

        case 'DEDUP_MERGE': {
          console.log(`${progress} DEDUP_MERGE ${action.id} → ${action.target}`);

          // Build path map
          const pathMap = new Map<string, string>();
          for (const src of action.merge_from) {
            pathMap.set(src, action.target);
          }
          if (action.delete) {
            for (const del of action.delete) {
              pathMap.set(del, action.target);
            }
          }
          // Also redirect any refs pointing to paths that aren't the target
          const allPaths = [
            ...action.merge_from,
            ...(action.delete || []),
          ];
          // If target is at a new location, also redirect from all old locations
          for (const p of allPaths) {
            if (p !== action.target) {
              pathMap.set(p, action.target);
            }
          }

          // Rewrite refs first
          if (pathMap.size > 0) {
            const result = rewriteRefs(contentFiles, pathMap, new Map(), dryRun);
            totalFilesUpdated += result.filesUpdated;
            totalRefsRewritten += result.refsUpdated;
          }

          // Merge content files
          if (!dryRun && action.merge_from.length > 0) {
            const targetFull = path.join(GLOSSARY_BASE, action.target);
            let targetContent: string;

            // If target file exists at current location, read it
            // The target might need to be created from the largest source
            if (fs.existsSync(targetFull)) {
              targetContent = fs.readFileSync(targetFull, 'utf-8');
            } else {
              // Find the largest file among all copies to be the base
              const allSources = [...action.merge_from];
              let bestSource = allSources[0];
              let bestSize = 0;
              for (const src of allSources) {
                const srcFull = path.join(GLOSSARY_BASE, src);
                if (fs.existsSync(srcFull)) {
                  const size = fs.statSync(srcFull).size;
                  if (size > bestSize) {
                    bestSize = size;
                    bestSource = src;
                  }
                }
              }
              targetContent = fs.readFileSync(path.join(GLOSSARY_BASE, bestSource), 'utf-8');
              // Create target directory
              fs.mkdirSync(path.dirname(targetFull), { recursive: true });
              fs.writeFileSync(targetFull, targetContent, 'utf-8');
            }

            // Merge each source into target
            for (const src of action.merge_from) {
              const srcFull = path.join(GLOSSARY_BASE, src);
              if (!fs.existsSync(srcFull) || src === action.target) continue;

              const srcContent = fs.readFileSync(srcFull, 'utf-8');
              if (isStub(srcContent.length)) continue; // skip stubs

              const merged = smartMergeGlossaryContent(
                path.basename(src, '.md'), srcContent,
                action.id, targetContent,
              );

              if (merged) {
                targetContent = merged;
                fs.writeFileSync(targetFull, merged + '\n', 'utf-8');
                totalMerges++;
              }
            }
          }

          // Delete sources and stubs
          const toDelete = [...action.merge_from, ...(action.delete || [])];
          for (const del of toDelete) {
            if (del !== action.target) {
              deleteFile(del, dryRun);
              totalFilesDeleted++;
            }
          }
          break;
        }

        case 'DEDUP_RENAME': {
          console.log(`${progress} DEDUP_RENAME ${action.id}`);

          const pathMap = new Map<string, string>();
          const idMap = new Map<string, string>();

          for (const entry of action.entries) {
            if (entry.rename_to) {
              // This entry gets a new ID
              pathMap.set(entry.path, entry.move_to);
              idMap.set(action.id, entry.rename_to);
              console.log(`  ${entry.path} → ${entry.move_to} (rename to ${entry.rename_to})`);
            } else if (entry.keep_as) {
              // This entry keeps the original ID
              if (entry.path !== entry.move_to) {
                pathMap.set(entry.path, entry.move_to);
              }
              console.log(`  ${entry.path} → ${entry.move_to} (keep as ${entry.keep_as})`);
            }
          }

          // Delete stubs
          if (action.delete) {
            for (const del of action.delete) {
              // Point stub refs to the kept entry's new path
              const keptEntry = action.entries.find(e => e.keep_as);
              if (keptEntry) {
                pathMap.set(del, keptEntry.move_to);
              }
            }
          }

          // Rewrite refs — NOTE: for RENAME, we need special handling
          // Refs that matched the renamed entry's OLD path get the NEW path
          // Refs that matched other paths get the kept entry's path
          // But we can't distinguish by content — we rely on the path being different
          if (pathMap.size > 0) {
            const result = rewriteRefs(contentFiles, pathMap, idMap, dryRun);
            totalFilesUpdated += result.filesUpdated;
            totalRefsRewritten += result.refsUpdated;
            totalFrontmatterUpdated += result.frontmatterUpdated;
          }

          // Move/rename files
          for (const entry of action.entries) {
            if (entry.path !== entry.move_to) {
              moveFile(entry.path, entry.move_to, dryRun);
              totalFilesMoved++;
            }
          }

          // Delete stubs
          if (action.delete) {
            for (const del of action.delete) {
              deleteFile(del, dryRun);
              totalFilesDeleted++;
            }
          }
          break;
        }

        case 'MOVE': {
          console.log(`${progress} MOVE ${action.id}: ${action.from} → ${action.to}`);

          const pathMap = new Map<string, string>();
          pathMap.set(action.from, action.to);

          const result = rewriteRefs(contentFiles, pathMap, new Map(), dryRun);
          totalFilesUpdated += result.filesUpdated;
          totalRefsRewritten += result.refsUpdated;

          moveFile(action.from, action.to, dryRun);
          totalFilesMoved++;
          break;
        }
      }
    } catch (e) {
      const msg = `Error processing ${action.type} ${action.id}: ${e}`;
      console.error(`  ${msg}`);
      errors.push(msg);
    }
  }

  console.log('\n=== Execution Summary ===');
  console.log(`Actions processed:   ${plan.actions.length}`);
  console.log(`Content files updated: ${totalFilesUpdated}`);
  console.log(`References rewritten:  ${totalRefsRewritten}`);
  console.log(`Frontmatter updated:   ${totalFrontmatterUpdated}`);
  console.log(`Glossary files deleted: ${totalFilesDeleted}`);
  console.log(`Glossary files moved:   ${totalFilesMoved}`);
  console.log(`Content merges (Claude): ${totalMerges}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) {
      console.log(`  - ${e}`);
    }
  }

  if (dryRun) {
    console.log('\nDry run complete. Run without --dry-run to apply changes.');
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function showHelp(): void {
  console.log(`
Glossary Dedup + Restructure CLI

Deduplicate glossary entries and restructure into target categories.

Usage:
  npx tsx src/scripts/glossary-dedup.ts <command> [options]

Commands:
  analyze                Generate dedup-plan.yaml with all proposed changes
  execute <plan.yaml>    Execute a plan file

Options:
  --dry-run, -n          Preview changes without modifying files
  --help, -h             Show this help message

Workflow:
  1. just glossary-dedup-analyze          # Generate plan
  2. Review/edit dedup-plan.yaml          # Human review
  3. just glossary-dedup-dry plan.yaml    # Dry run
  4. just glossary-dedup-execute plan.yaml # Apply changes
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let command = '';
  const positional: string[] = [];
  let dryRun = false;

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-n') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  switch (command) {
    case 'analyze':
      await analyze();
      break;

    case 'execute':
      if (positional.length === 0) {
        console.error('Error: Please provide a plan file path');
        process.exit(1);
      }
      await execute(positional[0], dryRun);
      break;

    default:
      showHelp();
      process.exit(command ? 1 : 0);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
