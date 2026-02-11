#!/usr/bin/env npx tsx
/**
 * Generate PWA icons from Marie's self-portrait.
 *
 * Source: src/frontend/public/images/marie/self-portrait.jpg (466x600)
 * Crops to face region, then generates all required PWA icon sizes.
 *
 * Usage: npx tsx src/scripts/generate-pwa-icons.ts
 *    or: just generate-pwa-icons
 */

import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SOURCE = join(ROOT, 'src', 'frontend', 'public', 'images', 'marie', 'self-portrait.jpg');
const ICONS_DIR = join(ROOT, 'src', 'frontend', 'public', 'icons');
const PUBLIC_DIR = join(ROOT, 'src', 'frontend', 'public');

// Crop region: face area — top-center, 466x370 starting at y=30
const CROP = { left: 0, top: 30, width: 466, height: 370 };

// Safe zone padding ratio for maskable icons (10% on each side)
const MASKABLE_PADDING = 0.1;

async function generateIcon(
  source: sharp.Sharp,
  size: number,
  outputPath: string,
  maskable: boolean = false
) {
  let pipeline = source.clone();

  if (maskable) {
    // For maskable icons, add padding so the safe zone contains the face
    const innerSize = Math.round(size * (1 - 2 * MASKABLE_PADDING));
    const padding = Math.round(size * MASKABLE_PADDING);

    const resized = await pipeline
      .resize(innerSize, innerSize, { fit: 'cover' })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 255, g: 248, b: 240 }, // #FFF8F0 — site background
      },
    })
      .composite([{ input: resized, left: padding, top: padding }])
      .png()
      .toFile(outputPath);
  } else {
    await pipeline
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outputPath);
  }

  console.log(`  ${outputPath.replace(ROOT + '/', '')} (${size}x${size}${maskable ? ' maskable' : ''})`);
}

async function main() {
  console.log('Generating PWA icons from self-portrait...\n');

  // Ensure output directory exists
  mkdirSync(ICONS_DIR, { recursive: true });

  // Load and crop source image
  const cropped = sharp(SOURCE).extract(CROP);

  // Generate standard icons
  await generateIcon(cropped, 192, join(ICONS_DIR, 'icon-192.png'));
  await generateIcon(cropped, 512, join(ICONS_DIR, 'icon-512.png'));

  // Generate maskable icons (with padding for safe zone)
  await generateIcon(cropped, 192, join(ICONS_DIR, 'icon-maskable-192.png'), true);
  await generateIcon(cropped, 512, join(ICONS_DIR, 'icon-maskable-512.png'), true);

  // Generate Apple touch icon (180x180)
  await generateIcon(cropped, 180, join(ICONS_DIR, 'apple-touch-icon.png'));

  // Copy apple-touch-icon to public root (browsers look for it there)
  copyFileSync(
    join(ICONS_DIR, 'apple-touch-icon.png'),
    join(PUBLIC_DIR, 'apple-touch-icon.png')
  );
  console.log(`  src/frontend/public/apple-touch-icon.png (copied from icons/)`);

  console.log('\nDone! Generated 5 icons + 1 copy.');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
