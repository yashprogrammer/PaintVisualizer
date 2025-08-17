## Video Optimization Plan: HLS streaming with static hosting (no backend)

### Objective
- Replace large MP4 playback with adaptive HLS streaming for the intro/city video in `VideoPlayer` using pre-encoded static assets and `hls.js`. Keep current UX (auto-play, skip, timed navigation) intact, with MP4 fallback.

### Current state
- `src/components/VideoPlayer/VideoPlayer.js` plays an MP4 from API or falls back to `/City/Video/Video.mp4`.
- Assets are served from `public/` by CRA. No server-side logic.
- Videos are silent (no audio track) → use video-only HLS.

### Plan at a glance
- Pre-encode videos to HLS locally once → place under `public/videos/<city>/` → integrate `hls.js` in `VideoPlayer` with Safari/native fallback → keep MP4 as hard fallback → verify MIME types on hosting → roll out.

---

### 1) Pre-encode videos to HLS (local, one-time)
Actionable steps:
- Install FFmpeg locally (if not already).
- For each source MP4 (start with the intro video), run (video-only, no audio):
  ```bash
  mkdir -p out/v0 out/v1 out/v2
  ffmpeg -y -i input.mp4 \
    -filter_complex "[0:v]split=3[v0][v1][v2]; \
                     [v0]scale=-2:240[v0out]; \
                     [v1]scale=-2:480[v1out]; \
                     [v2]scale=-2:720[v2out]" \
    -map "[v0out]" -c:v:0 libx264 -b:v:0 400k -preset veryfast -g 50 -sc_threshold 0 \
    -map "[v1out]" -c:v:1 libx264 -b:v:1 800k -preset veryfast -g 50 -sc_threshold 0 \
    -map "[v2out]" -c:v:2 libx264 -b:v:2 1500k -preset veryfast -g 50 -sc_threshold 0 \
    -an \
    -f hls -hls_time 4 -hls_playlist_type vod \
    -hls_segment_filename "out/v%v/seg_%06d.ts" \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0 v:1 v:2" \
    out/v%v/stream.m3u8
  ```
- Validate output structure contains `master.m3u8` and segmented `.ts` files.

Nice-to-have:
- Add a helper script under `scripts/` to batch-convert any MP4s you choose later.

### 2) Organize HLS outputs in the app
Actionable steps:
- Create a folder per video under `public/videos/` (keeps bundles lean and avoids imports):
  ```
  public/
    videos/
      <city-or-scene>/
        master.m3u8
        v0/stream.m3u8 + seg_*.ts
        v1/...
        v2/...
  ```
- For the current intro flow, you can start with `public/videos/livingroom/` or a city slug that matches your route param.
- Consider updating `.gitignore` to exclude `public/videos/**` if repo size becomes large, and keep these assets in release storage/CDN.

### 3) Add the player library
Actionable steps:
- Install dependency: `npm i hls.js`.
- Do not import HLS assets; they are fetched as static files from `public/` at runtime.

### 4) Integrate HLS in `VideoPlayer` (non-breaking)
Actionable steps:
- In `src/components/VideoPlayer/VideoPlayer.js`:
  - Add a small adapter that, when a city is selected, resolves a source URL. Prefer HLS master if available (e.g., `/videos/<city>/master.m3u8`), else fall back to API URL, else `/City/Video/Video.mp4`.
  - Initialize `hls.js` when the source is an `.m3u8` and `Hls.isSupported()` is true. Attach to the existing `videoRef`.
  - Safari fallback: if `video.canPlayType('application/vnd.apple.mpegurl')`, set `video.src` to the master playlist directly.
  - Keep current behaviors: `muted`, `playsInline`, auto-play after `load()`, `onTimeUpdate`/`Skip`/`onEnded` navigation.

Notes:
- Do not import HLS files into JS; use absolute paths (`/videos/...`).
- Retain the `<source type="video/mp4" />` node as a final fallback for older browsers or while migrating.

### 5) Hosting and MIME types
Actionable steps:
- Dev server (CRA) will serve files over HTTP; avoid `file://`.
- Production hosting must serve correct MIME types:
  - `.m3u8` → `application/vnd.apple.mpegurl`
  - `.ts` → `video/mp2t`
- Configure per host (examples):
  - Netlify: add `public/_headers` with `Content-Type` overrides.
  - Vercel: add `vercel.json` `headers` for the `/videos/` path.
  - Nginx/Apache: add to `mime.types`/`httpd.conf`.

### 6) Compatibility and fallbacks
Actionable steps:
- Keep the existing MP4 path as a hard fallback if HLS fails.
- Test in Safari (native HLS) and Chrome/Firefox (via `hls.js`).
- If you host videos cross-origin, ensure CORS is enabled on the video host.

### 7) QA checklist
Actionable steps:
- Chrome, Firefox, Safari desktop: video plays, ABR switches on network throttling.
- iOS Safari: plays natively when pointing video `src` to `master.m3u8`.
- Skip button still navigates immediately; auto-advance at ~4.5s still works.
- Verify long cache headers for segments and playlists on production (optional).
- Confirm MIME types via browser DevTools → Network.

### 8) Rollout strategy
Actionable steps:
- Start with one city/scene to validate end-to-end.
- Land code behind a simple flag (e.g., prefer HLS when `master.m3u8` exists) to allow quick fallback to MP4.
- Once verified, encode remaining videos and add folders under `public/videos/`.

### 9) Optional improvements (later)
- Add a small node script under `scripts/` to generate HLS for a folder of MP4s.
- Preload the first playlist/segment on route enter for snappier start.
- Consider moving videos to a CDN bucket with CORS enabled for better global performance.

### Acceptance criteria
- Plays the intro/city video via HLS with adaptive bitrate on modern browsers, with functional Safari native fallback and MP4 ultimate fallback. No backend changes required.

### Effort estimate
- Encoding and asset placement: 30–60 min for first video (excluding FFmpeg install time).
- Code integration in `VideoPlayer`: ~45–60 min.
- Host header config + QA: ~30–45 min.


