import React from 'react';

const PaletteSelector = ({ currentPalette, selectPalette, colorPalettes, onColorPick = () => {}, cityName = '', onBack = () => {}, isIdleAnimationEnabled = false }) => {
  const [svgContent, setSvgContent] = React.useState({ 1: null, 2: null });
  const paletteRefs = { 1: React.useRef(null), 2: React.useRef(null) };
  const userInteractedRef = React.useRef(false);
  const timeoutsRef = React.useRef([]);
  const isAnimatingRef = React.useRef(false);
  // Landscape scaling (mobile) relative to FHD baseline
  const [landscapeScale, setLandscapeScale] = React.useState(1);
  const [isLandscapeMobile, setIsLandscapeMobile] = React.useState(false);
  React.useEffect(() => {
    const BASE_WIDTH = 1920;
    const BASE_HEIGHT = 1080;
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isLandscape = w > h;
      const isMobile = w <= 1024;
      if (isLandscape && isMobile) {
        const s = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
        setLandscapeScale(s);
        setIsLandscapeMobile(true);
      } else {
        setLandscapeScale(1);
        setIsLandscapeMobile(false);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

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
          1: recolorSvg(vibrantSvgRaw, vibrantColors),
          2: recolorSvg(coolSvgRaw, calmColors),
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

  // Add hover event listeners to SVG paths after content is injected
  React.useEffect(() => {
    const addHoverListeners = () => {
      [1, 2].forEach((paletteId) => {
        const container = paletteRefs[paletteId]?.current;
        if (!container) return;
        
        const paths = container.querySelectorAll('.lockup-svg path');
        paths.forEach((path) => {
          const handleMouseEnter = () => {
            // Only add hover effect if not currently in idle animation
            if (!path.classList.contains('idle-elevate')) {
              path.classList.add('hover-elevate');
            }
          };
          
          const handleMouseLeave = () => {
            // Remove hover effect (idle-elevate takes priority anyway)
            path.classList.remove('hover-elevate');
          };
          
          // Remove existing listeners first to avoid duplicates
          path.removeEventListener('mouseenter', handleMouseEnter);
          path.removeEventListener('mouseleave', handleMouseLeave);
          
          // Add new listeners
          path.addEventListener('mouseenter', handleMouseEnter);
          path.addEventListener('mouseleave', handleMouseLeave);
          
          // Store listeners for cleanup
          path._hoverListeners = { handleMouseEnter, handleMouseLeave };
        });
      });
    };

    // Add listeners after a short delay to ensure SVG content is fully rendered
    const timeoutId = setTimeout(addHoverListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup hover listeners on unmount
      [1, 2].forEach((paletteId) => {
        const container = paletteRefs[paletteId]?.current;
        if (!container) return;
        
        const paths = container.querySelectorAll('.lockup-svg path');
        paths.forEach((path) => {
          if (path._hoverListeners) {
            path.removeEventListener('mouseenter', path._hoverListeners.handleMouseEnter);
            path.removeEventListener('mouseleave', path._hoverListeners.handleMouseLeave);
            delete path._hoverListeners;
          }
          path.classList.remove('hover-elevate');
        });
      });
    };
  }, [svgContent]); // Re-run when SVG content changes

  // Utility: clear queued timeouts and remove elevation class from any paths
  const stopIdleAnimation = React.useCallback(() => {
    isAnimatingRef.current = false;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    // Remove idle elevation class from both palettes if present
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

  // Idle loop: animate vibrant (1) then cool (2), gated by isIdleAnimationEnabled
  React.useEffect(() => {
    let cancelled = false;
    // If animation is disabled or svg not ready, ensure stopped
    if (!isIdleAnimationEnabled || userInteractedRef.current || !svgContent[1] || !svgContent[2]) {
      isAnimatingRef.current = false;
      stopIdleAnimation();
      return () => { cancelled = true; };
    }
    isAnimatingRef.current = true;
    const run = async () => {
      while (!cancelled && isAnimatingRef.current && !userInteractedRef.current) {
        await animatePaletteOnce(1);
        if (cancelled || !isIdleAnimationEnabled || userInteractedRef.current) break;
        await animatePaletteOnce(2);
      }
    };
    run();
    return () => {
      cancelled = true;
      stopIdleAnimation();
    };
  }, [svgContent, animatePaletteOnce, stopIdleAnimation, isIdleAnimationEnabled]);

  const renderPaletteSvg = (paletteId, altText) => {
    const html = svgContent[paletteId];
    const svgScale = isLandscapeMobile ? 1.1 : landscapeScale;
    if (html) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center lockup-wrapper"
          style={{ transform: `scale(${svgScale})`, transformOrigin: 'center' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    // fallback while loading
    return (
      <div className="absolute inset-0 flex items-center justify-center lockup-wrapper" style={{ transform: `scale(${svgScale})`, transformOrigin: 'center' }}>
        <img
          src={paletteId === 1 ? '/LockUpSvg/vibrant.svg' : '/LockUpSvg/cool.svg'}
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
    <div className="column-1 column-padding flex flex-col items-start justify-start overflow-hidden py-6 px-4 lg:px-[25px] w-1/4 flex-shrink-0 h-full">
      <style jsx>{`
        /* Hover elevation effect for individual SVG paths */
        .lockup-svg path.hover-elevate {
          transform: translateY(-3px);
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.07));
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        /* Auto-animation elevation effect (existing) */
        .lockup-svg path.idle-elevate {
          transform: translateY(-6px);
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.07));
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        /* Base styling for smooth transitions */
        .lockup-svg path {
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: pointer;
        }
        
        /* Ensure idle animation takes priority over hover */
        .lockup-svg path.idle-elevate.hover-elevate {
          transform: translateY(-6px);
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.07));
        }
      `}</style>
      <div
        className="container-height flex-1 relative rounded-3xl w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          boxShadow:
            '0 244px 68px 0 rgba(0, 0, 0, 0.00), 0 156px 63px 0 rgba(0, 0, 0, 0.01), 0 88px 53px 0 rgba(0, 0, 0, 0.03), 0 39px 39px 0 rgba(0, 0, 0, 0.04), 0 10px 22px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex flex-col h-full overflow-hidden relative w-full">
          
          {/* Header section with title, city name, and back button */}
          <div className="flex px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 relative">
            <div className="flex items-center justify-center mr-3">
              <button 
                className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 transition-opacity hover:opacity-80"
                style={{
                  borderRadius: '100px',
                  background: 'rgba(0, 0, 0, 0.60)',
                  width: `${Math.max(28, Math.round(40 * landscapeScale))}px`,
                  height: `${Math.max(28, Math.round(40 * landscapeScale))}px`
                }}
                onClick={onBack}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="22" 
                  height="22" 
                  viewBox="0 0 22 22" 
                  fill="none"
                  style={{ width: `${Math.max(16, Math.round(22 * landscapeScale))}px`, height: `${Math.max(16, Math.round(22 * landscapeScale))}px` }}
                >
                  <path 
                    d="M11 21L1 11L11 1" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M21 11H1" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col flex-1">
              <div className="title-text font-bold leading-none text-black text-[16px] lg:text-[20px] text-left font-brand mb-2" style={isLandscapeMobile ? { marginBottom: 4 } : {}}>
                <p className="block leading-normal truncate" style={{
                  fontSize: `${Math.max(12, Math.round(16 * landscapeScale))}px`
                }}>Color Lock UP</p>
              </div>
              {cityName ? (
                <div className="text-[#616161] subline-text font-sans mb-3" style={isLandscapeMobile ? { marginBottom: 4 } : {}}>
                  <p className="block leading-normal whitespace-pre" style={{ fontSize: `${Math.max(8, Math.round(16 * landscapeScale))}px`, lineHeight: 1.1 }}>{cityName}</p>
                </div>
              ) : null}
            </div>
            {/* Separator line extending to back button */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200"></div>
          </div>
          
          {/* Palettes section */}
          <div className={`flex flex-col flex-1 overflow-hidden px-4 lg:px-12 pb-4 text-center lg:pb-6 ${isLandscapeMobile ? 'gap-0 items-stretch justify-between' : 'gap-4 lg:gap-8 items-center justify-center'}`}>
          
          {/* Palette 1 */}
          <div className={`flex center flex-col ${isLandscapeMobile ? 'flex-1 min-h-0 gap-0 items-stretch' : 'gap-2.5 items-center justify-end'} w-full`}>
            <div 
              className={`${isLandscapeMobile ? 'flex-1 min-h-0' : 'aspect-square'} overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 1 ? 'selected-color' : ''}`}
              onClick={handleContainerClick(1)}
              ref={paletteRefs[1]}
            >
              {renderPaletteSvg(1, 'Vibrant Palette')}
            </div>
            <div className="vibrant-text text-center font-normal leading-none text-black text-[28px] lg:text-[40px] text-nowrap font-brand shrink-0" style={isLandscapeMobile ? { fontSize: '12px', lineHeight: 1 } : {}}>
              <p className="block leading-normal whitespace-pre">Vibrant</p>
            </div>
          </div>
          
          
          {/* Palette 2 */}
          <div className={`flex flex-col ${isLandscapeMobile ? 'flex-1 min-h-0 gap-0 items-stretch' : 'gap-2.5 items-center justify-start'} w-full`} >
            <div 
              className={`${isLandscapeMobile ? 'flex-1 min-h-0' : 'aspect-square'} overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 2 ? 'selected-color' : ''}`}
              onClick={handleContainerClick(2)}
              ref={paletteRefs[2]}
            >
              {renderPaletteSvg(2, 'Calm Palette')}
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-nowrap font-brand shrink-0" style={isLandscapeMobile ? { fontSize: '12px', lineHeight: 1 } : {}}>
              <p className="block leading-normal whitespace-pre">Calm</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaletteSelector; 