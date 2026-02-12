#!/usr/bin/env npx tsx
/**
 * Theme Tagger
 *
 * Scans diary entries and adds inline glossary theme tags to paragraphs
 * that match keyword patterns. Text-based approach — no parse/render
 * round-trip to avoid formatting changes.
 *
 * Usage:
 *   npx tsx src/scripts/theme-tagger.ts --dry-run           # Preview all
 *   npx tsx src/scripts/theme-tagger.ts --dry-run 001       # Preview one carnet
 *   npx tsx src/scripts/theme-tagger.ts                     # Apply all
 *   npx tsx src/scripts/theme-tagger.ts 001                 # Apply one carnet
 *   npx tsx src/scripts/theme-tagger.ts --theme music       # Only one theme
 *   npx tsx src/scripts/theme-tagger.ts --stats             # Match statistics only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTENT_DIR = path.resolve('content/_original');

// ── Theme Definitions ───────────────────────────────────────────────

interface ThemeDefinition {
  id: string;
  glossaryId: string;
  glossaryPath: string;
  displayName: string;
  /** Patterns that match against text lines (case-insensitive) */
  patterns: RegExp[];
  /** Patterns that EXCLUDE a match (e.g., false positives) */
  antiPatterns?: RegExp[];
}

const THEMES: ThemeDefinition[] = [
  {
    id: 'fourth_wall',
    glossaryId: 'FOURTH_WALL',
    glossaryPath: '../_glossary/culture/themes/FOURTH_WALL.md',
    displayName: 'Fourth_wall',
    patterns: [
      /qui (?:me )?lira/i,
      /qui liront/i,
      /qui lirez/i,
      /celui qui lira/i,
      /celle qui lira/i,
      /cher(?:e|s)? lecteur/i,
      /cher(?:e|s)? lectrice/i,
      /vous qui (?:me )?lisez/i,
      /on (?:me )?lira/i,
      /ceux qui liront/i,
      /pour ceux qui/i,
      /si on lit/i,
      /si l'on lit/i,
      /si quelqu'un lit/i,
    ],
  },
  {
    id: 'meta_diary',
    glossaryId: 'META_DIARY',
    glossaryPath: '../_glossary/culture/themes/META_DIARY.md',
    displayName: 'Meta_diary',
    patterns: [
      /mon journal/i,
      /ce journal/i,
      /mon cahier/i,
      /ce cahier/i,
      /ce carnet/i,
      /ces pages/i,
      /ces lignes/i,
      /ce que j['''](?:é|e)cris/i,
      /j['''](?:é|e)cris (?:ces|ceci|ici|dans)/i,
      /en (?:é|e)crivant ceci/i,
      /(?:é|e)crire dans mon/i,
      /relire ce que/i,
      /relis(?:ant)? (?:ce|mon|ces)/i,
    ],
    antiPatterns: [
      // Avoid matching "journal" in newspaper names like "Le Journal des Débats"
      /journal des/i,
    ],
  },
  {
    id: 'music',
    glossaryId: 'MUSIC_THEME',
    glossaryPath: '../_glossary/culture/themes/MUSIC_THEME.md',
    displayName: 'Music_theme',
    patterns: [
      // Venues & events
      /(?:à |a |l['''])op(?:é|e)ra\b/i,
      /\bla musique\b/i,
      /\bconcert/i,
      // Instruments & performance
      /\bpiano\b/i,
      /(?:^|[\s,;:.'"(])chant(?:e|é|er|ons|ait|aient)\b/i,
      /(?:^|[\s,;:.'"(])chanteuse/i,
      /(?:^|[\s,;:.'"(])chanteur/i,
      /\bcantatrice/i,
      /\bviolon\b/i,
      // Composers
      /\bVerdi\b/i,
      /\bMozart\b/i,
      /\bBeethoven\b/i,
      /\bWagner\b/i,
      /\bGounod\b/i,
      /\bOffenbach\b/i,
      /\bRossini\b/i,
      /\bBellini\b/i,
      /\bDonizetti\b/i,
      /\bMeyerbeer\b/i,
      // Specific works
      /Rigoletto/i,
      /Traviata/i,
      /\bFaust\b/i,
      /\bCarmen\b/i,
      /\bAida\b/i,
      /ballo in maschera/i,
      /Barbi(?:e|è)re? de S(?:é|e)ville/i,
    ],
    antiPatterns: [
      // "chanter" as metaphor (e.g., "le coq chante") — too rare to worry about
    ],
  },
  {
    id: 'reading',
    glossaryId: 'READING',
    glossaryPath: '../_glossary/culture/themes/READING.md',
    displayName: 'Reading',
    patterns: [
      // Reading activity (with context to avoid "qui lira" overlap)
      /\blecture\b/i,
      /\blivre\b/i,
      /\blivres\b/i,
      /\broman\b/i,
      /\bromans\b/i,
      /\bbiblioth(?:è|e)que\b/i,
      /je lis\b/i,
      /j[''']ai lu\b/i,
      /nous lisons/i,
      /en lisant/i,
      // Authors
      /\bHugo\b/,
      /\bZola\b/,
      /\bBalzac\b/,
      /\bDumas\b/,
      /\bShakespeare\b/i,
      /\bMoli(?:è|e)re\b/i,
      /\bGoncourt\b/i,
      /\bGeorge Sand\b/i,
      /\bDaudet\b/i,
      /\bMaupassant\b/i,
      /\bFlaubert\b/i,
      /\bMusset\b/i,
      /\bLamartine\b/i,
      /\bPushkin\b/i,
      /\bLermontov\b/i,
      /\bMacaulay\b/i,
      /\bByron\b/i,
    ],
  },
  {
    id: 'religion',
    glossaryId: 'RELIGION',
    glossaryPath: '../_glossary/culture/themes/RELIGION.md',
    displayName: 'Religion',
    patterns: [
      /\bDieu\b/,  // case-sensitive: "Dieu" (God) not "dieu" in compounds
      /\bpri(?:è|e)re\b/i,
      /\bprier\b/i,
      /\bprie\b/i,
      /\b(?:é|e)glise\b/i,
      /\bmesse\b/i,
      /\bconfession\b/i,
      /\bcath(?:é|e)drale\b/i,
      /\bsainte?\b/i,
      /\bdivin(?:e|es|s)?\b/i,
      /\bProvidence\b/,
      /\bfoi\b/i,
      /\bP(?:â|a)ques\b/i,
      /\bNo(?:ë|e)l\b/i,
      /\bsacrement/i,
      /\bcommunion/i,
      /\bvierge\b/i,
    ],
    antiPatterns: [
      // "dieu" in exclamations like "mon dieu" still counts as religious
      // "sainte" in place names like "Sainte-Adresse" — but these are rare enough
    ],
  },
  {
    id: 'theater',
    glossaryId: 'THEATER_THEME',
    glossaryPath: '../_glossary/culture/themes/THEATER.md',
    displayName: 'Theater_theme',
    patterns: [
      /\bth(?:é|e)(?:â|a)tre\b/i,
      /\bcom(?:é|e)die\b/i,
      /\bpi(?:è|e)ce (?:de|en)/i,
      /(?:^|[\s,;:.'"(])acteur/i,
      /(?:^|[\s,;:.'"(])actrice/i,
      /\bspectacle\b/i,
      /\bdrame\b/i,
      /\btrag(?:é|e)die\b/i,
      /\bCom(?:é|e)die[- ]Fran(?:ç|c)aise/i,
      /\bSarah Bernhardt/i,
      /\bCoquelin\b/i,
      /\bvaudeville\b/i,
      /\brep(?:é|e)tition/i,
      /\brôle\b/i,
      /\bsc(?:è|e)ne\b/i,
      /\bparterre\b/i,
      /\bavant-sc(?:è|e)ne/i,
      /\bloge\b/i,
    ],
    antiPatterns: [
      // "scène" as generic "scene" (e.g., "faire une scène" = make a scene) — borderline, keep
      // "rôle" as generic "role" — borderline, but theatrical origin makes it valid
    ],
  },
  {
    id: 'art',
    glossaryId: 'ART_PRACTICE',
    glossaryPath: '../_glossary/culture/themes/ART_PRACTICE.md',
    displayName: 'Art_practice',
    patterns: [
      /\bpeindre\b/i,
      /\bpeins\b/i,
      /\bpeint(?:ure)?\b/i,
      /\btableau/i,
      /\bdessin(?:er)?\b/i,
      /\bdessine\b/i,
      /\batelier\b/i,
      /\bconcours\b/i,
      /\bmod(?:è|e)le\b/i,
      /\b(?:é|e)tude\b/i,
      /\besquisse/i,
      /\b(?:é|e)bauche/i,
      /\bSalon\b/,  // case-sensitive: art Salon, not generic "salon"
      /\bJulian\b/i,
      /\bAcad(?:é|e)mie/i,
      /Robert[- ]Fleury/i,
      /\bLefebvre\b/i,
      /\btoile\b/i,
      /\bchevalet\b/i,
      /\bpalette\b/i,
      /\bpinceau/i,
      /\bpose\b/i,
    ],
    antiPatterns: [
      // "modèle" as "model" in generic sense — rare enough
      // "étude" as "study" in academic sense — but in Marie's context usually art
      // "pose" as social posing — context-dependent, but art usage is primary
    ],
  },
  {
    id: 'love',
    glossaryId: 'LOVE',
    glossaryPath: '../_glossary/culture/themes/LOVE.md',
    displayName: 'Love',
    patterns: [
      /\bamour\b/i,
      /\bamoureuse?\b/i,
      /(?:^|[\s,;:.'"(])aimer\b/i,
      /(?:^|[\s,;:.'"(])aim(?:e|é|ée|ées|és)\b/i,
      /\bj[''']aime\b/i,
      /\bpassion\b/i,
      /\bjalousie\b/i,
      /\bjaloux\b/i,
      /\bjalouse\b/i,
      /\bmariage\b/i,
      /\b(?:é|e)pouser/i,
      /\bfiancé/i,
      /\bcoeur\b/i,
      /\bcœur\b/i,
    ],
    antiPatterns: [
      // "aimer" in casual "j'aime les fleurs" — some false positives, but Marie's usage is overwhelmingly romantic or emotionally charged
      // "passion" for art — valid overlap, art IS her passion
      // "coeur" in "par coeur" (by heart) — rare enough
    ],
  },
  {
    id: 'philosophy',
    glossaryId: 'PHILOSOPHY',
    glossaryPath: '../_glossary/culture/themes/PHILOSOPHY.md',
    displayName: 'Philosophy',
    patterns: [
      /\bphilosoph/i,
      /\bâme\b/i,
      /\bdestin(?:é|e)?e?\b/i,
      /\bgloire\b/i,
      /\bexistence\b/i,
      /\bv(?:é|e)rit(?:é|e)\b/i,
      /\bmortal(?:e|ité)/i,
      /\bimmortal(?:e|ité)/i,
      /\bEpict(?:è|e)te/i,
      /\bLa Rochefoucauld/i,
      /\bMarc[- ]Aur(?:è|e)le/i,
      /\bPascal\b/,
      /\bn(?:é|e)ant\b/i,
      /\b(?:é|e)ternit(?:é|e)\b/i,
      /\bsens de la vie/i,
      /\bpourquoi (?:vivre|mourir|souffrir)/i,
    ],
    antiPatterns: [
      // "gloire" — could be mundane "glory" but in Marie's usage it's almost always the grand philosophical concept
      // "destinée" — sometimes casual fate, usually existential in Marie
    ],
  },
  {
    id: 'emotions',
    glossaryId: 'EMOTIONS',
    glossaryPath: '../_glossary/culture/themes/EMOTIONS.md',
    displayName: 'Emotions',
    patterns: [
      // Explicit emotional self-analysis (not just feeling, but naming/examining the feeling)
      /je suis triste/i,
      /je suis gaie/i,
      /je suis furieuse/i,
      /je suis d(?:é|e)sesp(?:é|e)r/i,
      /je suis heureuse/i,
      /je suis malheureuse/i,
      /\btristesse\b/i,
      /\bennui\b/i,
      /\bd(?:é|e)sespoir\b/i,
      /\bm(?:é|e)lancolie\b/i,
      /\bangoisse\b/i,
      /\bfureur\b/i,
      /\brage\b/i,
      /\bbonheur\b/i,
      /\bhonte\b/i,
      /\bd(?:é|e)go(?:û|u)t\b/i,
      /\benthousiasme\b/i,
      /je pleure\b/i,
      /j[''']ai pleur(?:é|e)/i,
      /\blarmes\b/i,
      /\bsanglot/i,
    ],
  },
  {
    id: 'politics',
    glossaryId: 'POLITICS',
    glossaryPath: '../_glossary/culture/themes/POLITICS.md',
    displayName: 'Politics',
    patterns: [
      /\bpolitique\b/i,
      /\b(?:é|e)lection/i,
      /\br(?:é|e)publicain/i,
      /\br(?:é|e)publique\b/i,
      /\bbonapartist/i,
      /\bmonarchist/i,
      /\bGambetta\b/i,
      /\bCassagnac\b/i,
      /\bd(?:é|e)put(?:é|e)\b/i,
      /\bChambre\b/,  // case-sensitive: Chamber (of Deputies)
      /\bS(?:é|e)nat\b/i,
      /\bministre\b/i,
      /\bgouvernement\b/i,
      /\bsuffrage\b/i,
      /\bvot(?:e|er)\b/i,
      /\bpatrie\b/i,
    ],
    antiPatterns: [
      // "Chambre" as room — case-sensitive helps (Chamber vs. chambre)
    ],
  },
  {
    id: 'health',
    glossaryId: 'HEALTH',
    glossaryPath: '../_glossary/culture/themes/HEALTH.md',
    displayName: 'Health',
    patterns: [
      /\bmalade\b/i,
      /\bmaladie\b/i,
      /\bm(?:é|e)decin\b/i,
      /\bdocteur\b/i,
      /\bfi(?:è|e)vre\b/i,
      /\btousse\b/i,
      /\btoux\b/i,
      /\bgorge\b/i,
      /\bpoumon/i,
      /\bsouffr(?:e|ir|ant)/i,
      /\bgu(?:é|e)rir/i,
      /\bremède/i,
      /\bordonnance/i,
      /\btemp(?:é|e)rature\b/i,
      /\bfatigu(?:é|e|ée)/i,
    ],
    antiPatterns: [
      // "souffrir" as emotional suffering — valid overlap, both count
      // "gorge" in geographic sense — rare enough
      // "fatiguée" could be casual tiredness — but signals health concern in Marie's later diary
    ],
  },
  {
    id: 'death',
    glossaryId: 'DEATH',
    glossaryPath: '../_glossary/culture/themes/DEATH.md',
    displayName: 'Death',
    patterns: [
      // Funeral & burial
      /\benterrement\b/i,
      /\bfun(?:é|e)railles\b/i,
      /\bfun(?:è|e)bre/i,
      /\bcercueil/i,
      /\bobs(?:è|e)ques\b/i,
      /\bmortuaire/i,
      /\bpompes fun(?:è|e)bres/i,
      /\bpannychide/i,
      // Mourning & bereaved
      /\bdeuil\b/i,
      /\bveuve\b/i,
      /\bveuf\b/i,
      /\bcondol(?:é|e)ances/i,
      // Tomb & cemetery
      /\btombeau/i,
      /\bs(?:é|e)pulcre/i,
      /\bs(?:é|e)pulture/i,
      /\bcimeti(?:è|e)re/i,
      // Deceased
      /\bd(?:é|e)funt/i,
      /\bd(?:é|e)c(?:è|e)s\b/i,
      /\bd(?:é|e)c(?:é|e)d(?:é|e)/i,
      // Dying
      /\bagonie\b/i,
      /\bagonisant/i,
    ],
  },
  {
    id: 'mortality',
    glossaryId: 'MORTALITY',
    glossaryPath: '../_glossary/culture/themes/MORTALITY.md',
    displayName: 'Mortality',
    patterns: [
      // Death (noun/adjective)
      /\bmort[es]?\b/i,
      /\bmortel(?:le)?s?\b/i,
      // Dying (all conjugations)
      /\bmourir\b/i,
      /\bmeurt\b/i,
      /\bmeure\b/i,
      /\bmeurent\b/i,
      /\bmourr/i,
      /\bmourant/i,
      /\bmourons\b/i,
      /\bmourez\b/i,
      // Killing (literal and figurative)
      /\btuer\b/i,
      /\btue\b/i,
      /\btu(?:é|e)e?s?\b/i,
      /\bassassin(?:e|er|é)/i,
      /\bempoisonn/i,
      // Other
      /\bsuicide/i,
      /\bp(?:é|e)rir\b/i,
      /\bp(?:é|e)ri[es]?\b/i,
      /\bcadavre/i,
      /\bfatal(?:e|es)?\b/i,
      /\btr(?:é|e)pas\b/i,
      /\bdernier soupir/i,
    ],
    antiPatterns: [
      // "morte-saison" (off-season) — not about death
      /morte[- ]saison/i,
    ],
  },
  {
    id: 'diseases',
    glossaryId: 'DISEASES',
    glossaryPath: '../_glossary/culture/themes/DISEASES.md',
    displayName: 'Diseases',
    patterns: [
      // Tuberculosis (Marie's period term)
      /\bphtisie/i,
      /\bphtisique/i,
      // Infectious diseases
      /\bchol(?:é|e)ra\b/i,
      /\btyphus\b/i,
      /\btypho(?:ï|i)de\b/i,
      /\bvariole\b/i,
      // Respiratory diseases
      /\blaryngite\b/i,
      /\bbronchite\b/i,
      /\bpleur(?:é|e)sie\b/i,
      /\bcatarrhe\b/i,
      /\bpharyngite\b/i,
      /\bp(?:é|e)ri-bronchite/i,
      /\bcongestion pulmonaire/i,
      // Other conditions
      /\ban(?:é|e)mie\b/i,
      /\ban(?:é|e)vrisme\b/i,
    ],
  },
];

// ── Paragraph Block Parsing ─────────────────────────────────────────

/** Paragraph ID patterns for both old and new formats */
const PARA_ID_PATTERN = /^%%\s*(?:\d{2,3}|GLO_[A-Z0-9_]+|SUM\.\d{3})\.\d+\s*%%$/;
const OLD_PARA_ID_PATTERN = /^\[\/\/\]: # \(\d+\.\d+\)$/;

interface ParagraphBlock {
  /** Line index where this paragraph starts (the ID line) */
  startLine: number;
  /** Line index after the last line of this paragraph */
  endLine: number;
  /** The paragraph ID (e.g., "001.0005") */
  paraId: string;
  /** Text-only lines (non-comment, non-empty) */
  textLines: string[];
  /** All lines in this block */
  allLines: string[];
  /** Existing theme tags already present */
  existingThemeTags: Set<string>;
}

/**
 * Split file content into frontmatter + paragraph blocks.
 * Returns the frontmatter section and array of paragraph blocks.
 */
function parseBlocks(content: string): { frontmatter: string; blocks: ParagraphBlock[]; trailing: string } {
  const lines = content.split('\n');
  const blocks: ParagraphBlock[] = [];

  // Find end of frontmatter
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

  // Find paragraph blocks
  let currentBlock: ParagraphBlock | null = null;

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check for paragraph ID
    const isNewId = PARA_ID_PATTERN.test(trimmed);
    const isOldId = OLD_PARA_ID_PATTERN.test(trimmed);

    if (isNewId || isOldId) {
      // Save previous block
      if (currentBlock) {
        currentBlock.endLine = i;
        blocks.push(currentBlock);
      }

      // Extract paragraph ID
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
        existingThemeTags: new Set(),
      };
      currentBlock.allLines.push(lines[i]);
      continue;
    }

    if (currentBlock) {
      currentBlock.allLines.push(lines[i]);

      // Classify the line
      if (trimmed.startsWith('%%') && trimmed.endsWith('%%')) {
        // Comment line — check for existing theme tags
        for (const theme of THEMES) {
          if (trimmed.includes(theme.glossaryPath) || trimmed.includes(theme.glossaryId)) {
            currentBlock.existingThemeTags.add(theme.id);
          }
        }
      } else if (trimmed.startsWith('[^')) {
        // Footnote — skip
      } else if (trimmed.startsWith('[//]: #')) {
        // Old comment — check for theme tags
        for (const theme of THEMES) {
          if (trimmed.includes(theme.glossaryPath) || trimmed.includes(theme.glossaryId)) {
            currentBlock.existingThemeTags.add(theme.id);
          }
        }
      } else if (trimmed && !trimmed.startsWith('#')) {
        // Regular text line (not a header)
        currentBlock.textLines.push(trimmed);
      } else if (trimmed.startsWith('#')) {
        // Header — also check for keywords (Marie sometimes titles with thematic words)
        currentBlock.textLines.push(trimmed);
      }
    }
  }

  // Push last block
  if (currentBlock) {
    currentBlock.endLine = lines.length;
    blocks.push(currentBlock);
  }

  // Trailing content (after last paragraph)
  const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].endLine : bodyStart;
  const trailing = lines.slice(lastEnd).join('\n');

  return { frontmatter, blocks, trailing };
}

// ── Theme Matching ──────────────────────────────────────────────────

function matchesTheme(block: ParagraphBlock, theme: ThemeDefinition): boolean {
  const text = block.textLines.join(' ');
  if (!text) return false;

  // Check if any pattern matches
  const hasMatch = theme.patterns.some(p => p.test(text));
  if (!hasMatch) return false;

  // Check anti-patterns
  if (theme.antiPatterns?.length) {
    // If anti-pattern matches, check if there's still a valid match after removing anti-pattern context
    // Simple approach: if anti-pattern matches, still allow if there's ALSO a match elsewhere
    const antiMatch = theme.antiPatterns.some(p => p.test(text));
    if (antiMatch) {
      // Remove anti-pattern text and re-check
      let cleaned = text;
      for (const ap of theme.antiPatterns) {
        cleaned = cleaned.replace(ap, '');
      }
      return theme.patterns.some(p => p.test(cleaned));
    }
  }

  return true;
}

// ── Tag Insertion ───────────────────────────────────────────────────

/**
 * Build the tag comment line for a theme
 */
function buildTagLine(theme: ThemeDefinition): string {
  return `%% [#${theme.displayName}](${theme.glossaryPath}) %%`;
}

/**
 * Insert theme tag into a paragraph block's lines.
 * Inserts after the paragraph ID line, before other content.
 */
function insertTag(blockLines: string[], theme: ThemeDefinition): string[] {
  const tagLine = buildTagLine(theme);
  const result = [blockLines[0]]; // paragraph ID line

  // Find insertion point: after para ID, before first non-tag comment or text
  let insertIdx = 1;

  // Skip existing glossary tag lines (they start with %% [# or [//]: # ([#)
  while (insertIdx < blockLines.length) {
    const trimmed = blockLines[insertIdx].trim();
    // Glossary tag line in new format
    if (trimmed.startsWith('%%') && trimmed.endsWith('%%') && trimmed.includes('[#')) {
      result.push(blockLines[insertIdx]);
      insertIdx++;
      continue;
    }
    // Glossary tag line in old format
    if (trimmed.startsWith('[//]: # (') && trimmed.includes('[#')) {
      result.push(blockLines[insertIdx]);
      insertIdx++;
      continue;
    }
    break;
  }

  // Insert theme tag
  result.push(tagLine);

  // Add remaining lines
  for (let i = insertIdx; i < blockLines.length; i++) {
    result.push(blockLines[i]);
  }

  return result;
}

// ── File Processing ─────────────────────────────────────────────────

interface TagResult {
  file: string;
  paraId: string;
  theme: string;
  textSnippet: string;
}

interface FileStats {
  file: string;
  tagsAdded: number;
  results: TagResult[];
}

function processFile(
  filePath: string,
  themes: ThemeDefinition[],
  dryRun: boolean,
): FileStats {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, blocks, trailing } = parseBlocks(content);
  const relPath = path.relative(CONTENT_DIR, filePath);

  const stats: FileStats = {
    file: relPath,
    tagsAdded: 0,
    results: [],
  };

  let modified = false;

  for (const block of blocks) {
    for (const theme of themes) {
      // Skip if already tagged
      if (block.existingThemeTags.has(theme.id)) continue;

      // Check for match
      if (matchesTheme(block, theme)) {
        stats.tagsAdded++;
        stats.results.push({
          file: relPath,
          paraId: block.paraId,
          theme: theme.id,
          textSnippet: block.textLines.join(' ').slice(0, 80),
        });

        // Insert tag
        block.allLines = insertTag(block.allLines, theme);
        block.existingThemeTags.add(theme.id);
        modified = true;
      }
    }
  }

  // Write back if modified
  if (modified && !dryRun) {
    const parts: string[] = [];
    if (frontmatter) {
      parts.push(frontmatter);
    }

    // Reconstruct body from blocks
    const bodyLines: string[] = [];
    for (const block of blocks) {
      // Add empty line before block (unless it's the first)
      if (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] !== '') {
        bodyLines.push('');
      }
      bodyLines.push(...block.allLines);
    }

    if (frontmatter) {
      parts.push(bodyLines.join('\n'));
    } else {
      parts.push(bodyLines.join('\n'));
    }

    // Preserve trailing content (footnotes, etc.)
    if (trailing.trim()) {
      parts.push(trailing);
    }

    const newContent = parts.join('\n');

    // Safety: only write if content actually changed and the file isn't dramatically different in size
    const sizeDelta = Math.abs(newContent.length - content.length);
    const maxDelta = stats.tagsAdded * 200; // ~200 chars per tag line max
    if (sizeDelta <= maxDelta + 100) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
    } else {
      console.error(`  WARNING: ${relPath} — size delta ${sizeDelta} exceeds expected ${maxDelta}. Skipping write.`);
    }
  }

  return stats;
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const statsOnly = args.includes('--stats');
  const verbose = args.includes('--verbose');

  // Theme filter
  const themeFlag = args.find(a => a.startsWith('--theme=') || a === '--theme');
  let selectedThemes = THEMES;
  if (themeFlag) {
    const themeValue = themeFlag.includes('=')
      ? themeFlag.split('=')[1]
      : args[args.indexOf('--theme') + 1];
    if (themeValue) {
      selectedThemes = THEMES.filter(t => t.id === themeValue || t.id.includes(themeValue));
      if (selectedThemes.length === 0) {
        console.error(`Unknown theme: ${themeValue}`);
        console.error(`Available: ${THEMES.map(t => t.id).join(', ')}`);
        process.exit(1);
      }
    }
  }

  // Carnet filter
  const carnetArg = args.find(a => /^\d{3}$/.test(a));

  // Get carnet directories
  let carnets: string[];
  if (carnetArg) {
    carnets = [carnetArg];
  } else {
    carnets = fs.readdirSync(CONTENT_DIR)
      .filter(f => /^\d{3}$/.test(f) && f !== '000')
      .sort();
  }

  console.log(`${dryRun ? 'DRY RUN: ' : ''}Theme tagging ${carnets.length} carnets`);
  console.log(`Themes: ${selectedThemes.map(t => t.id).join(', ')}`);
  console.log('='.repeat(60));

  // Per-theme stats
  const themeCounts = new Map<string, number>();
  const themeFiles = new Map<string, Set<string>>();
  for (const t of selectedThemes) {
    themeCounts.set(t.id, 0);
    themeFiles.set(t.id, new Set());
  }

  let totalFiles = 0;
  let totalTagsAdded = 0;
  let filesModified = 0;

  for (const carnet of carnets) {
    const carnetDir = path.join(CONTENT_DIR, carnet);
    if (!fs.existsSync(carnetDir)) continue;

    const files = fs.readdirSync(carnetDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('README') && !f.startsWith('_'))
      .sort();

    let carnetTags = 0;

    for (const file of files) {
      totalFiles++;
      const filePath = path.join(carnetDir, file);
      const stats = processFile(filePath, selectedThemes, dryRun || statsOnly);

      if (stats.tagsAdded > 0) {
        carnetTags += stats.tagsAdded;
        totalTagsAdded += stats.tagsAdded;
        filesModified++;

        for (const r of stats.results) {
          themeCounts.set(r.theme, (themeCounts.get(r.theme) || 0) + 1);
          themeFiles.get(r.theme)?.add(r.file);

          if (verbose || dryRun) {
            console.log(`  ${r.file} §${r.paraId} [${r.theme}] "${r.textSnippet}..."`);
          }
        }
      }
    }

    if (carnetTags > 0 && !verbose) {
      console.log(`Carnet ${carnet}: +${carnetTags} tags`);
    } else if (verbose && carnetTags === 0) {
      console.log(`Carnet ${carnet}: no matches`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Files scanned:  ${totalFiles}`);
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Tags added:     ${totalTagsAdded}`);
  console.log('');
  console.log('  Per theme:');
  for (const [theme, count] of themeCounts) {
    const fileCount = themeFiles.get(theme)?.size || 0;
    console.log(`    ${theme.padEnd(15)} ${String(count).padStart(5)} tags in ${String(fileCount).padStart(4)} entries`);
  }

  if (dryRun) {
    console.log(`\nThis was a dry run. Run without --dry-run to apply changes.`);
  }
  if (statsOnly) {
    console.log(`\nStats-only mode. No files were modified.`);
  }
}

main();
