import React from 'react';
import { roomData } from '../../../data/roomData';

const Visualizer = ({
  currentRoom,
  currentPalette,
  currentPaintColor,
  selectedSurface,
  surfaceColors,
  colorPalettes,
  colorInfo,
  containerRef,
  handleCanvasClick,
  selectPaint,
  removePaint,
  isMasksLoaded,
  maskImagesRef,
  shouldBlinkSelection = false,
  onClearAreas,
  onShare
}) => {
  // Maintain base image aspect ratio on small viewports (landscape mobile)
  // Landscape scaling (mobile) relative to FHD baseline
  const [landscapeScale, setLandscapeScale] = React.useState(1);
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
      } else {
        setLandscapeScale(1);
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

  
  
  // Build optimized asset paths for src/srcSet
  const buildOptimized = React.useCallback((src) => {
    if (!src || typeof src !== 'string') return { lqip: src, medium: src, original: src };
    const lastDot = src.lastIndexOf('.');
    if (lastDot === -1) return { lqip: `/optimized${src}-lqip.jpg`, medium: `/optimized${src}-med`, original: src };
    const base = src.substring(0, lastDot);
    const ext = src.substring(lastDot);
    return {
      lqip: `/optimized${base}-lqip.jpg`,
      medium: `/optimized${base}-med${ext}`,
      original: src,
    };
  }, []);

  // Track base image loading so we can overlay a spinner until it's ready
  const [isBaseLoaded, setIsBaseLoaded] = React.useState(false);
  const basePathsRef = React.useRef(null);

  React.useEffect(() => {
    // Recompute paths and reset loading whenever room changes
    const paths = buildOptimized(roomData[currentRoom].baseImage);
    basePathsRef.current = paths;
    setIsBaseLoaded(false);
  }, [currentRoom, buildOptimized]);
  

  return (
    <div className="visualizer-column column-2 column-padding flex flex-col items-center justify-start overflow-visible px-4 lg:px-[25px]  w-1/2 flex-shrink-0 min-h-[80vh] max-h-[95vh]">
      <div
        className="container-height flex flex-col gap-0 lg:gap-[21px] items-center justify-between relative rounded-[24px] w-full"
        style={{
          background: 'rgba(252, 252, 252, 0.70)',
          minHeight:'95vh',
          boxShadow:
            '0 244px 68px 0 rgba(0, 0, 0, 0.00), 0 156px 63px 0 rgba(0, 0, 0, 0.01), 0 88px 53px 0 rgba(0, 0, 0, 0.03), 0 39px 39px 0 rgba(0, 0, 0, 0.04), 0 10px 22px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        <style jsx>{`
          /* Aspect ratio: only lock on large screens and above */
          .visualizer-aspect {
            width: 100%;
          }
          /* Blink animation for selection outlines */
          @keyframes blinkOutline {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.9; }
          }
          .blink-outline {
            animation: blinkOutline 1.2s ease-in-out infinite;
          }
          .blink-outline.stagger-0 { animation-delay: 0s; }
          .blink-outline.stagger-1 { animation-delay: 0.15s; }
          .blink-outline.stagger-2 { animation-delay: 0.3s; }
          .blink-outline.stagger-3 { animation-delay: 0.45s; }
          @media (min-width: 1024px) {
            .visualizer-aspect {
              aspect-ratio: var(--vr, 16/9);
            }
            .visualizer-aspect > .visualizer-box {
              height: 100% !important;
            }
          }
          /* Responsive swatch sizing and padding so swatches don't squeeze the image */
          .swatch-size {
            width: clamp(30px, 9.2vw, 112px);
            aspect-ratio: 1 / 1;
          }
          .swatch-pad {
            padding: clamp(3px, 1.1vw, 6px);
          }
          /* Share button responsive sizing */
          .share-btn {
            font-size: clamp(12px, 1.4vmin, 16px);
            padding: clamp(6px, 0.9vmin, 10px) clamp(10px, 1.4vmin, 14px);
            border-radius: 12px;
          }
          .share-btn svg {
            width: clamp(14px, 1.8vmin, 20px);
            height: clamp(14px, 1.8vmin, 20px);
          }
          /* Mobile landscape: slightly reduce code text size on selected swatch */
          @media (max-width: 1024px) and (orientation: landscape) {
            /* Hide the Visualizer title on mobile landscape (scoped to this column only) */
            .visualizer-column .title-text {
              display: none !important;
            }
            .paint-swatch.selected-color .swatch-code {
              font-size: clamp(6px, 1.6vw, 11px) !important;
            }
            /* Make swatches much smaller on mobile landscape */
            .swatch-size {
              width: clamp(60px, 2.8vmin, 100px);
            }
            .swatch-pad {
              padding: clamp(1px, 0.6vmin, 3px);
            }
            /* Hide text to avoid overflow in tiny swatches */
            .paint-swatch .swatch-name,
            .paint-swatch .swatch-code {
              display: none;
            }
            /* Smaller share button on landscape mobile */
            .share-btn {
              font-size: clamp(9px, 1.4vw, 11px);
              padding: 4px 8px;
            }
            .share-btn svg {
              width: clamp(12px, 1.8vw, 14px) !important;
              height: clamp(12px, 1.8vw, 14px) !important;
            }
          }
        `}</style>
        {/* Top: Title */}
        <div className="flex flex-col px-0 lg:px-2 pt-2 lg:pt-4 pb-1 lg:pb-2 w-full">
          <div className=" font-bold leading-none  text-black text-[18px] lg:text-[24px] xl:text-[28px] 2xl:text-[36px] text-center font-brand mb-0 lg:mb-3 lg:mt-3">
            <p className="block leading-normal">Visualizer</p>
          </div>
        </div>
        {/* Room Visualization Area */}
        <div className="flex flex-col gap-2.5 items-center justify-center overflow-hidden px-4 lg:px-[18px] w-full min-h-0 flex-1">


          
{/* Ratio wrapper (locked to 1920/1308 aspect ratio) */}
<div className="visualizer-aspect w-full" style={{ ['--vr']: '1920/1308' }}>
            <div 
              ref={containerRef}
              className="visualizer-box w-full h-full rounded-2xl lg:rounded-3xl relative cursor-pointer min-h-[200px] overflow-hidden"
              onClick={handleCanvasClick}
            >
            {/* Clear Areas pill */}
            <div className="absolute bg-white text-black rounded-lg flex items-center gap-2 shadow-sm z-[200]"
                 style={{ top: `${Math.round(24 * landscapeScale)}px`, right: `${Math.round(24 * landscapeScale)}px`, padding: `${Math.max(1, Math.round(8 * landscapeScale))}px ${Math.max(4, Math.round(12 * landscapeScale))}px` }}>
              <button
                type="button"
                className="font-medium flex items-center gap-2"
                style={{ fontSize: `${Math.max(10, Math.round(12 * landscapeScale))}px` }}
                onClick={(e) => { e.stopPropagation(); onClearAreas && onClearAreas(); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={Math.max(14, Math.round(16 * landscapeScale))} height={Math.max(14, Math.round(16 * landscapeScale))} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20.9996 21.0001H7.99957C7.73587 21.0007 7.47465 20.9491 7.23095 20.8484C6.98725 20.7476 6.76588 20.5997 6.57957 20.4131L2.58557 16.4141C2.21063 16.039 2 15.5304 2 15.0001C2 14.4697 2.21063 13.9611 2.58557 13.5861L12.5856 3.58607C12.7713 3.40027 12.9918 3.25288 13.2345 3.15232C13.4772 3.05176 13.7374 3 14.0001 3C14.2628 3 14.5229 3.05176 14.7656 3.15232C15.0083 3.25288 15.2288 3.40027 15.4146 3.58607L21.4136 9.58607C21.7885 9.96113 21.9991 10.4697 21.9991 11.0001C21.9991 11.5304 21.7885 12.039 21.4136 12.4141L12.8336 21.0001" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.08203 11.0898L13.91 19.9178" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                CLEAR AREAS
              </button>
            </div>
            {/* Base room image */}
            <img 
              src={basePathsRef.current?.medium || buildOptimized(roomData[currentRoom].baseImage).medium}
              srcSet={`${(basePathsRef.current?.lqip || buildOptimized(roomData[currentRoom].baseImage).lqip)} 20w, ${(basePathsRef.current?.medium || buildOptimized(roomData[currentRoom].baseImage).medium)} 800w, ${(basePathsRef.current?.original || buildOptimized(roomData[currentRoom].baseImage).original)} 1600w`}
              sizes="50vw"
              alt={`${roomData[currentRoom].name} base`}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
              decoding="async"
              draggable={false}
              loading="eager"
              fetchpriority="high"
              onLoad={() => setIsBaseLoaded(true)}
              onError={(e) => {
                // Fallback to original if optimized fails; if that fails too, hide overlay
                const paths = basePathsRef.current || buildOptimized(roomData[currentRoom].baseImage);
                if (e.currentTarget.src !== window.location.origin + paths.original && e.currentTarget.src !== paths.original) {
                  e.currentTarget.src = paths.original;
                } else {
                  setIsBaseLoaded(true);
                }
              }}
            />
            
            {/* Mask overlays and selection outlines for each surface */}
            {roomData[currentRoom].surfaces.map((surface, idx) => {
              const loadedMask = maskImagesRef.current[surface.id];
              const isSelected = selectedSurface === surface.id;
              const surfaceColor = surfaceColors[surface.id];

              const overlays = [];

              // Coloured mask overlay if painted
              if (surfaceColor) {
                overlays.push(
                  <div
                    key={`color-${surface.id}`}
                    className={"absolute inset-0 w-full h-full rounded-2xl lg:rounded-3xl opacity-100"}
                    style={{
                      backgroundColor: surfaceColor,
                      maskImage: loadedMask ? `url(${loadedMask.src || surface.mask})` : 'none',
                      WebkitMaskImage: loadedMask ? `url(${loadedMask.src || surface.mask})` : 'none',
                      maskSize: 'cover',
                      WebkitMaskSize: 'cover',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      mixBlendMode: 'multiply',
                      zIndex: idx + 1,
                      pointerEvents: 'none',
                      display: loadedMask ? 'block' : 'none',
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                );
              }

              // Outline path builder
              const maskPath = surface.mask || '';
              const lastSlash = maskPath.lastIndexOf('/');
              const dir = lastSlash !== -1 ? maskPath.substring(0, lastSlash) : '';
              const outlinePath = dir ? `${dir}/outline_${surface.id}.png` : '';

              // Selection outline if selected
              if (isSelected) {
                overlays.push(
                  <img
                    key={`sel-${surface.id}`}
                    src={outlinePath}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
                    style={{ zIndex: 150, pointerEvents: 'none' }}
                    draggable={false}
                  />
                );
              }

              // Pre-selection blink outline on top (applies to all surfaces)
              if (shouldBlinkSelection) {
                overlays.push(
                  <img
                    key={`blink-${surface.id}`}
                    src={outlinePath}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl blink-outline stagger-${idx % 4}`}
                    style={{ zIndex: 160, pointerEvents: 'none' }}
                    draggable={false}
                  />
                );
              }

              // If nothing to show and not in blink mode, skip
              if (!shouldBlinkSelection && overlays.length === 0) return null;

              return <React.Fragment key={surface.id}>{overlays}</React.Fragment>;
            })}
            
            {/* Loading overlays */}
            {!isBaseLoaded ? (
              <div className="absolute inset-0 z-[500] bg-white/70 flex items-center justify-center rounded-2xl lg:rounded-3xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
                  <div className="text-sm font-brand text-black/80">Loading image...</div>
                </div>
              </div>
            ) : (!isMasksLoaded && (
              <div className="absolute inset-0 z-[400] bg-black/20 flex items-center justify-center rounded-2xl lg:rounded-3xl">
                <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium font-brand">Loading masks...</div>
              </div>
            ))}
            
            {/* Selection indicator (hidden intentionally) */}
            
      
            </div>
          </div>
          <div className="surface-text font-light leading-none text-[#575454] text-[20px] lg:text-[28px] text-center font-brand w-full flex items-center justify-between px-6">
            <p className="block leading-normal">{shouldBlinkSelection ? 'Select the wall you want to paint.' : 'Explore the colour lockups to find the perfect match.'}</p>
            <button
              type="button"
              onClick={onShare}
              className="bg-white text-black rounded-xl border border-[#bab1b1] flex items-center gap-2 hover:bg-gray-50 share-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 33" fill="none" aria-hidden="true">
                <path d="M24 11.166C26.2091 11.166 28 9.37515 28 7.16602C28 4.95688 26.2091 3.16602 24 3.16602C21.7909 3.16602 20 4.95688 20 7.16602C20 9.37515 21.7909 11.166 24 11.166Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 20.5C10.2091 20.5 12 18.7091 12 16.5C12 14.2909 10.2091 12.5 8 12.5C5.79086 12.5 4 14.2909 4 16.5C4 18.7091 5.79086 20.5 8 20.5Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 29.834C26.2091 29.834 28 28.0431 28 25.834C28 23.6248 26.2091 21.834 24 21.834C21.7909 21.834 20 23.6248 20 25.834C20 28.0431 21.7909 29.834 24 29.834Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4531 18.5137L20.5598 23.8203" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.5465 9.17969L11.4531 14.4864" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </button>
          </div>

          
          
          
        </div>
        
        {/* Paint Color Swatches */}
        <div
          className="w-[calc(100%-16px)] rounded-[24px] border-[3px] border-solid border-[#D2D2D2] mt-3 lg:mt-4 mx-2 mb-2"
          style={{ background: 'linear-gradient(188deg, #FFF 0.36%, #F3F3F3 99.39%)' }}
        >
          <div className="flex flex-row gap-4  items-end justify-evenly overflow-hidden px-6  pt-3 pb-2 lg:pt-4 lg:pb-3 w-full min-h-0">
            {/** Helper to choose text color for swatch background */}
            {(() => {
              return null; // placeholder to allow function declarations below without changing JSX flow
            })()}
            {/** Contrast helpers (function declarations scoped in component file) */}
            { /* eslint-disable-next-line no-unused-vars */ }
            { /* Functions defined via inline IIFE to keep in-file scope without re-renders */ }
            { /* They are not executed here; only referenced below */ }
            {Array.from({ length: 4 }).map((_, index) => {
              const color = (colorPalettes[currentPalette]?.paintColors || [])[index];
              const isFilled = Boolean(color);
              const commonClasses = 'swatch-size rounded-bl-[16px] lg:rounded-bl-[24px] rounded-tr-[16px] lg:rounded-tr-[24px]';
 
              if (isFilled) {
                const details = colorInfo?.[color?.toUpperCase()] || {};
                const parseHex = (hex) => {
                  if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
                  const normalized = hex.replace('#', '').trim();
                  if (normalized.length === 3) {
                    const r = parseInt(normalized[0] + normalized[0], 16);
                    const g = parseInt(normalized[1] + normalized[1], 16);
                    const b = parseInt(normalized[2] + normalized[2], 16);
                    return { r, g, b };
                  }
                  const r = parseInt(normalized.substring(0, 2), 16);
                  const g = parseInt(normalized.substring(2, 4), 16);
                  const b = parseInt(normalized.substring(4, 6), 16);
                  if ([r, g, b].some((n) => Number.isNaN(n))) return { r: 255, g: 255, b: 255 };
                  return { r, g, b };
                };
                const { r, g, b } = parseHex(color);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                const textColor = brightness <= 140 ? '#FFFFFF' : '#000000';
                return (
                  <div key={index} className="flex flex-col items-center gap-1 swatch-item ">
                    <div className="relative swatch-container overflow-visible">
                      <div
                        className={`${commonClasses} cursor-pointer paint-swatch swatch-pad ${currentPaintColor === color ? 'selected-color' : ''} flex flex-col items-center justify-center text-center`}
                        style={{ backgroundColor: color, color: textColor }}
                        onClick={() => selectPaint(color)}
                        title={details.name || color}
                      >
                        <span
                          className="swatch-name font-medium leading-tight max-w-[90%] text-center text-[clamp(8px,2.6vw,10px)] break-words"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {details.name || ''}
                        </span>
                        {details.detail && (
                          <span className="swatch-code leading-none mt-1 opacity-90 max-w-[90%] text-center whitespace-nowrap text-[clamp(10px,2.2vw,12px)] overflow-hidden text-ellipsis">
                            {details.detail}
                          </span>
                        )}
                      </div>
                      <div
                        className="absolute -top-1 -right-1 bg-black bg-opacity-80 rounded-full p-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePaint(index);
                        }}
                        title="Remove colour"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 12 12"
                          width="15"
                          height="15"
                        >
                          <line x1="2" y1="2" x2="10" y2="10" stroke="white" strokeWidth="2" />
                          <line x1="10" y1="2" x2="2" y2="10" stroke="white" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }
 
              // Placeholder swatch
              return (
                <div key={index} className="flex flex-col items-center gap-1 swatch-item ">
                  <div className={`${commonClasses} bg-gray-200`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer; 