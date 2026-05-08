#!/usr/bin/env npx tsx

/**
 * Build Offline Manifest
 *
 * Generates a JSON manifest with build metadata (git commit, timestamp, version)
 * for the frontend PWA to detect content staleness.
 *
 * Usage:
 *   npx tsx src/scripts/build-offline-manifest.ts
 *   just fe-offline-manifest
 *
 * Output:
 *   src/frontend/public/data/offline-manifest.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const BASE_PATH = process.cwd();
const OUTPUT_PATH = path.join(BASE_PATH, 'src/frontend/public/data/offline-manifest.json');
const PACKAGE_PATH = path.join(BASE_PATH, 'src/frontend/package.json');

function main() {
  console.log('Building offline manifest...\n');

  // Read git commit hash
  const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

  // Read version from frontend package.json
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'));
  const version: string = pkg.version || '0.0.0';

  // Build timestamp
  const built = new Date().toISOString();

  // Build manifest
  const manifest = { commit, built, version };

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
  const json = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(OUTPUT_PATH, json);

  // Print summary
  console.log(`Commit:   ${commit}`);
  console.log(`Built:    ${built}`);
  console.log(`Version:  ${version}`);
  console.log(`\nOutput: ${OUTPUT_PATH}`);
}

main();
