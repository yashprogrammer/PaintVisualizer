#!/usr/bin/env node
/**
 * Optimize public video assets by generating LOW and MEDIUM MP4 variants.
 *
 * Output structure mirrors input under public/optimized/...
 * Example:
 *   public/City/SelectionTransition/Bali.mp4 -> public/optimized/City/SelectionTransition/Bali-low.mp4
 *                                            -> public/optimized/City/SelectionTransition/Bali-med.mp4
 *
 * Requires ffmpeg to be installed and available on PATH.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const optimizedRoot = path.join(publicDir, 'optimized');

// Directories (relative to public/) to scan for videos
const DEFAULT_DIRS = ['City/SelectionTransition'];

// Extensions supported for input
const allowedExtensions = new Set(['.mp4', '.mov']);

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
  const relFromPublic = path.relative(publicDir, srcAbsPath); // e.g., City/SelectionTransition/Bali.mp4
  const parsed = path.parse(relFromPublic);
  const relDir = parsed.dir; // e.g., City/SelectionTransition
  const baseName = parsed.name; // e.g., Bali
  const ext = parsed.ext.toLowerCase();

  const lowRel = path.join(relDir, `${baseName}-low${ext}`);
  const medRel = path.join(relDir, `${baseName}-med${ext}`);
  const lowAbs = path.join(optimizedRoot, lowRel);
  const medAbs = path.join(optimizedRoot, medRel);

  return { lowAbs, medAbs, lowRel, medRel };
}

async function needsBuild(src, out) {
  try {
    const [srcStat, outStat] = await Promise.all([fsp.stat(src), fsp.stat(out)]);
    return srcStat.mtimeMs > outStat.mtimeMs;
  } catch (e) {
    return true;
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

async function encodeVariant(input, output, variant) {
  const outDir = path.dirname(output);
  await ensureDir(outDir);

  // Common encoding settings
  const common = ['-y', '-i', input, '-an', '-movflags', '+faststart']; // drop audio for masked background, faststart for progressive playback

  let vf = [];
  let videoSettings = [];
  if (variant === 'low') {
    vf = ['-vf', 'scale=-2:540,fps=24'];
    videoSettings = ['-c:v', 'libx264', '-preset', 'faster', '-crf', '28'];
  } else if (variant === 'med') {
    vf = ['-vf', 'scale=-2:720,fps=30'];
    videoSettings = ['-c:v', 'libx264', '-preset', 'faster', '-crf', '23'];
  } else {
    throw new Error(`Unknown variant: ${variant}`);
  }

  const args = [...common, ...vf, ...videoSettings, output];
  await runFfmpeg(args);
}

async function processVideo(srcAbsPath) {
  const ext = path.extname(srcAbsPath).toLowerCase();
  if (!allowedExtensions.has(ext)) return;

  const { lowAbs, medAbs, lowRel, medRel } = buildOutputs(srcAbsPath);

  if (await needsBuild(srcAbsPath, lowAbs)) {
    try {
      await encodeVariant(srcAbsPath, lowAbs, 'low');
      console.log(`[low] ${path.relative(projectRoot, lowAbs)} from ${path.relative(projectRoot, srcAbsPath)}`);
    } catch (e) {
      console.warn(`[fail:low] ${srcAbsPath}: ${e.message}`);
    }
  }

  if (await needsBuild(srcAbsPath, medAbs)) {
    try {
      await encodeVariant(srcAbsPath, medAbs, 'med');
      console.log(`[med] ${path.relative(projectRoot, medAbs)} from ${path.relative(projectRoot, srcAbsPath)}`);
    } catch (e) {
      console.warn(`[fail:med] ${srcAbsPath}: ${e.message}`);
    }
  }
}

async function checkFfmpeg() {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

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

async function main() {
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    console.error('ffmpeg is required but was not found on PATH. Please install ffmpeg and retry.');
    process.exit(2);
  }

  const dirs = parseCliDirs();
  console.log(`Optimizing videos in: ${dirs.map((d) => `public/${d}`).join(', ')}`);
  let count = 0;
  for (const relDir of dirs) {
    const absDir = path.join(publicDir, relDir);
    if (!fs.existsSync(absDir)) continue;
    for await (const absPath of walkDir(absDir)) {
      const ext = path.extname(absPath).toLowerCase();
      if (!allowedExtensions.has(ext)) continue;
      await processVideo(absPath);
      count++;
    }
  }
  console.log(`Done. Processed ${count} videos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


