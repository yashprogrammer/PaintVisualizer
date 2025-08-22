import React, { useState, useRef, useEffect } from 'react';
import { useSpring, useTransition, animated, easings } from '@react-spring/web';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';

const cities = [
  { name: 'Bali', image: '/City/Bali H Small.png', blurredImage: '/City/Blurred/Bali H Small.jpg', video: '/City/SelectionTransition/Bali.mp4' },
  { name: 'Egypt', image: '/City/Egypt H Small.png', blurredImage: '/City/Blurred/Egypt H Small.jpg', video: '/City/SelectionTransition/Egypt.mp4' },
  { name: 'France', image: '/City/France H Small.png', blurredImage: '/City/Blurred/France H Small.jpg', video: '/City/SelectionTransition/France.mp4' },
  { name: 'Greece', image: '/City/Greece H Small.png', blurredImage: '/City/Blurred/Greece H Small.jpg', video: '/City/SelectionTransition/Greece.mp4' },
  { name: 'Japan', image: '/City/Japan H Small.png', blurredImage: '/City/Blurred/Japan H Small.jpg', video: '/City/SelectionTransition/Japan.mp4' },
  { name: 'Kenya', image: '/City/Kenya H Small.png', blurredImage: '/City/Blurred/Kenya H Small.jpg', video: '/City/SelectionTransition/Kenya.mp4' },
  { name: 'L\'Dweep', image: '/City/L\'Dweep H Small.png', blurredImage: '/City/Blurred/L\'Dweep H Small.jpg', video: '/City/SelectionTransition/L\'Dweep.mp4' },
  { name: 'Morocco', image: '/City/Morocco H Small.png', blurredImage: '/City/Blurred/Morocco H Small.jpg', video: '/City/SelectionTransition/Morocco.mp4' },
  { name: 'Spain', image: '/City/Spain H Small.png', blurredImage: '/City/Blurred/Spain H Small.jpg', video: '/City/SelectionTransition/Spain.mp4' },
  { name: 'Vietnam', image: '/City/Vietnam H Small.png', blurredImage: '/City/Blurred/Vietnam H Small.jpg', video: '/City/SelectionTransition/Vietnam.mp4' },
];

const CitySelector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to find city index by name
  const findCityIndex = (cityName) => {
    if (!cityName) return 1; // Default to Egypt (index 1)
    const normalizedCityName = cityName.toLowerCase().replace(/'/g, '');
    const index = cities.findIndex(city => 
      city.name.toLowerCase().replace(/'/g, '') === normalizedCityName
    );
    return index !== -1 ? index : 1; // Return found index or default to Egypt
  };

  // Determine initial selected city from navigation state or default to Egypt
  const initialCityIndex = location.state?.selectedCity 
    ? findCityIndex(location.state.selectedCity) 
    : 1;

  const [selectedIndex, setSelectedIndex] = useState(initialCityIndex);
  const [displayedCityIndex, setDisplayedCityIndex] = useState(initialCityIndex); // controls the city name shown in text
  // Virtual index over an extended array with cloned edges for seamless loop
  const [virtualIndex, setVirtualIndex] = useState(initialCityIndex + 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHeart, setShowHeart] = useState(true);
  const [showText, setShowText] = useState(true);
  const [playVideo, setPlayVideo] = useState(true);
  const [animationKey, setAnimationKey] = useState(0); // Add animation key state
  const [instantJump, setInstantJump] = useState(false); // disable CSS transition for index corrections
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef({ startX: 0, lastX: 0, startTime: 0, lastTime: 0, pointerId: null });
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  // Viewport-aware responsive sizing
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 720
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ensure the page body has a black background while this view is active
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousBackgroundColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'gray';
    return () => {
      document.body.style.backgroundColor = previousBackgroundColor;
    };
  }, []);

  const clampNumber = (min, value, max) => Math.min(max, Math.max(min, value));
  // Build optimized URLs for src/srcSet
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
  const mediumOnly = (src) => src ? `/optimized${src.replace(/\.[^.]+$/, (ext) => `-med${ext}`)}` : src;

  // Build optimized video URLs for low/medium/original
  const buildOptimizedVideo = (src) => {
    if (!src || typeof src !== 'string') return { low: src, medium: src, original: src };
    const lastDot = src.lastIndexOf('.');
    if (lastDot === -1) return { low: `/optimized${src}-low`, medium: `/optimized${src}-med`, original: src };
    const base = src.substring(0, lastDot);
    const ext = src.substring(lastDot);
    return {
      low: `/optimized${base}-low${ext}`,
      medium: `/optimized${base}-med${ext}`,
      original: src,
    };
  };

  // Preload blurred backgrounds for adjacent cities (prev/next) to speed up transitions
  useEffect(() => {
    if (!Array.isArray(cities) || cities.length === 0) return;
    const prevIndex = (selectedIndex - 1 + cities.length) % cities.length;
    const nextIndex = (selectedIndex + 1) % cities.length;

    const preloadBlurred = (src) => {
      if (!src) return;
      const { low } = buildOptimized(src);
      const img = new Image();
      img.src = low;
    };

    preloadBlurred(cities[prevIndex]?.blurredImage);
    preloadBlurred(cities[nextIndex]?.blurredImage);
  }, [selectedIndex]);

  // Progressive background loader with configurable start/max quality
  // Default behavior keeps backward compatibility; can start at 'low' and cap at 'medium'
  const ProgressiveBg = ({ image, styles, activateAfterMs = 700, startAt = 'lqip', maxQuality = 'original' }) => {
    const { lqip, low, medium, original } = buildOptimized(image);
    const initialSrc = startAt === 'low' ? low : lqip;
    const allowOriginal = maxQuality === 'original';
    const onlyLow = maxQuality === 'low';
    const [src, setSrc] = useState(initialSrc);
    const [canUpgrade, setCanUpgrade] = useState(false);
    const readyRef = useRef({ low: false, medium: false, original: false });
    const canUpgradeRef = useRef(false);

    useEffect(() => {
      let cancelled = false;
      setSrc(initialSrc);
      setCanUpgrade(false);
      canUpgradeRef.current = false;
      readyRef.current = { low: false, medium: false, original: false };

      // If only low quality is requested, set it and skip any further preloading/upgrades
      if (onlyLow) {
        setSrc(low);
        return () => {
          cancelled = true;
        };
      }

      // Preload low, medium, and original immediately
      const lowImg = new Image();
      lowImg.onload = () => {
        if (cancelled) return;
        readyRef.current.low = true;
        if (canUpgradeRef.current && src === lqip) setSrc(low);
      };
      lowImg.src = low;

      const medImg = new Image();
      medImg.onload = () => {
        if (cancelled) return;
        readyRef.current.medium = true;
        if (canUpgradeRef.current) setSrc((prev) => (allowOriginal && prev === original ? prev : medium));
      };
      medImg.src = medium;

      if (allowOriginal) {
        const fullImg = new Image();
        fullImg.onload = () => {
          if (cancelled) return;
          readyRef.current.original = true;
          if (canUpgradeRef.current) setSrc(original);
        };
        fullImg.src = original;
      }

      // Allow upgrades after fade-in completes
      const t = setTimeout(() => {
        if (cancelled) return;
        canUpgradeRef.current = true;
        setCanUpgrade(true);
        if (allowOriginal && readyRef.current.original) {
          setSrc(original);
        } else if (readyRef.current.medium) {
          setSrc(medium);
        } else if (readyRef.current.low) {
          setSrc(low);
        }
      }, activateAfterMs);

      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }, [image, lqip, low, medium, original, activateAfterMs, startAt, maxQuality]);

    // Once upgrades are allowed, continue stepping up quality as images become available
    useEffect(() => {
      if (onlyLow) return;
      if (!canUpgrade) return;
      if (allowOriginal && readyRef.current.original) {
        setSrc(original);
      } else if (readyRef.current.medium && src !== medium) {
        setSrc(medium);
      } else if (readyRef.current.low && src === lqip) {
        setSrc(low);
      }
    }, [canUpgrade, src, lqip, low, medium, original, maxQuality]);

    return (
      <animated.img
        src={src}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...styles, transform: 'scale(1)' }}
        decoding="async"
      />
    );
  };

  // Progressive foreground image for carousel: Low only (skip LQIP and Medium)
  const ProgressiveImage = ({ image, alt, className, style, draggable = false }) => {
    const { low } = buildOptimized(image);
    const [src, setSrc] = useState(low);

    useEffect(() => {
      let cancelled = false;
      setSrc(low);

      const lowImg = new Image();
      lowImg.onload = () => {
        if (cancelled) return;
        setSrc(low);
      };
      lowImg.src = low;

      return () => { cancelled = true; };
    }, [image, low]);

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        draggable={draggable}
        decoding="async"
      />
    );
  };

  // Prime HLS playlist in the HTTP cache to speed up first playback
  const prefetchHls = async (slug) => {
    try {
      if (!slug) return;
      await fetch(`/videos/${slug}/master.m3u8`, { cache: 'force-cache' });
    } catch (_) {
      // Non-blocking
    }
  };

  // Derived responsive metrics
  const heartSizePx = clampNumber(320, Math.min(viewportWidth, viewportHeight) * 1, 1600);
  const fanWidth = clampNumber(180, viewportWidth * 0.18, 380);
  const fanHeight = clampNumber(90, viewportWidth * 0.09, 190);
  const fanPath = `M 0 ${fanHeight} A ${fanHeight} ${fanHeight}, 0, 0, 1, ${fanWidth} ${fanHeight} L ${fanWidth / 2} ${fanHeight} Z`;

  // Typography scaling anchored to FHD look (heart size ~1080px at 1920x1080)
  const BASE_HEART = 1080; // heart size at FHD with current sizing model
  const baseCityFontPx = 104; // desired FHD heading size
  const baseExploreFontPx = 32; // desired FHD subheading size
  const heartScale = heartSizePx / BASE_HEART;
  const cityFontPx = clampNumber(24, Math.round(baseCityFontPx * heartScale), 180);
  const exploreFontPx = clampNumber(12, Math.round(baseExploreFontPx * heartScale), 72);
  // City-specific heading scale adjustments to avoid overflow within heart
  const getCityFontScale = (name) => {
    if (!name || typeof name !== 'string') return 1;
    const key = name.trim().toLowerCase();
    if (key === 'morocco') return 0.9; // 7% smaller
    if (key === "l'dweep" || key === 'lakshadweep') return 0.6; // reduce to fit
    return 1;
  };

  // Display helper to expand short labels in UI without changing keys/routes
  const getDisplayCityName = (name) => {
    if (!name) return '';
    return name === "L'Dweep" ? 'Lakshadweep' : name;
  };

  // Logo sizing responsive to both width and height
  const logoWidthPx = clampNumber(64, Math.min(viewportWidth * 0.11, viewportHeight * 0.14), 220);
  const logoTopPx = clampNumber(8, viewportHeight * 0.02, 32);
  const logoRightPx = clampNumber(8, viewportWidth * 0.02, 40);

  // Always use low-quality variant for heart video (fallback to original if missing)
  const getPrioritizedVideoSources = (city) => {
    const { low, original } = buildOptimizedVideo(city.video);
    return [low || original].filter(Boolean);
  };
  // Text/panel are controlled via a one-shot transition keyed by displayed city
  // Responsive carousel sizing
  const itemWidth = clampNumber(120, viewportWidth / 4, 520);
  const itemHeight = Math.round(clampNumber(90, viewportHeight * 0.16, 240));
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  
  // Build an extended list with clones for infinite scroll illusion
  const extendedCities = [cities[cities.length - 1], ...cities, cities[0]];

  // Initialize position to center on the selected city
  useEffect(() => {
    setVirtualIndex(initialCityIndex + 1); // start on the selected city (accounting for cloned edge)
  }, [initialCityIndex]);

  // Clear navigation state after using it to prevent persistence across navigations
  useEffect(() => {
    if (location.state?.selectedCity) {
      // Replace the current state entry to remove the selectedCity from history
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.state, location.pathname]);

  // (Video src is controlled by transition rendering; no imperative src swap)

  // Handle video play/pause for the currently active video
  useEffect(() => {
    if (videoRef.current) {
      if (playVideo) {
        videoRef.current.play().catch(error => {
          console.log('Auto-play failed:', error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [playVideo, selectedIndex]);

  const handlePrev = () => {
    if (isTransitioning) return;
    // Compute the upcoming selection and kick off the heart/text animation now
    const nextIndex = selectedIndex === 0 ? cities.length - 1 : selectedIndex - 1;
    startAnimationSequence(nextIndex);
    // Begin slide: lock input and move left by one item
    setIsTransitioning(true);
    setVirtualIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    // Compute the upcoming selection and kick off the heart/text animation now
    const nextIndex = selectedIndex === cities.length - 1 ? 0 : selectedIndex + 1;
    startAnimationSequence(nextIndex);
    // Begin slide: lock input and move right by one item
    setIsTransitioning(true);
    setVirtualIndex(prev => prev + 1);
  };

  const onPointerDown = (e) => {
    if (isTransitioning || isGlobalLoading) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // only primary button
    setIsDragging(true);
    const x = typeof e.clientX === 'number' ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    dragRef.current.startX = x;
    dragRef.current.lastX = x;
    dragRef.current.startTime = now;
    dragRef.current.lastTime = now;
    dragRef.current.pointerId = e.pointerId != null ? e.pointerId : null;
    setDragOffset(0);
    if (carouselRef.current && dragRef.current.pointerId != null && carouselRef.current.setPointerCapture) {
      try { carouselRef.current.setPointerCapture(dragRef.current.pointerId); } catch (_) {}
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging || isGlobalLoading) return;
    const x = typeof e.clientX === 'number' ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : dragRef.current.lastX);
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const dx = x - dragRef.current.startX;
    dragRef.current.lastX = x;
    dragRef.current.lastTime = now;
    setDragOffset(dx);
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const totalDx = dragRef.current.lastX - dragRef.current.startX;
    const totalTime = Math.max(now - dragRef.current.startTime, 1);
    const velocity = totalDx / totalTime; // px per ms
    const absDx = Math.abs(totalDx);
    const distanceThreshold = itemWidth * 0.2;
    const velocityThreshold = 0.5; // ~500 px/s

    let slides = 0;
    if (absDx > distanceThreshold || Math.abs(velocity) > velocityThreshold) {
      slides = Math.max(1, Math.min(cities.length, Math.round(absDx / itemWidth) || 1));
    }

    if (slides === 0) {
      // If there was an actual drag, animate snap-back; else just reset
      if (Math.abs(totalDx) > 2) {
        setIsTransitioning(true);
        setDragOffset(0);
      } else {
        setDragOffset(0);
      }
      return;
    }

    // Drag left (negative dx) moves to next slide (increase index)
    const direction = totalDx < 0 ? 1 : -1;
    const moveBy = direction * slides;
    const nextIndex = (selectedIndex + moveBy + cities.length) % cities.length;

    startAnimationSequence(nextIndex);
    setIsTransitioning(true);
    setDragOffset(0);
    setVirtualIndex(prev => prev + moveBy);
  };

  const onPointerUp = (e) => {
    endDrag();
    if (carouselRef.current && dragRef.current.pointerId != null && carouselRef.current.releasePointerCapture) {
      try { carouselRef.current.releasePointerCapture(dragRef.current.pointerId); } catch (_) {}
    }
  };

  const onPointerCancel = () => {
    endDrag();
  };

  const onPointerLeave = (e) => {
    if (isDragging) onPointerUp(e);
  };

  const startAnimationSequence = (nextDisplayIndex) => {
    setShowHeart(false);
    setShowText(false);
    setPlayVideo(false);
    setAnimationKey(prev => prev + 1); // Increment animation key to trigger new animations

    // Immediately update video source for the new selection but don't play
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Step 1: Carousel animation (already handled by transition state)
    
    // Step 2: After 0.5s, fade in heart
    setTimeout(() => {
      setShowHeart(true);
    }, 500);

    // Step 3: After heart fades in (0.8s total), show text and panel
    setTimeout(() => {
      // after slide-out completes, update displayed city and slide new one in
      setDisplayedCityIndex(nextDisplayIndex);
      setShowText(true);
    }, 800);

    // Step 4: Start video earlier (1.8s into sequence; 500ms earlier)
    setTimeout(() => {
      setPlayVideo(true);
      // Don't increment textAnimationTrigger here - we want text to stay in place
    }, 800);
  };



  // Note: We no longer prefetch fallback MP4s; HLS is the primary path.

  const handleCityClick = async () => {
    if (isGlobalLoading) return;
    const selectedCity = cities[selectedIndex];
    const cityKey = selectedCity.name.toLowerCase().replace(/'/g, '');
    setIsGlobalLoading(true);
    setLoadingText('Preparing experience...');
    try {
      const cityData = await ApiService.getCityData(cityKey);
      setLoadingText('Loading assets...');
      await Promise.all([
        prefetchHls(cityKey),
      ]);
    } catch (e) {
      console.warn('Prefetch failed, continuing to navigate:', e);
    } finally {
      navigate(`/video/${cityKey}`);
      setIsGlobalLoading(false);
    }
  };

  // Calculate translateX based on current position
  const centerOffset = (viewportWidth / 2) - (itemWidth / 2);
  const translateX = centerOffset - (virtualIndex * itemWidth);

  const selectedCity = cities[selectedIndex];
  const displayedCity = cities[displayedCityIndex];

  // Smooth cross-fade transition for blurred background image
  const bgTransitions = useTransition(selectedCity.blurredImage, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 700 },
  });

  const fanAnimation = useSpring({
    transform: 'scale(1)',
    from: { transform: 'scale(0.9)' },
    reset: true,
    key: selectedIndex,
  });

  // Heart visibility (no fade animation, updates instantly)
  const heartAnimation = useSpring({
    opacity: showHeart ? 1 : 1,
    config: { duration: 300 },
  });

  // One-shot transition for text (from right) and panel (from left)
  const slideTextX = clampNumber(80, viewportWidth * 0.18, 600);
  const slidePanelX = -clampNumber(100, viewportWidth * 0.25, 800);
  const textPanelTransitions = useTransition(displayedCityIndex, {
    from: { textX: slideTextX, panelX: slidePanelX, opacity: 1 },
    enter: { textX: 0, panelX: 0, opacity: 1 },
    // We unmount old content instantly via showText gate
    config: { duration: 1200, easing: easings.easeInOutCubic },
  });

  // Cross-fade transition for heart-masked videos when city changes
  const videoTransitions = useTransition(selectedIndex, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 700, easing: easings.easeInOutCubic },
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background Image with Blur */}
      {bgTransitions((styles, item) => (
        <ProgressiveBg
          key={item}
          image={item}
          styles={styles}
          activateAfterMs={700}
          startAt="low"
          maxQuality="low"
        />
      ))}
      
      {/* Overlay */}
      <img
        src={buildOptimized('/Overlay.png').low}
        srcSet={`${buildOptimized('/Overlay.png').low} 800w, ${buildOptimized('/Overlay.png').medium} 1600w`}
        sizes="100vw"
        alt="Overlay"
        className="absolute inset-0 w-full h-full object-cover"
        decoding="async"
      />

      <div className="absolute z-20" style={{ top: `${logoTopPx}px`, right: `${logoRightPx}px` }}>
        <img src='/Dulux.png' alt="Colours of the World" style={{ width: `${logoWidthPx}px` }}/>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        {/* Main content container */}
        <div className="absolute flex flex-col items-center justify-center w-full h-full">
          {/* Carousel - Vertically centered */}
          <div className="absolute w-full z-10 flex flex-col items-center"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Heart-shaped video center indicator WITH city text inside */}
            <animated.div
              className="absolute z-20"
              style={{
                ...heartAnimation,
                width: `${heartSizePx}px`,
                height: `${heartSizePx}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              {/* Base heart layer */}
              <div className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <img 
                  src="/SelectionHeart.svg" 
                  alt="Heart" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Masked video layer */}
              <div
                className="relative w-full h-full"
                style={{
                  WebkitMask: 'url(/SelectionHeartMask.svg) no-repeat center',
                  mask: 'url(/SelectionHeartMask.svg) no-repeat center',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  pointerEvents: 'none',
                }}
              >
                {/* Video background crossfading between cities */}
                {videoTransitions((styles, item) => {
                  const cityForVideo = cities[item];
                  const sources = getPrioritizedVideoSources(cityForVideo);
                  return (
                    <animated.video
                      key={item}
                      ref={selectedIndex === item ? videoRef : null}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ opacity: styles.opacity }}
                      autoPlay
                      muted
                      playsInline
                      preload={selectedIndex === item ? 'auto' : 'metadata'}
                      poster={mediumOnly(cityForVideo.image)}
                    >
                      {sources.map((src, idx) => (
                        <source key={idx} src={src} type="video/mp4" />
                      ))}
                      Your browser does not support the video tag.
                    </animated.video>
                  );
                })}

                {showText && textPanelTransitions((styles, item) => (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Panels group (slides in from left) */}
                    <animated.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: styles.panelX.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                        opacity: styles.opacity.to((val) => val * 0.8),
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '4px',
                        padding: `${clampNumber(12, viewportHeight * 0.015, 22)}px ${clampNumber(18, viewportWidth * 0.04, 80)}px`,
                        width: `${clampNumber(260, viewportWidth * 0.6, 980)}px`,
                        height: `${clampNumber(80, viewportHeight * 0.14, 200)}px`,
                        zIndex: -1,
                        pointerEvents: 'none',
                      }}
                      className="backdrop-blur-sm"
                    />
                    <animated.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: styles.panelX.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                        opacity: styles.opacity.to((val) => val * 0.4),
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        borderRadius: '4px',
                        padding: `${clampNumber(12, viewportHeight * 0.015, 22)}px ${clampNumber(18, viewportWidth * 0.04, 80)}px`,
                        width: `${clampNumber(260, viewportWidth * 0.6, 980)}px`,
                        height: `${clampNumber(90, viewportHeight * 0.16, 220)}px`,
                        zIndex: -2,
                        pointerEvents: 'none',
                      }}
                      className="backdrop-blur-sm"
                    />

                    {/* Text group (slides in from right) */}
                    <animated.div
                      onClick={handleCityClick}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: styles.textX.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                        opacity: styles.opacity,
                        pointerEvents: 'auto',
                      }}
                      className="cursor-pointer text-white flex flex-col items-center justify-center"
                    >
                      <h1 className=" tracking-wider select-none flex flex-column items-center text-gray-800" style={{ fontSize: `${Math.round(cityFontPx * getCityFontScale(cities[item].name))}px`, lineHeight: 1, textShadow: '1px 0 0 white, -1px 0 0 white, 0 1px 0 white, 0 -1px 0 white' }}>
                        {getDisplayCityName(cities[item].name).toUpperCase()}
                      </h1>
                     <p className="font-light tracking-[0.3em] select-none text-gray-800 font-brand" style={{ fontSize: `${exploreFontPx}px`, textShadow: '1px 0 0 white, -1px 0 0 white, 0 1px 0 white, 0 -1px 0 white' }}>EXPLORE</p>
                    </animated.div>
                  </div>
                ))}

                        {/* Heart outline overlay for better definition */}
                <div
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    background: 'url(/SelectionHeart.svg) no-repeat center',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    mixBlendMode: 'multiply',
                    opacity: 0.1,
                  }}
                ></div>
              </div>
            </animated.div>

            {/* Carousel container */}
            <div
              className="relative w-full flex items-center overflow-hidden"
              // This style creates a border that is white and thickest at the center, fading out towards the edges.
              style={{
                /* Create a white border that is thickest at the centre and fades towards the edges */
                // The following creates a border that is thickest and most opaque at the center, fading out to transparent at the edges:
                // 1. 'border: 4px solid transparent' sets up a 4px border but makes it transparent so the borderImage can show through.
                // 2. 'borderImage' uses a horizontal linear gradient: fully transparent white at 0% (left edge), fully opaque white at 50% (center), and transparent again at 100% (right edge).
                //    The '1' at the end is the border image slice value, which means the gradient is stretched to fill the border area.
                border: '4px solid transparent',
                borderImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 70%, rgba(255,255,255,0) 100%) 1',
                height: `${itemHeight}px`,
              }}
            >
              {/* Navigation buttons */}
              <button 
                onClick={handlePrev} 
                disabled={isTransitioning || isGlobalLoading}
                className="absolute text-white hover:text-white/80 transition z-30 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
                style={{ left: `${clampNumber(8, viewportWidth * 0.02, 48)}px`, top: '50%', transform: 'translateY(-50%)', width: `${clampNumber(28, viewportWidth * 0.03, 60)}px`, height: `${clampNumber(28, viewportWidth * 0.03, 60)}px`, fontSize: `${clampNumber(18, viewportWidth * 0.022, 26)}px` }}
              >
                ←
              </button>
              
              <button 
                onClick={handleNext} 
                disabled={isTransitioning || isGlobalLoading}
                className="absolute text-white hover:text-white/80 transition z-30 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
                style={{ right: `${clampNumber(8, viewportWidth * 0.02, 48)}px`, top: '50%', transform: 'translateY(-50%)', width: `${clampNumber(28, viewportWidth * 0.03, 60)}px`, height: `${clampNumber(28, viewportWidth * 0.03, 60)}px`, fontSize: `${clampNumber(18, viewportWidth * 0.022, 26)}px` }}
              >
                →
              </button>
              
              {/* Carousel items */}
              <div 
                ref={carouselRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onPointerLeave={onPointerLeave}
                onTransitionEnd={() => {
                  // Sync selectedIndex to the slide that stopped under the heart
                  const realIndex = (virtualIndex - 1 + cities.length) % cities.length;
                  setSelectedIndex(realIndex);
                  setDisplayedCityIndex(realIndex);

                  // When we hit cloned slides, jump instantly to the corresponding real slide
                  if (virtualIndex === extendedCities.length - 1) {
                    setInstantJump(true);
                    setVirtualIndex(1);
                    requestAnimationFrame(() => setInstantJump(false));
                  } else if (virtualIndex === 0) {
                    setInstantJump(true);
                    setVirtualIndex(extendedCities.length - 2);
                    requestAnimationFrame(() => setInstantJump(false));
                  }

                  // Sliding finished (let heart/text sequence control final state)
                  setTimeout(() => setIsTransitioning(false), 0);
                }}
                className={`flex h-full ${!instantJump && isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''} ${isGlobalLoading ? 'cursor-wait' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
                style={{
                  transform: `translate3d(${translateX + dragOffset}px, 0, 0)`,
                  willChange: 'transform',
                  width: `${extendedCities.length * itemWidth}px`,
                  touchAction: isGlobalLoading ? 'none' : 'pan-y',
                }}
              >
                {extendedCities.map((city, index) => {
                  // Calculate which city this represents in our original array
                  const cityIndex = (index - 1 + cities.length) % cities.length; // map extended indices to base
                  
                  // Check if this is the currently selected item (in center)
                  const isSelected = index === virtualIndex;
                  
                  return (
                    <div
                      key={`${city.name}-${index}`}
                      className="flex-none"
                      style={{ 
                        width: `${itemWidth}px`,
                        height: '100%',
                        border: '1px solid transparent',
                        borderImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 70%, rgba(255,255,255,0) 100%) 1',
                        // Removed padding to eliminate gaps between images
                      }}
                    >
                      <ProgressiveImage
                        image={city.image}
                        alt={city.name}
                        className={`w-full h-full px-[1px] object-cover transition-opacity duration-300 select-none ${
                          isSelected
                            ? 'opacity-100 shadow-lg scale-100' 
                            : 'opacity-80 scale-100'
                        }`}
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          minWidth: '100%',
                          minHeight: '100%',
                          filter: 'grayscale(0.50)',
                        }}
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fan animation - moved below */}
          <animated.div 
            style={{
              ...fanAnimation,
              position: 'absolute',
              top: '75%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5
            }}
            className=""
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${mediumOnly(selectedCity.image)})`,
                width: `${fanWidth}px`,
                height: `${fanHeight}px`,
                clipPath: `path("${fanPath}")`
              }}
            ></div>
          </animated.div>
        </div>

        {/* (Old city text overlay removed ‑ now integrated inside heart) */}

        {/* Instruction text with glass panel background */}
        <div className="absolute left-1/2 transform -translate-x-1/2 z-10" style={{ bottom: `${clampNumber(10, viewportHeight * 0.05, 48)}px` }}>
          <div 
            className="bg-white backdrop-blur-md rounded-lg border-2 border-white shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              padding: `${clampNumber(6, viewportHeight * 0.012, 12)}px ${clampNumber(16, viewportWidth * 0.02, 32)}px`,
            }}
          >
            <p className="text-black font-bold tracking-widest text-center font-brand"
               style={{ fontSize: `${clampNumber(12, viewportWidth * 0.014, 20)}px`, whiteSpace: 'nowrap' }}>
              Choose your favourite destination
            </p>
          </div>
        </div>
      </div>

      {isGlobalLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-5 py-3 rounded-lg bg-black/40 text-white text-sm backdrop-blur-sm">
            {loadingText}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySelector;