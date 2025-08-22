
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import HeartColored from './HeartColored';
import { getVideoBlob, storeVideoBlob } from '../../services/videoCache';
import { citiesData } from '../../data/cities';

const cityImages = Object.values(citiesData).map((c) => `/City/${c.name} H Small.png`);

// Helper for optimized image sources
const buildOptimized = (src) => {
  if (!src || typeof src !== 'string') return { lqip: src, low: src, medium: src, original: src };
  const lastDot = src.lastIndexOf('.');
  if (lastDot === -1) return { lqip: `/optimized${src}-lqip.jpg`, low: `/optimized${src}-low`, medium: `/optimized${src}-med`, original: src };
  const base = src.substring(0, lastDot);
  const ext = src.substring(lastDot);
  return {
    lqip: `/optimized${base}-lqip.jpg`,
    low: `/optimized${base}-low${ext}`,
    medium: `/optimized${base}-med${ext}`,
    original: src,
  };
};

// Progressive image loader that displays LQIP → Low → Medium → Original
// Props:
// - startAt: 'lqip' | 'low' | 'medium' (default 'lqip') - where to start for the first paint
// - canUpgrade: if false, holds at current quality and defers preloads
// - enableBlur: apply small blur while upgrading (disable for transparent PNGs)
// - maxQuality: 'lqip' | 'low' | 'medium' | 'original' (default 'original') - upper bound for upgrades
// - preloadNext: when true (default), preloads the next step before swapping; when false, chains via the DOM img onload (1 network request per step)
// - onFirstQualityLoad: callback invoked once when the initial `startAt` quality finishes loading in the DOM <img>
const ProgressiveImage = ({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  canUpgrade = true,
  startAt = 'lqip',
  enableBlur = true,
  maxQuality = 'original',
  preloadNext = true,
  onFirstQualityLoad,
  onOriginalLoad,
}) => {
  const { lqip, low, medium, original } = buildOptimized(src);
  const initialSrc = startAt === 'medium' ? medium : startAt === 'low' ? low : lqip;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [isBlurred, setIsBlurred] = useState(enableBlur);
  const onOriginalLoadRef = useRef(onOriginalLoad);
  useEffect(() => { onOriginalLoadRef.current = onOriginalLoad; }, [onOriginalLoad]);
  const onFirstQualityLoadRef = useRef(onFirstQualityLoad);
  useEffect(() => { onFirstQualityLoadRef.current = onFirstQualityLoad; }, [onFirstQualityLoad]);
  const imgElementRef = useRef(null);
  const firstLoadNotifiedRef = useRef(false);

  // Reset to starting quality when the source changes
  useEffect(() => {
    let cancelled = false;
    const startSrc = startAt === 'medium' ? medium : startAt === 'low' ? low : lqip;
    setCurrentSrc(startSrc);
    setIsBlurred(enableBlur);

    // If we cannot upgrade yet, stop here (we'll upgrade when canUpgrade flips true)
    if (!canUpgrade) {
      return () => { cancelled = true; };
    }

    const qualities = ['lqip', 'low', 'medium', 'original'];
    const qualityToUrl = (q) => (q === 'lqip' ? lqip : q === 'low' ? low : q === 'medium' ? medium : original);
    const startIndex = Math.max(0, qualities.indexOf(startAt));
    const maxIndex = Math.max(0, qualities.indexOf(maxQuality));

    const finalize = () => {
      if (enableBlur) {
        setTimeout(() => { if (!cancelled) setIsBlurred(false); }, 120);
      }
      if (maxQuality === 'original' && onOriginalLoadRef.current) {
        onOriginalLoadRef.current();
      }
    };

    // Preload path: use off-DOM Image() to load before swapping
    if (preloadNext) {
      const loadImage = (url, onSuccess) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        img.onload = () => { if (!cancelled) onSuccess && onSuccess(); };
        img.onerror = () => { if (!cancelled) onSuccess && onSuccess('error'); };
      };

      const goTo = (q, next) => {
        const url = qualityToUrl(q);
        loadImage(url, () => {
          if (cancelled) return;
          setCurrentSrc(url);
          if (next) {
            next();
          } else {
            finalize();
          }
        });
      };

      // Build the chain from current startAt up to maxQuality
      const steps = qualities.slice(startIndex + 1, maxIndex + 1);
      if (steps.length === 0) {
        // Already at or above maxQuality
        finalize();
      } else {
        // Create nested calls to ensure sequential loading
        let idx = 0;
        const next = () => {
          idx += 1;
          if (idx < steps.length) {
            goTo(steps[idx], next);
          } else {
            finalize();
          }
        };
        goTo(steps[0], next);
      }

      return () => { cancelled = true; };
    }

    // No-preload path: rely on the DOM <img> onload; one request per step
    const imgEl = imgElementRef.current;
    if (!imgEl) {
      return () => { cancelled = true; };
    }
    const queue = qualities.slice(startIndex + 1, maxIndex + 1);
    const handleLoad = () => {
      if (cancelled) return;
      if (queue.length === 0) {
        finalize();
        return;
      }
      const nextQuality = queue.shift();
      const nextUrl = qualityToUrl(nextQuality);
      setCurrentSrc(nextUrl);
    };
    const handleImgOnload = () => {
      if (!firstLoadNotifiedRef.current) {
        firstLoadNotifiedRef.current = true;
        if (onFirstQualityLoadRef.current) onFirstQualityLoadRef.current(startAt);
      }
      handleLoad();
    };
    imgEl.addEventListener('load', handleImgOnload);
    // If the starting quality already loaded, kick off the chain immediately
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      // Defer to avoid firing in the middle of a render
      setTimeout(() => { if (!cancelled) {
        if (!firstLoadNotifiedRef.current) {
          firstLoadNotifiedRef.current = true;
          if (onFirstQualityLoadRef.current) onFirstQualityLoadRef.current(startAt);
        }
        handleLoad();
      } }, 0);
    }
    return () => { cancelled = true; if (imgEl) imgEl.removeEventListener('load', handleImgOnload); };
  }, [src, lqip, low, medium, original, canUpgrade, startAt, enableBlur, maxQuality, preloadNext]);

  return (
    <img
      ref={imgElementRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${enableBlur && isBlurred ? 'blur-sm' : ''}`}
      style={style}
      loading={loading}
      decoding="async"
      onLoad={() => {
        if (!firstLoadNotifiedRef.current) {
          firstLoadNotifiedRef.current = true;
          if (onFirstQualityLoadRef.current) onFirstQualityLoadRef.current(startAt);
        }
      }}
    />
  );
};

const WelcomeScreen = () => {
  const contentRef = useRef(null);
  const taglineRef = useRef(null);
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [popupHearts, setPopupHearts] = useState([]);
  // Flags to ensure prerequisites before starting heart animation
  const [apiLoaded, setApiLoaded] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
  // Tagline animation states
  const [taglineOpacity, setTaglineOpacity] = useState(1);
  const [currentTaglineText, setCurrentTaglineText] = useState("TURNING MEMORIES OF PLACES INTO SHADES YOU CAN FEEL.");
  const duration = 3000; // 3 seconds
  const loop = false;
  // Base design reference (FHD)
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;
  const [scale, setScale] = useState(1);
  const MIN_DISTANCE = 100; // Prevent hearts within 100px radius of existing hearts
  const HEART_SIZE = 48; // Heart icon dimensions (approx)
  const RESTRICTED_MARGIN = 20; // Additional margin around restricted areas
  const SEAM_MARGIN = 30; // Min distance from background image seams where hearts cannot spawn
  const POP_INTERVAL = 200; // ms between new popup hearts
  const MAX_POPUP_HEARTS = 80; // maximum number of popup hearts allowed on screen
  // Animation speeds
  const CAROUSEL_DURATION_S = 240; // slower drift to match original vw/s with 3 slides
  const HEART_DRIFT_DISTANCE_VW = 6; // keep same drift distance
  // For three slides, the container travels 200vw per cycle (from 0 to -200vw)
  const HEART_DRIFT_DURATION_S = (CAROUSEL_DURATION_S * HEART_DRIFT_DISTANCE_VW) / 200; // match carousel vw/s
  // Randomize background carousel order once per mount
  // Shuffle helper used for initial render and on iterations
  const shuffleOnce = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Initialize the carousel with a shuffled order so the first paint is random
  const [carouselImages, setCarouselImages] = useState(() => shuffleOnce(cityImages));
  // Render three images at a time for the drifting background
  const [carouselIndices, setCarouselIndices] = useState(() => ({
    first: 0,
    second: cityImages.length > 1 ? 1 : 0,
    third: cityImages.length > 2 ? 2 : (cityImages.length > 1 ? 1 : 0),
  }));
  // Flag when at least one background slide has painted at low quality
  const [bgLowReady, setBgLowReady] = useState(false);
  // Gate background upgrades until center graphics reach original quality
  const [centerOriginalCount, setCenterOriginalCount] = useState(0);
  const centerReady = centerOriginalCount >= 2;
  // (Removed mount-time shuffle useEffect to avoid first-paint flicker)

  // When animation completes (2nd image fully passed), restart with a fresh random order
  const handleCarouselIteration = () => {
    setCarouselImages((prev) => {
      const shuffled = shuffleOnce(prev);
      setCarouselIndices({
        first: 0,
        second: shuffled.length > 1 ? 1 : 0,
        third: shuffled.length > 2 ? 2 : (shuffled.length > 1 ? 1 : 0),
      });
      return shuffled;
    });
  };

  // Keep the FHD layout proportions across all viewports
  useEffect(() => {
    const handleResize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : BASE_WIDTH;
      const h = typeof window !== 'undefined' ? window.innerHeight : BASE_HEIGHT;
      const s = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
      setScale(s);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload raw countries data once when the welcome screen mounts. The ApiService handles
  // storing the response in both memory and localStorage so downstream components can
  // access it without additional network calls.
  useEffect(() => {
    ApiService.getCountries()
      .then(() => setApiLoaded(true))
      .catch((err) => {
        console.error('Failed to preload countries data:', err);
        // Even if the API call fails, allow the animation to proceed
        setApiLoaded(true);
      });
  }, []);

  // Preload city selection transition videos and cache in localStorage
  useEffect(() => {
    const cityVideos = [
      { name: 'Bali', path: '/City/SelectionTransition/Bali.mp4' },
      { name: 'Egypt', path: '/City/SelectionTransition/Egypt.mp4' },
      { name: 'France', path: '/City/SelectionTransition/France.mp4' },
      { name: 'Greece', path: '/City/SelectionTransition/Greece.mp4' },
      { name: 'Japan', path: '/City/SelectionTransition/Japan.mp4' },
      { name: 'Kenya', path: '/City/SelectionTransition/Kenya.mp4' },
      { name: "L'Dweep", path: '/City/SelectionTransition/L\'Dweep.mp4' },
      { name: 'Morocco', path: '/City/SelectionTransition/Morocco.mp4' },
      { name: 'Spain', path: '/City/SelectionTransition/Spain.mp4' },
      { name: 'Vietnam', path: '/City/SelectionTransition/Vietnam.mp4' },
    ];

    const preloadVideos = async () => {
      const urlMap = {};
      try {
        await Promise.all(
          cityVideos.map(async ({ name, path }) => {
            let blob = await getVideoBlob(name);
            if (!blob) {
              const response = await fetch(path, { cache: 'force-cache' });
              if (!response.ok) {
                console.error('Failed to fetch video', name);
                return;
              }
              blob = await response.blob();
              await storeVideoBlob(name, blob);
            }
            // Create an in-memory object URL for immediate playback
            urlMap[name] = URL.createObjectURL(blob);
          })
        );
        if (typeof window !== 'undefined') {
          window.cityVideoUrls = urlMap;
        }
      } catch (err) {
        console.error('Error preloading videos:', err);
      }
      setVideosLoaded(true);
    };

    preloadVideos();
  }, []);

  // Start the heart fill animation only after data and videos are ready
  useEffect(() => {
    if (apiLoaded && videosLoaded && !isAnimating && !animationCompleted) {
      startAnimation();
    }
  }, [apiLoaded, videosLoaded]);

  const handleNavigate = () => {
    navigate('/city-selection');
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setProgress(0);
  };

  // Calculate distance between two points
  const calculateDistance = (pos1, pos2) => {
    const deltaX = pos1.x - pos2.x;
    const deltaY = pos1.y - pos2.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  // Check if a position is too close to existing hearts
  const isPositionValid = (newPos, existingHearts) => {
    return existingHearts.every(heart => 
      calculateDistance(newPos, { x: heart.x, y: heart.y }) >= MIN_DISTANCE
    );
  };

  // Determine if a heart position intersects with any restricted rectangles
  const isInRestrictedArea = (pos, rects) => {
    const heartRect = {
      left: pos.x - RESTRICTED_MARGIN,
      right: pos.x + HEART_SIZE + RESTRICTED_MARGIN,
      top: pos.y - RESTRICTED_MARGIN,
      bottom: pos.y + HEART_SIZE + RESTRICTED_MARGIN,
    };
    return rects.some((rect) => {
      return !(
        heartRect.right < rect.left ||
        heartRect.left > rect.right ||
        heartRect.bottom < rect.top ||
        heartRect.top > rect.bottom
      );
    });
  };

  // Get the bounding rectangles that hearts should avoid: content, tagline and the seam
  const getRestrictedRects = () => {
    const rects = [];

    // 1. Core UI blocks
    if (contentRef.current) {
      rects.push(contentRef.current.getBoundingClientRect());
    }
    if (taglineRef.current) {
      rects.push(taglineRef.current.getBoundingClientRect());
    }

    // 2. Seam lines between the background carousel images
    const carousel = document.querySelector('.animate-carousel-drift');
    if (carousel) {
      carousel.querySelectorAll('img').forEach((img) => {
        const imgRect = img.getBoundingClientRect();
        rects.push({
          left: imgRect.right - SEAM_MARGIN,
          right: imgRect.right + SEAM_MARGIN,
          top: 0,
          bottom: window.innerHeight,
        });
      });
    }

    return rects;
  };

  // Generate random position within viewport with collision detection
  const getRandomPosition = (existingHearts) => {
    const MAX_ATTEMPTS = 100;
    let attempts = 0;
    let position;
    
    while (attempts < MAX_ATTEMPTS) {
      position = {
        x: Math.random() * (window.innerWidth - HEART_SIZE),
        y: Math.random() * (window.innerHeight - HEART_SIZE),
      };
      const restrictedRects = getRestrictedRects();
      if (isPositionValid(position, existingHearts) && !isInRestrictedArea(position, restrictedRects)) {
        return position;
      }
      attempts++;
    }
    // Failed to find a valid non-colliding position
    return null;
  };

  // Create a new heart
  const getColorAtViewport = (x, y) => {
    // Grab all elements under the given viewport co-ordinates and pick the first <img>
    const img = (document.elementsFromPoint?.(x, y) || [])
      .find((node) => node.tagName === 'IMG');
    if (!img) return '#ffffff'; // fallback when nothing found
    const rect = img.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;

    // Guard against division by zero
    if (rect.width === 0 || rect.height === 0) return '#ffffff';

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const sourceX = Math.floor(relativeX * scaleX);
    const sourceY = Math.floor(relativeY * scaleY);

    // Reuse an off-screen canvas for efficiency
    if (!getColorAtViewport._canvas) {
      const c = document.createElement('canvas');
      getColorAtViewport._canvas = c;
      // Inform the browser that frequent readbacks will occur
      getColorAtViewport._ctx = c.getContext('2d', { willReadFrequently: true });
    }
    const canvas = getColorAtViewport._canvas;
    const ctx = getColorAtViewport._ctx;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    try {
      const pixel = ctx.getImageData(sourceX, sourceY, 1, 1).data;
      let [r, g, b, a] = pixel;
      // If fully transparent, fallback
      if (a === 0) return '#ffffff';

      // Calculate perceived luminance (0 = dark, 1 = light)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance < 0.4) {
        // Lighten the colour by blending with white
        const factor = 0.2; // 0 = no change, 1 = fully white
        r = Math.round(r + (255 - r) * factor);
        g = Math.round(g + (255 - g) * factor);
        b = Math.round(b + (255 - b) * factor);
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch (err) {
      // SecurityError or out-of-bounds
      console.warn('Failed to sample color:', err);
      return '#ffffff';
    }
  };

  const isWhiteColor = (color) => {
    if (!color || typeof color !== 'string') return false;
    const normalized = color.toLowerCase().replace(/\s+/g, '');
    return normalized === '#ffffff' || normalized === 'rgb(255,255,255)';
  };

  const createHeart = (existingHearts) => {
    const position = getRandomPosition(existingHearts);
    if (!position) return null; // Give up if no safe spot found

    // Sample color roughly at the center of the heart (offset half the icon size)
    const color = getColorAtViewport(position.x + 24, position.y + 24);

    // Skip hearts that would render as completely white
    if (isWhiteColor(color)) return null;

    const newHeart = {
      id: Date.now() + Math.random(),
      ...position,
      color,
      scale: 0,
      targetScale: 0.6 + Math.random() * 0.6, // Random scale factor between 0.6x and 1.2x
      opacity: 0,
      fadeOut: false,
    };
    return newHeart;
  };

  // Main heart fill animation effect
  useEffect(() => {
    if (isAnimating) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setAnimationCompleted(true);
          
          if (loop) {
            setTimeout(startAnimation, 1000); // Restart after 1 second
          }
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isAnimating, duration, loop]);

  // Popup hearts animation effect (starts only after BG low-quality is painted)
  useEffect(() => {
    if (!bgLowReady) return undefined;
    const interval = setInterval(() => {
      setPopupHearts(prev => {
        if (prev.length >= MAX_POPUP_HEARTS) return prev; // Respect global heart limit
        const newHeart = createHeart(prev);
        return newHeart ? [...prev, newHeart] : prev;
      });
    }, POP_INTERVAL);
    return () => clearInterval(interval);
  }, [bgLowReady]);

  // Animate hearts after they're created and handle fade out
  useEffect(() => {
    popupHearts.forEach(heart => {
      if (heart.scale === 0 && !heart.fadeOut) {
        // Animate the heart popup
        setTimeout(() => {
          setPopupHearts(prev => 
            prev.map(h => 
              h.id === heart.id 
                ? { ...h, scale: h.targetScale, opacity: 1 }
                : h
            )
          );
        }, 100);

        // Start fade out after 2 seconds
        setTimeout(() => {
          setPopupHearts(prev => 
            prev.map(h => 
              h.id === heart.id 
                ? { ...h, fadeOut: true }
                : h
            )
          );
        }, 2100);

        // Remove heart after fade out completes
        setTimeout(() => {
          setPopupHearts(prev => prev.filter(h => h.id !== heart.id));
        }, 3700);
      }
    });
  }, [popupHearts]);





  // Tagline text fade animation effect
  useEffect(() => {
    const TAP_THRESHOLD = 0.4;
    const shouldShowTapInstruction = progress >= TAP_THRESHOLD || animationCompleted;
    const newText = shouldShowTapInstruction 
      ? "Tap the Heart to Explore"
      : "Turning memories of places into shades you can feel.";
    
    // Only animate if text actually changes
    if (currentTaglineText !== newText) {
      // Fade out
      setTaglineOpacity(0);
      
      // After fade out completes, change text and fade in
      setTimeout(() => {
        setCurrentTaglineText(newText);
        setTaglineOpacity(1);
      }, 300); // 300ms fade out duration
    }
  }, [progress, animationCompleted, currentTaglineText]);

  const TAP_THRESHOLD = 0.4; // show 2s before completion when duration is 3s
  const showTapInstruction = progress >= TAP_THRESHOLD || animationCompleted;
  const clipPathValue = `inset(${100 - (progress * 100)}% 0 0 0)`;
  const BEEP_START_LEAD_MS = 1450; // start heartbeat 1000ms (1s) before fill completes
  const showBeepingOverlay = animationCompleted || (progress >= Math.max(0, 1 - BEEP_START_LEAD_MS / duration));

  return (
    <div className="h-screen w-screen overflow-hidden flex relative">
      {/* Background Layer - Carousel Container (z-index: 1) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-[1]">
        <div
          className="flex animate-carousel-drift"
          onAnimationIteration={handleCarouselIteration}
          style={{ animationDuration: `${CAROUSEL_DURATION_S}s` }}
        >
          {/* First slide */}
          {carouselImages.length > 0 && (
            <ProgressiveImage
              key={`first-${carouselIndices.first}`}
              src={carouselImages[carouselIndices.first]}
              alt={`City ${carouselIndices.first}`}
              className="h-full w-screen object-cover flex-shrink-0"
              style={{ width: '100vw', height: '100vh' }}
              loading="eager"
              canUpgrade={centerReady}
              startAt="low"
              maxQuality="medium"
              preloadNext={false}
              enableBlur={false}
              onFirstQualityLoad={() => setBgLowReady(true)}
            />
          )}
          {/* Second slide */}
          {carouselImages.length > 0 && (
            <ProgressiveImage
              key={`second-${carouselIndices.second}`}
              src={carouselImages[carouselIndices.second]}
              alt={`City ${carouselIndices.second}`}
              className="h-full w-screen object-cover flex-shrink-0"
              style={{ width: '100vw', height: '100vh' }}
              loading="eager"
              canUpgrade={centerReady}
              startAt="low"
              maxQuality="medium"
              preloadNext={false}
              enableBlur={false}
              onFirstQualityLoad={() => setBgLowReady(true)}
            />
          )}
          {/* Third slide */}
          {carouselImages.length > 0 && (
            <ProgressiveImage
              key={`third-${carouselIndices.third}`}
              src={carouselImages[carouselIndices.third]}
              alt={`City ${carouselIndices.third}`}
              className="h-full w-screen object-cover flex-shrink-0"
              style={{ width: '100vw', height: '100vh' }}
              loading="eager"
              canUpgrade={centerReady}
              startAt="low"
              maxQuality="medium"
              preloadNext={false}
              enableBlur={false}
              onFirstQualityLoad={() => setBgLowReady(true)}
            />
          )}
        </div>
      </div>

      {/* Content Layer - Centered Content (z-index: 10) */}
      <div className="absolute inset-0 flex items-center justify-center z-[20]">
        {/* Scaled root sized to FHD, scaled to fit viewport */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >
          {/* Heart Animation Container */}
          <div 
            ref={contentRef}
            className="bg-white bg-opacity-70 backdrop-blur-md rounded-2xl text-center cursor-pointer shadow-lg flex flex-col items-center gap-6"
            onClick={handleNavigate}
          >
            {/* Heart Loading Animation */}
            <div className="relative w-[38rem] h-[20rem] flex items-center justify-center">
              {/* White heart as base - progressive */}
              <ProgressiveImage 
                src="/COW_white_heart.png" 
                alt="White Heart" 
                className="absolute w-full h-full object-contain"
                loading="eager"
                canUpgrade={true}
                startAt="medium"
                enableBlur={false}
                onOriginalLoad={() => setCenterOriginalCount((c) => c + 1)}
              />
              
              {/* Red heart with animated clip-path - progressive */}
              <ProgressiveImage 
                src="/COW_Red_heart_Explore.png" 
                alt="Red Heart" 
                className="absolute w-full h-full object-contain"
                style={{ 
                  clipPath: clipPathValue,
                  transition: isAnimating ? 'none' : 'clip-path 0.3s ease'
                }}
                loading="eager"
                canUpgrade={true}
                startAt="medium"
                enableBlur={false}
                onOriginalLoad={() => setCenterOriginalCount((c) => c + 1)}
              />

              {/* Beeping overlay to attract attention once fill completes */}
              {showBeepingOverlay && (
                <ProgressiveImage
                  src="/BeepingHeart.png"
                  alt="Tap to explore"
                  className="heartbeat-overlay object-contain"
                  style={{ zIndex: 50 }}
                  loading="eager"
                  canUpgrade={true}
                  startAt="medium"
                  enableBlur={false}
                />
              )}
            </div>
          </div>

          {/* Tagline Container - positioned within the scaled root */}
          <div 
            ref={taglineRef} 
            className="absolute bottom-10 backdrop-blur-md rounded-lg px-6 py-3 shadow-md z-[11]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              border: '2px solid rgba(255, 255, 255, 1.0)'
            }}
          >
            <p 
              className="text-black text-lg font-bold tracking-wider"
              style={{
                opacity: taglineOpacity,
                transition: 'opacity 0.3s ease-in-out'
              }}
            >
              {currentTaglineText}
            </p>
          </div>
        </div>
      </div>

      {/* Overlay Layer - Popup Hearts Animation (z-index: 20) */}
      <div className="absolute inset-0 pointer-events-none z-[10]">
        {popupHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute"
            style={{
              left: heart.x,
              top: heart.y,
              animation: `heart-drift ${HEART_DRIFT_DURATION_S}s linear forwards`,
              pointerEvents: 'none',
            }}
          >
            <div
              className="ease-out"
              style={{
                transform: `scale(${heart.scale})`,
                opacity: heart.fadeOut ? 0 : heart.opacity,
                transition: 'opacity 1.5s ease-out, transform 1s ease-out',
              }}
            >
              <HeartColored color={heart.color} size={56} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
