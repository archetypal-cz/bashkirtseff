#!/usr/bin/env npx tsx

/**
 * Build Offline Manifest (CLI wrapper)
 *
 * Generates a JSON manifest with build metadata (git commit, timestamp, version)
 * for the frontend PWA to detect content staleness.
 *
 * The actual builder lives in src/frontend/src/lib/offline-manifest-builder.ts
 * so that `astro build` (all the production Docker image runs) regenerates the
 * manifest itself — see the header comment there.
 *
 * Usage:
 *   npx tsx src/scripts/build-offline-manifest.ts
 *   just fe-offline-manifest
 *
 * Output:
 *   src/frontend/public/data/offline-manifest.json
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeOfflineManifest } from '../frontend/src/lib/offline-manifest-builder.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_PATH = path.join(REPO_ROOT, 'src/frontend/public/data/offline-manifest.json');
const PACKAGE_PATH = path.join(REPO_ROOT, 'src/frontend/package.json');

console.log('Building offline manifest...\n');

const { manifest, changed, skipped, outputPath } = writeOfflineManifest(OUTPUT_PATH, PACKAGE_PATH);

console.log(`Commit:   ${manifest.commit}${skipped ? ' (no git commit resolved — kept existing)' : ''}`);
console.log(`Built:    ${manifest.built}`);
console.log(`Version:  ${manifest.version}`);
console.log(`\nOutput: ${outputPath}${changed ? '' : ' (unchanged)'}`);
