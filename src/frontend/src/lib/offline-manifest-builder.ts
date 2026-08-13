/**
 * Offline Manifest Builder
 *
 * Emits public/data/offline-manifest.json — the build stamp the PWA uses to tell
 * readers that their downloaded-for-offline pages are out of date.
 *
 * WHO READS IT: only `stores/offline.ts`, which fetches it with `cache:
 * 'no-store'` in `downloadScope()` (stamps each download with the current
 * `commit`) and in `checkFreshness()` (compares each stored `manifestCommit`
 * against the live one; a mismatch sets `hasStaleDownloads`, which
 * `components/pwa/OfflineStatus.vue` surfaces as "update your download").
 * `commit` is the ONLY field any consumer reads — `built` and `version` are
 * informational.
 *
 * WHY IT LIVES HERE: like the filter index, this used to be generated only by
 * `src/scripts/build-offline-manifest.ts` via `just fe-build`. The production
 * image (`Dockerfile`) copies just `src/shared`, `src/frontend` and `content/`
 * and runs bare `astro build`, so the deployed manifest was whatever a developer
 * last committed — it read `4ec0ef1e7` from 2026-07-06 while the site had moved
 * on by hundreds of commits, meaning nobody's offline download was ever flagged
 * stale. Running from an Astro integration ties the stamp to the build that
 * actually ships.
 *
 * WRITE RULE: rewrite only when `commit` or `version` actually changes, not for
 * a fresh `built` timestamp. Freshness-on-every-deploy still holds because every
 * deploy is a new commit; rebuilding the same commit is a no-op nobody can
 * observe, and skipping it keeps this committed file out of every diff.
 *
 * `src/scripts/build-offline-manifest.ts` (`just fe-offline-manifest`) is a thin
 * CLI wrapper around this module.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export interface OfflineManifest {
  commit: string;
  built: string;
  version: string;
}

/** Default output path, relative to src/frontend/ (Astro's cwd) */
export function defaultOutputPath(): string {
  return path.resolve(process.cwd(), 'public/data/offline-manifest.json');
}

/** Default package.json to read the version from, relative to src/frontend/ */
export function defaultPackagePath(): string {
  return path.resolve(process.cwd(), 'package.json');
}

/**
 * Short commit hash of the build.
 *
 * `git rev-parse` walks up from the working directory, so it finds the repo both
 * locally (src/frontend → repo root) and in the image (/app/src/frontend →
 * /app/.git, which the Dockerfile copies and whose builder stage installs git).
 * The env overrides are there for build contexts without a checkout — e.g. a CI
 * job building from an archive, where `GITHUB_SHA` is present instead.
 */
export function resolveCommit(): string | null {
  const fromEnv = process.env.OFFLINE_MANIFEST_COMMIT
    || process.env.GIT_COMMIT
    || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.trim().slice(0, 9);

  for (const cwd of [process.cwd(), path.resolve(process.cwd(), '..'), path.resolve(process.cwd(), '../..')]) {
    try {
      const hash = execSync('git rev-parse --short HEAD', {
        cwd,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (hash) return hash;
    } catch {
      /* not a repo from here — try the next level up */
    }
  }
  return null;
}

function readVersion(packagePath: string): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export interface WriteOfflineManifestResult {
  outputPath: string;
  manifest: OfflineManifest;
  /** false when commit and version were already current (only `built` would move) */
  changed: boolean;
  /** true when no commit could be resolved and the existing file was left alone */
  skipped: boolean;
}

export function writeOfflineManifest(
  outputPath: string = defaultOutputPath(),
  packagePath: string = defaultPackagePath(),
): WriteOfflineManifestResult {
  let previous: Partial<OfflineManifest> = {};
  if (fs.existsSync(outputPath)) {
    try {
      previous = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch {
      /* corrupt — treat as absent and overwrite */
    }
  }

  const version = readVersion(packagePath);
  const commit = resolveCommit();

  if (!commit) {
    // No commit to stamp. Keep whatever shipped last rather than inventing one:
    // a wrong hash would either mass-invalidate every reader's download or hide
    // a real update. Only bootstrap a placeholder when there is no file at all.
    if (previous.commit) {
      return {
        outputPath,
        manifest: previous as OfflineManifest,
        changed: false,
        skipped: true,
      };
    }
    const manifest: OfflineManifest = { commit: 'dev', built: new Date().toISOString(), version };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    return { outputPath, manifest, changed: true, skipped: true };
  }

  const changed = previous.commit !== commit || previous.version !== version;
  const manifest: OfflineManifest = {
    commit,
    built: changed ? new Date().toISOString() : (previous.built ?? new Date().toISOString()),
    version,
  };

  if (changed) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }

  return { outputPath, manifest, changed, skipped: false };
}
