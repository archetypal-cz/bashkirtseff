#!/usr/bin/env npx tsx

/**
 * i18n Locale Diff
 *
 * Compares locale JSON files and reports missing translation keys.
 *
 * Usage:
 *   npx tsx src/scripts/i18n-diff.ts                        # Compare all locales against each other
 *   npx tsx src/scripts/i18n-diff.ts --reference cs         # Compare all others against cs.json
 *   npx tsx src/scripts/i18n-diff.ts --reference cs --target en  # Compare en against cs only
 *   just i18n-diff --reference cs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const LOCALES_DIR = path.join(process.cwd(), 'src/frontend/src/i18n/locales');

// --- Key flattening ---

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flattenKeys(value as Record<string, unknown>, fullKey)) {
        result.set(k, v);
      }
    } else {
      result.set(fullKey, String(value));
    }
  }
  return result;
}

// --- Arg parsing ---

function parseArgs(): { reference?: string; target?: string } {
  const args = process.argv.slice(2);
  let reference: string | undefined;
  let target: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reference' && args[i + 1]) {
      reference = args[++i];
    } else if (args[i] === '--target' && args[i + 1]) {
      target = args[++i];
    } else {
      console.error(`Unknown argument: ${args[i]}`);
      console.error('Usage: i18n-diff.ts [--reference LOCALE] [--target LOCALE]');
      process.exit(1);
    }
  }

  if (target && !reference) {
    console.error('Error: --target requires --reference');
    process.exit(1);
  }

  return { reference, target };
}

// --- Locale loading ---

function discoverLocales(): string[] {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`Locale directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }
  return fs.readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}

function loadLocale(locale: string): Map<string, string> {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Locale file not found: ${filePath}`);
    console.error(`Available locales: ${discoverLocales().join(', ')}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return flattenKeys(data);
}

// --- Diff logic ---

interface DiffResult {
  targetLocale: string;
  missingKeys: { key: string; referenceValue: string }[];
}

function diffLocales(
  referenceLocale: string,
  referenceKeys: Map<string, string>,
  targetLocale: string,
  targetKeys: Map<string, string>,
): DiffResult {
  const missingKeys: { key: string; referenceValue: string }[] = [];
  for (const [key, value] of referenceKeys) {
    if (!targetKeys.has(key)) {
      missingKeys.push({ key, referenceValue: value });
    }
  }
  return { targetLocale, missingKeys };
}

// --- Output ---

function printDiff(referenceLocale: string, results: DiffResult[]) {
  let totalMissing = 0;

  for (const result of results) {
    if (result.missingKeys.length === 0) {
      console.log(`\n${result.targetLocale}.json: all keys present`);
      continue;
    }

    totalMissing += result.missingKeys.length;
    console.log(`\n${result.targetLocale}.json: ${result.missingKeys.length} missing key(s) (vs ${referenceLocale}.json)`);
    console.log('─'.repeat(60));

    for (const { key, referenceValue } of result.missingKeys) {
      const truncated = referenceValue.length > 80
        ? referenceValue.slice(0, 77) + '...'
        : referenceValue;
      console.log(`  ${key}`);
      console.log(`    ${referenceLocale}: ${truncated}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Summary: ${totalMissing} missing key(s) across ${results.length} locale(s)`);
}

// --- All-vs-all mode ---

function printAllVsAll(locales: string[], localeData: Map<string, Map<string, string>>) {
  // Collect all keys across all locales
  const allKeys = new Set<string>();
  for (const keys of localeData.values()) {
    for (const key of keys.keys()) {
      allKeys.add(key);
    }
  }

  let totalMissing = 0;

  for (const locale of locales) {
    const keys = localeData.get(locale)!;
    const missing: { key: string; presentIn: string[] }[] = [];

    for (const key of allKeys) {
      if (!keys.has(key)) {
        const presentIn = locales.filter(l => localeData.get(l)!.has(key));
        missing.push({ key, presentIn });
      }
    }

    if (missing.length === 0) {
      console.log(`\n${locale}.json: all ${keys.size} keys present`);
      continue;
    }

    totalMissing += missing.length;
    console.log(`\n${locale}.json: missing ${missing.length} key(s)`);
    console.log('─'.repeat(60));

    for (const { key, presentIn } of missing) {
      // Show the value from the first locale that has it
      const sourceLocale = presentIn[0];
      const value = localeData.get(sourceLocale)!.get(key)!;
      const truncated = value.length > 80 ? value.slice(0, 77) + '...' : value;
      console.log(`  ${key}`);
      console.log(`    ${sourceLocale}: ${truncated}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Summary: ${totalMissing} missing key(s) across ${locales.length} locale(s), ${allKeys.size} unique keys total`);
}

// --- Main ---

function main() {
  const { reference, target } = parseArgs();
  const availableLocales = discoverLocales();

  if (availableLocales.length === 0) {
    console.error('No locale files found');
    process.exit(1);
  }

  console.log(`Locales: ${availableLocales.join(', ')}`);

  if (reference) {
    // Reference mode
    const refKeys = loadLocale(reference);
    const targets = target ? [target] : availableLocales.filter(l => l !== reference);

    if (targets.length === 0) {
      console.log('No target locales to compare.');
      return;
    }

    // Validate target locale names
    for (const t of targets) {
      if (!availableLocales.includes(t)) {
        console.error(`Unknown locale: ${t}`);
        console.error(`Available locales: ${availableLocales.join(', ')}`);
        process.exit(1);
      }
    }

    console.log(`Reference: ${reference}.json (${refKeys.size} keys)`);

    const results: DiffResult[] = [];
    for (const t of targets) {
      const targetKeys = loadLocale(t);
      results.push(diffLocales(reference, refKeys, t, targetKeys));
    }

    printDiff(reference, results);
  } else {
    // All-vs-all mode
    const localeData = new Map<string, Map<string, string>>();
    for (const locale of availableLocales) {
      localeData.set(locale, loadLocale(locale));
    }

    printAllVsAll(availableLocales, localeData);
  }
}

main();
