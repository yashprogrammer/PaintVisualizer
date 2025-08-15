#!/usr/bin/env node
/**
 * Optimize public image assets by generating LQIP and MEDIUM variants.
 *
 * - LQIP: very small blurred JPEG (default width: 20px)
 * - MEDIUM: resized image (default width: 800px) written as same format as source
 *
 * Output structure mirrors input under public/optimized/...
 * Examples:
 *   public/Room/Bedroom/wall1.png -> public/optimized/Room/Bedroom/wall1-lqip.jpg
 *                                   public/optimized/Room/Bedroom/wall1-med.png
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const optimizedRoot = path.join(publicDir, 'optimized');

// Directories (relative to public/) to scan
const DEFAULT_DIRS = ['Room', 'City'];

// Specific root-level files (relative to public/) to also process
const EXTRA_FILES = [
  'COW_Red_heart_Explore.png',
  'COW_Red_heart.png',
  'COW_white_heart.png',
  'BeepingHeart.png',
  'Dulux.png',
];

// CLI: --dirs Room,City or --dirs Room
function parseCliDirs() {
  const idx = process.argv.findIndex((a) => a === '--dirs');
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_DIRS;
}

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg']);

const LQIP_WIDTH = 20; // pixels
const MEDIUM_WIDTH = 800; // pixels

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function* walkDir(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function buildOutputs(srcAbsPath) {
  const relFromPublic = path.relative(publicDir, srcAbsPath); // e.g., Room/Bedroom/wall1.png
  const parsed = path.parse(relFromPublic);
  const relDir = parsed.dir; // e.g., Room/Bedroom
  const baseName = parsed.name; // e.g., wall1
  const ext = parsed.ext.toLowerCase();

  const lqipRel = path.join(relDir, `${baseName}-lqip.jpg`);
  const mediumRel = path.join(relDir, `${baseName}-med${ext}`);
  const lqipAbs = path.join(optimizedRoot, lqipRel);
  const mediumAbs = path.join(optimizedRoot, mediumRel);

  return { lqipAbs, mediumAbs, lqipRel, mediumRel };
}

async function needsBuild(src, out) {
  try {
    const [srcStat, outStat] = await Promise.all([fsp.stat(src), fsp.stat(out)]);
    // Rebuild if source is newer than output
    return srcStat.mtimeMs > outStat.mtimeMs;
  } catch (e) {
    // If output missing, we need to build
    return true;
  }
}

async function processImage(srcAbsPath) {
  const ext = path.extname(srcAbsPath).toLowerCase();
  if (!allowedExtensions.has(ext)) return;

  const { lqipAbs, mediumAbs, lqipRel, mediumRel } = buildOutputs(srcAbsPath);

  await ensureDir(path.dirname(lqipAbs));
  await ensureDir(path.dirname(mediumAbs));

  let metadata;
  try {
    metadata = await sharp(srcAbsPath).metadata();
  } catch (e) {
    console.warn(`[skip] unreadable image: ${srcAbsPath}`, e.message);
    return;
  }

  const srcWidth = metadata.width || 0;
  const mediumWidth = Math.min(MEDIUM_WIDTH, srcWidth || MEDIUM_WIDTH);

  // LQIP
  if (await needsBuild(srcAbsPath, lqipAbs)) {
    try {
      await sharp(srcAbsPath)
        .resize({ width: LQIP_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 35, mozjpeg: true })
        .blur(2)
        .toFile(lqipAbs);
      console.log(`[lqip] ${path.relative(projectRoot, lqipAbs)} from ${path.relative(projectRoot, srcAbsPath)}`);
    } catch (e) {
      console.warn(`[fail:lqip] ${srcAbsPath}: ${e.message}`);
    }
  }

  // MEDIUM (keep original format)
  if (await needsBuild(srcAbsPath, mediumAbs)) {
    try {
      const base = sharp(srcAbsPath).resize({ width: mediumWidth, withoutEnlargement: true });
      if (ext === '.png') {
        await base
          .png({ compressionLevel: 9, palette: true, effort: 10 })
          .toFile(mediumAbs);
      } else {
        await base
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(mediumAbs);
      }
      console.log(`[med]  ${path.relative(projectRoot, mediumAbs)} from ${path.relative(projectRoot, srcAbsPath)}`);
    } catch (e) {
      console.warn(`[fail:med] ${srcAbsPath}: ${e.message}`);
    }
  }
}

async function main() {
  const dirs = parseCliDirs();
  console.log(`Optimizing images in: ${dirs.map((d) => `public/${d}`).join(', ')}`);
  let count = 0;
  for (const relDir of dirs) {
    const absDir = path.join(publicDir, relDir);
    if (!fs.existsSync(absDir)) continue;
    for await (const absPath of walkDir(absDir)) {
      const ext = path.extname(absPath).toLowerCase();
      if (!allowedExtensions.has(ext)) continue;
      await processImage(absPath);
      count++;
    }
  }

  // Also process explicit root-level files if present
  for (const relFile of EXTRA_FILES) {
    const absFile = path.join(publicDir, relFile);
    if (!fs.existsSync(absFile)) {
      continue;
    }
    const ext = path.extname(absFile).toLowerCase();
    if (!allowedExtensions.has(ext)) continue;
    await processImage(absFile);
    count++;
  }
  console.log(`Done. Consider serving from /optimized with srcSet in your app. Processed ${count} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


