#!/usr/bin/env npx tsx
/**
 * add-date-headings.ts
 *
 * Adds missing `# Jour DD mois YYYY` date headings to diary entries.
 *
 * For each entry file missing a `# Date` heading:
 * 1. Reads the `date` from YAML frontmatter
 * 2. Computes the French day-of-week and formats the date
 * 3. Either promotes an existing date-text paragraph to a heading,
 *    or inserts a new `# Jour DD mois YYYY` line before the first content
 *
 * Usage:
 *   npx tsx src/scripts/add-date-headings.ts [--dry-run] [--carnet 076] [--lang original]
 *
 * --lang: original | fr | cz | en | uk  (default: all)
 * --carnet: 3-digit carnet number (default: all)
 */

import * as fs from "node:fs";
import * as path from "node:path";

// --- French date formatting ---

const FRENCH_DAYS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi",
  "Jeudi", "Vendredi", "Samedi",
];

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatFrenchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = FRENCH_DAYS[date.getDay()];
  const monthName = FRENCH_MONTHS[month - 1];
  const dayStr = day === 1 ? "1er" : String(day);
  return `${dayOfWeek} ${dayStr} ${monthName} ${year}`;
}

// --- Heading detection ---

// Match existing headings — both "# Samedi 11 janvier" and "# Samedi, 11 janvier"
const HEADING_RE =
  /^# (?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)[,\s]+\d/m;

// Plain text line that IS a French date (to be promoted to heading)
const DATE_TEXT_RE =
  /^(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+\d+(?:er)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\.?\s*$/;

// --- File processing ---

function extractDate(content: string, filePath: string): string | null {
  // Try frontmatter first
  const match = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (match) return match[1];

  // Fall back to filename (e.g., 1873-01-11.md)
  const basename = path.basename(filePath, ".md");
  if (/^\d{4}-\d{2}-\d{2}$/.test(basename)) return basename;

  return null;
}

interface ProcessResult {
  file: string;
  action: "inserted" | "promoted" | "skipped" | "error";
  heading?: string;
  reason?: string;
}

function processFile(filePath: string, dryRun: boolean): ProcessResult {
  const content = fs.readFileSync(filePath, "utf-8");

  // Skip if already has heading
  if (HEADING_RE.test(content)) {
    return { file: filePath, action: "skipped", reason: "already has heading" };
  }

  // Extract date from frontmatter
  const dateStr = extractDate(content, filePath);
  if (!dateStr) {
    return { file: filePath, action: "error", reason: "no date in frontmatter" };
  }

  const heading = formatFrenchDate(dateStr);
  const headingLine = `# ${heading}`;

  const lines = content.split("\n");

  // Find end of frontmatter (second ---)
  let frontmatterEnd = -1;
  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      dashCount++;
      if (dashCount === 2) {
        frontmatterEnd = i;
        break;
      }
    }
  }

  if (frontmatterEnd === -1) {
    // No YAML frontmatter (e.g., fr edition files) — treat as starting from line 0
    frontmatterEnd = -1;
  }

  // Scan content after frontmatter to find where to insert/promote
  let insertionPoint = -1;
  let promotionPoint = -1;

  for (let i = frontmatterEnd + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip blank lines
    if (line === "") continue;

    // Skip paragraph IDs (both formats)
    if (/^%%\s+\d{3}\.\d{4}\s+%%$/.test(line)) continue;
    if (/^\[\/\/\]:\s*#\s*\(\d+\.\d{4}\)$/.test(line)) continue;

    // Skip glossary tags
    if (/^%%\s+\[#/.test(line)) continue;
    if (/^\[\/\/\]:\s*#\s*\(\[#/.test(line)) continue;

    // Skip comment lines (RSR, LAN, TR, RED, CON, GEM, PPX)
    if (/^%%\s+\d{4}-\d{2}-\d{2}T/.test(line)) continue;

    // This is the first content line
    if (DATE_TEXT_RE.test(line)) {
      promotionPoint = i;
    } else {
      insertionPoint = i;
    }
    break;
  }

  if (promotionPoint >= 0) {
    // Promote existing date text to heading (strip trailing period)
    if (!dryRun) {
      lines[promotionPoint] = `# ${lines[promotionPoint].trim().replace(/\.\s*$/, "")}`;
      fs.writeFileSync(filePath, lines.join("\n"));
    }
    return { file: filePath, action: "promoted", heading: headingLine };
  }

  if (insertionPoint >= 0) {
    // Insert new heading line before the first content
    if (!dryRun) {
      lines.splice(insertionPoint, 0, headingLine);
      fs.writeFileSync(filePath, lines.join("\n"));
    }
    return { file: filePath, action: "inserted", heading: headingLine };
  }

  // Entry has only metadata (paragraph IDs, comments) but no text content,
  // or is completely empty after frontmatter.
  // Insert heading after the last metadata line.
  let lastMetaLine = frontmatterEnd;
  for (let i = frontmatterEnd + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    if (/^%%/.test(line) || /^\[\/\/\]:\s*#/.test(line)) {
      lastMetaLine = i;
      continue;
    }
    break;
  }

  if (!dryRun) {
    lines.splice(lastMetaLine + 1, 0, headingLine);
    fs.writeFileSync(filePath, lines.join("\n"));
  }
  return { file: filePath, action: "inserted", heading: headingLine };
}

// --- Directory listing ---

function getEntryFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

function getCarnetDirs(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir)
    .filter((d) => /^\d{3}$/.test(d))
    .sort()
    .map((d) => path.join(baseDir, d));
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const carnetIdx = args.indexOf("--carnet");
  const carnetFilter = carnetIdx >= 0 ? args[carnetIdx + 1] : null;
  const langIdx = args.indexOf("--lang");
  const langFilter = langIdx >= 0 ? args[langIdx + 1] : null;

  const LANG_DIRS: Record<string, string> = {
    original: "content/_original",
    fr: "content/fr",
    cz: "content/cz",
    en: "content/en",
    uk: "content/uk",
  };

  // Determine which language dirs to process
  // Default: only process _original (translations get headings from the translation process)
  const langDirs: string[] = [];
  if (langFilter) {
    const dir = LANG_DIRS[langFilter];
    if (!dir) {
      console.error(`Unknown language: ${langFilter}. Use: ${Object.keys(LANG_DIRS).join(", ")}`);
      process.exit(1);
    }
    langDirs.push(dir);
  } else {
    langDirs.push(LANG_DIRS.original);
  }

  // Collect all files to process
  const allFiles: string[] = [];
  for (const langDir of langDirs) {
    if (carnetFilter) {
      allFiles.push(...getEntryFiles(path.join(langDir, carnetFilter)));
    } else {
      for (const carnetDir of getCarnetDirs(langDir)) {
        allFiles.push(...getEntryFiles(carnetDir));
      }
    }
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Processing ${allFiles.length} entry files...`);

  let inserted = 0;
  let promoted = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails: ProcessResult[] = [];
  const changeDetails: ProcessResult[] = [];

  for (const file of allFiles) {
    const result = processFile(file, dryRun);
    switch (result.action) {
      case "inserted":
        inserted++;
        changeDetails.push(result);
        break;
      case "promoted":
        promoted++;
        changeDetails.push(result);
        break;
      case "skipped":
        skipped++;
        break;
      case "error":
        errors++;
        errorDetails.push(result);
        break;
    }
  }

  // Summary
  console.log(`\nResults:`);
  console.log(`  Inserted new headings: ${inserted}`);
  console.log(`  Promoted existing date text: ${promoted}`);
  console.log(`  Skipped (already has heading): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total files: ${allFiles.length}`);

  if (errors > 0) {
    console.log(`\nErrors:`);
    for (const r of errorDetails) {
      console.log(`  ${r.file}: ${r.reason}`);
    }
  }

  if (dryRun && changeDetails.length > 0) {
    console.log(`\nSample changes (first 30):`);
    for (const r of changeDetails.slice(0, 30)) {
      console.log(`  [${r.action.padEnd(8)}] ${r.file} → ${r.heading}`);
    }
    if (changeDetails.length > 30) {
      console.log(`  ... and ${changeDetails.length - 30} more`);
    }
  }
}

main();
