#!/usr/bin/env node
/*
  Batch HLS encoder for all cities.
  - Reads `src/data/cities.js` to get city slugs (object keys)
  - For each city, looks for input MP4 at:
      1) `Video/<slug or name>.mp4`
      2) `public/Video/<slug or name>.mp4`
      3) `public/City/Video/<slug or name>.mp4`
      4) fallback: `public/City/Video/Video.mp4`
  - Outputs HLS to `public/videos/<slug>/` with variants v0/v1/v2 and `master.m3u8`
  - Video-only (no audio)

  Usage:
    node scripts/encode-hls-all.js

  Requirements:
    - ffmpeg must be installed and available in PATH
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const citiesFile = path.join(projectRoot, 'src', 'data', 'cities.js');
const outRoot = path.join(projectRoot, 'public', 'videos');

function getCitySlugs() {
  const js = fs.readFileSync(citiesFile, 'utf8');
  // crude parse: look for `export const citiesData = { ... }` keys
  const match = js.match(/export const citiesData = \{([\s\S]*?)\};/);
  if (!match) throw new Error('Could not find citiesData in src/data/cities.js');
  const body = match[1];
  const keys = [];
  const keyRegex = /(\w+):\s*\{/g;
  let m;
  while ((m = keyRegex.exec(body)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeBase(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findInputForCity(citySlug) {
  const slugNorm = normalizeBase(citySlug);
  const searchDirs = [
    path.join(projectRoot, 'Video'),
    path.join(projectRoot, 'public', 'Video'),
    path.join(projectRoot, 'public', 'City', 'Video'),
  ];

  for (const dir of searchDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile()) continue;
        if (!/\.mp4$/i.test(e.name)) continue;
        const base = path.basename(e.name, path.extname(e.name));
        if (normalizeBase(base) === slugNorm) {
          return path.join(dir, e.name);
        }
      }
    } catch (_) {
      // ignore
    }
  }

  const fallback = path.join(projectRoot, 'public', 'City', 'Video', 'Video.mp4');
  return fs.existsSync(fallback) ? fallback : null;
}

function encodeCity(city) {
  // normalize city for folder name (remove apostrophes)
  const slug = city.toLowerCase().replace(/'/g, '').trim();
  const cityDir = path.join(outRoot, slug);
  const v0 = path.join(cityDir, 'v0');
  const v1 = path.join(cityDir, 'v1');
  const v2 = path.join(cityDir, 'v2');
  ensureDir(v0); ensureDir(v1); ensureDir(v2);

  const input = findInputForCity(slug);
  if (!input) {
    console.warn(`Skipping ${city}: no input MP4 found for slug ${slug}. Expected under Video/, public/Video/ or public/City/Video/.`);
    return;
  }

  const cmd = [
    `ffmpeg -y -i ${JSON.stringify(input)} \\\n  -filter_complex "[0:v]split=3[v0][v1][v2]; \\\n                   [v0]scale=-2:240[v0out]; \\\n                   [v1]scale=-2:480[v1out]; \\\n                   [v2]scale=-2:720[v2out]" \\\n  -map "[v0out]" -c:v:0 libx264 -b:v:0 400k -preset veryfast -g 50 -sc_threshold 0 \\\n  -map "[v1out]" -c:v:1 libx264 -b:v:1 800k -preset veryfast -g 50 -sc_threshold 0 \\\n  -map "[v2out]" -c:v:2 libx264 -b:v:2 1500k -preset veryfast -g 50 -sc_threshold 0 \\\n  -an \\\n  -f hls -hls_time 4 -hls_playlist_type vod \\\n  -hls_segment_filename ${JSON.stringify(path.join(cityDir, 'v%v', 'seg_%06d.ts'))} \\\n  -master_pl_name master.m3u8 \\\n  -var_stream_map "v:0 v:1 v:2" \\\n  ${JSON.stringify(path.join(cityDir, 'v%v', 'stream.m3u8'))}`
  ].join(' ');

  console.log(`\nEncoding HLS for ${city} -> ${slug}`);
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  ensureDir(outRoot);
  const slugs = getCitySlugs();
  slugs.forEach(encodeCity);
  console.log('\nAll cities processed.');
}

main();


