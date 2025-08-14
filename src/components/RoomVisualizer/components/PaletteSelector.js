import React from 'react';

const PaletteSelector = ({ currentPalette, selectPalette, colorPalettes, onColorPick = () => {} }) => {
  const [svgContent, setSvgContent] = React.useState({ 1: null, 2: null });
  const paletteRefs = { 1: React.useRef(null), 2: React.useRef(null) };
  const userInteractedRef = React.useRef(false);
  const timeoutsRef = React.useRef([]);
  const isAnimatingRef = React.useRef(false);

  // Utility to recolor an SVG string given an array of hex colors.
  const recolorSvg = (rawSvg, colors) => {
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rawSvg, 'image/svg+xml');
      // Add a class to the root SVG element so we can target paths for hover effects
      xmlDoc.documentElement.setAttribute('class', 'lockup-svg');
      const paths = Array.from(xmlDoc.querySelectorAll('path'));
      if (paths.length === 0 || colors.length === 0) return rawSvg; // nothing to recolor or no colors
      paths.forEach((p, idx) => {
        const color = colors[idx % colors.length];
        if (color) {
          p.setAttribute('fill', color);
        }
      });
      const serializer = new XMLSerializer();
      return serializer.serializeToString(xmlDoc);
    } catch (e) {
      console.warn('Failed to recolor svg:', e);
      return rawSvg;
    }
  };

  // Load and recolor SVGs whenever palette colors change
  React.useEffect(() => {
    const loadSvgs = async () => {
      try {
        const [coolRes, vibrantRes] = await Promise.all([
          fetch('/LockUpSvg/cool.svg'),
          fetch('/LockUpSvg/vibrant.svg'),
        ]);
        const [coolSvgRaw, vibrantSvgRaw] = await Promise.all([
          coolRes.text(),
          vibrantRes.text(),
        ]);
        const vibrantColors = colorPalettes?.[1]?.colors || [];
        const calmColors = colorPalettes?.[2]?.colors || [];
        setSvgContent({
          1: recolorSvg(coolSvgRaw, vibrantColors),
          2: recolorSvg(vibrantSvgRaw, calmColors),
        });
      } catch (e) {
        console.error('Failed to load lock-up svgs:', e);
      }
    };
    // Only trigger if palettes ready
    if (colorPalettes?.[1]?.colors?.length || colorPalettes?.[2]?.colors?.length) {
      loadSvgs();
    }
  }, [colorPalettes]);

  // Utility: clear queued timeouts and remove elevation class from any paths
  const stopIdleAnimation = React.useCallback(() => {
    isAnimatingRef.current = false;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    // Remove class from both palettes if present
    [1, 2].forEach((id) => {
      const container = paletteRefs[id]?.current;
      if (!container) return;
      const paths = container.querySelectorAll('.lockup-svg path.idle-elevate');
      paths.forEach((p) => p.classList.remove('idle-elevate'));
    });
  }, []);

  // Compute TL -> TR -> BR -> BL -> center1 -> center2 order from geometry
  const computeAnimationOrder = React.useCallback((paths) => {
    if (!paths || paths.length === 0) return [];
    const items = Array.from(paths).map((p, idx) => {
      try {
        const b = p.getBBox();
        return { index: idx, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
      } catch {
        // Fallback if getBBox fails
        return { index: idx, cx: idx, cy: idx };
      }
    });
    const xs = items.map((i) => i.cx);
    const ys = items.map((i) => i.cy);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const takeClosest = (arr, targetX, targetY) => {
      let bestIdx = -1;
      let bestScore = Infinity;
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        const dx = it.cx - targetX;
        const dy = it.cy - targetY;
        const score = dx * dx + dy * dy;
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      return arr.splice(bestIdx, 1)[0];
    };
    const working = [...items];
    const tl = takeClosest(working, minX, minY);
    const tr = takeClosest(working, maxX, minY);
    const br = takeClosest(working, maxX, maxY);
    const bl = takeClosest(working, minX, maxY);
    // Remaining two are centers; order by cx ascending for a stable order
    const centers = working.sort((a, b) => a.cx - b.cx);
    const order = [tl, tr, br, bl, ...centers].filter(Boolean).map((o) => o.index);
    // Ensure indices are within bounds
    return order.filter((i) => typeof i === 'number' && i >= 0 && i < paths.length);
  }, []);

  // Animate one palette once following the computed order
  const animatePaletteOnce = React.useCallback(async (paletteId) => {
    const container = paletteRefs[paletteId]?.current;
    if (!container) return;
    const paths = container.querySelectorAll('.lockup-svg path');
    if (!paths || paths.length === 0) return;
    const order = computeAnimationOrder(paths);
    const HOLD_MS = 260;
    const GAP_MS = 90;
    for (const idx of order) {
      if (!isAnimatingRef.current || userInteractedRef.current) return;
      const path = paths[idx];
      if (!path) continue;
      // Elevate
      path.classList.add('idle-elevate');
      await new Promise((resolve) => {
        const t1 = setTimeout(() => {
          // Lower
          path.classList.remove('idle-elevate');
          const t2 = setTimeout(resolve, GAP_MS);
          timeoutsRef.current.push(t2);
        }, HOLD_MS);
        timeoutsRef.current.push(t1);
      });
    }
  }, [computeAnimationOrder]);

  // Idle loop: animate vibrant (1) then cool (2), repeat until user interacts
  React.useEffect(() => {
    if (userInteractedRef.current) return;
    if (!svgContent[1] || !svgContent[2]) return; // wait until svgs are injected
    isAnimatingRef.current = true;
    let cancelled = false;
    const run = async () => {
      while (!cancelled && isAnimatingRef.current && !userInteractedRef.current) {
        await animatePaletteOnce(1);
        if (cancelled || userInteractedRef.current) break;
        await animatePaletteOnce(2);
      }
    };
    run();
    return () => {
      cancelled = true;
      stopIdleAnimation();
    };
  }, [svgContent, animatePaletteOnce, stopIdleAnimation]);

  const renderPaletteSvg = (paletteId, altText) => {
    const html = svgContent[paletteId];
    if (html) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    // fallback while loading
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={paletteId === 1 ? '/LockUpSvg/cool.svg' : '/LockUpSvg/vibrant.svg'}
          alt={altText}
          className="w-full h-full max-w-[280px] max-h-[280px] opacity-30"
        />
      </div>
    );
  };

  // Determines whether the click event was on an SVG <path>. If so, extract its fill colour
  const handleContainerClick = (paletteId) => (event) => {
    const target = event.target;
    if (target && typeof target.getAttribute === 'function') {
      const fill = target.getAttribute('fill');
      const validHex = /^#[0-9A-F]{6}$/i;
      if (fill && validHex.test(fill)) {
        userInteractedRef.current = true;
        stopIdleAnimation();
        onColorPick(fill.toUpperCase());
        return; // Do not switch palette when picking a colour
      }
    }
    // Fallback: treat as palette selection
    userInteractedRef.current = true;
    stopIdleAnimation();
    selectPalette(paletteId);
  };

  return (
    <div className="column-1 column-padding flex flex-col gap-4 lg:gap-8 items-start justify-start overflow-hidden px-4 lg:px-[25px] w-1/4 flex-shrink-0">
      <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-left w-full font-brand">
        <p className="block leading-normal">Color Lock UP</p>
      </div>
      <div className="container-height flex-1 relative rounded-2xl lg:rounded-3xl w-full border-[3px] lg:border-[5px] border-solid border-[#d2d2d2]">
        <div className="flex flex-col gap-6 lg:gap-12 h-full items-center justify-center overflow-hidden px-4 lg:px-14 py-2.5 relative w-full">
          
          {/* Palette 1 */}
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            <div 
              className={`aspect-square overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 1 ? 'selected-color' : ''}`}
              onClick={handleContainerClick(1)}
              ref={paletteRefs[1]}
            >
              {renderPaletteSvg(1, 'Cool Palette')}
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-left text-nowrap font-brand">
              <p className="block leading-normal whitespace-pre">Vibrant</p>
            </div>
          </div>
          
          {/* Palette 2 */}
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            <div 
              className={`aspect-square overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 2 ? 'selected-color' : ''}`}
              onClick={handleContainerClick(2)}
              ref={paletteRefs[2]}
            >
              {renderPaletteSvg(2, 'Vibrant Palette')}
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-left text-nowrap font-brand">
              <p className="block leading-normal whitespace-pre">Cool</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaletteSelector; 