import React, { useState, useRef, useEffect } from 'react';
import { useSpring, useTransition, animated, easings } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';

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
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [displayedCityIndex, setDisplayedCityIndex] = useState(1); // controls the city name shown in text
  // Virtual index over an extended array with cloned edges for seamless loop
  const [virtualIndex, setVirtualIndex] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHeart, setShowHeart] = useState(true);
  const [showText, setShowText] = useState(true);
  const [playVideo, setPlayVideo] = useState(true);
  const [animationKey, setAnimationKey] = useState(0); // Add animation key state
  const [instantJump, setInstantJump] = useState(false); // disable CSS transition for index corrections

  // Retrieve preloaded video from localStorage if available
  const getVideoSource = (city) => {
    if (typeof window === 'undefined') return city.video;
    if (typeof window !== 'undefined' && window.cityVideoUrls && window.cityVideoUrls[city.name]) {
      return window.cityVideoUrls[city.name];
    }
    return city.video;
  };
  // Text/panel are controlled via a one-shot transition keyed by displayed city
  const itemWidth = typeof window !== 'undefined' ? (window.innerWidth / 4) : 375; // 1/4 of viewport width for 4 images
  const itemHeight = 180; // Reduced height to make images more rectangular (16:9 aspect ratio)
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  
  // Build an extended list with clones for infinite scroll illusion
  const extendedCities = [cities[cities.length - 1], ...cities, cities[0]];

  // Initialize position to center
  useEffect(() => {
    setVirtualIndex(2); // start on Egypt (second real slide)
  }, []);

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

  const handleCityClick = () => {
    const selectedCity = cities[selectedIndex];
    // Navigate to video player with city name as parameter
    navigate(`/video/${selectedCity.name.toLowerCase()}`);
  };

  // Calculate translateX based on current position
  const centerOffset = typeof window !== 'undefined' ? (window.innerWidth / 2) - (itemWidth / 2) : 0;
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
  const textPanelTransitions = useTransition(displayedCityIndex, {
    from: { textX: 450, panelX: -600, opacity: 1 },
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
        <animated.img
          key={item}
          src={item}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ ...styles, transform: 'scale(1)' }}
        />
      ))}
      
      {/* Overlay */}
      <img src="/Overlay.png" alt="Overlay" className="absolute inset-0 w-full h-full object-cover" />

      <div className="absolute top-8 right-8 z-20">
        <img src='/Dulux.png' alt="Colours of the World" className="w-28"/>
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
                width: '70vw',
                height: '70vw',
                maxWidth: '1400px',
                maxHeight: '1400px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Base heart layer */}
              <div className="absolute inset-0 w-full h-full">
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
                }}
              >
                {/* Video background crossfading between cities */}
                {videoTransitions((styles, item) => {
                  const cityForVideo = cities[item];
                  return (
                    <animated.video
                      key={item}
                      ref={selectedIndex === item ? videoRef : null}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ opacity: styles.opacity }}
                      autoPlay
                      muted
                      playsInline
                      preload="auto"
                    >
                      <source src={getVideoSource(cityForVideo)} type="video/mp4" />
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
                        padding: '20px 80px',
                        minWidth: '800px',
                        minHeight: '150px',
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
                        padding: '20px 80px',
                        minWidth: '800px',
                        minHeight: '170px',
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
                      <h1 className=" tracking-wider select-none flex flex-column items-center text-gray-800" style={{ fontSize: '6.2rem', maxHeight:'100px', textShadow: '1px 0 0 white, -1px 0 0 white, 0 1px 0 white, 0 -1px 0 white' }}>
                        {cities[item].name.toUpperCase()}
                      </h1>
                     <p className="font-light tracking-[0.3em] select-none text-gray-800 font-brand" style={{ fontSize: '2rem', textShadow: '1px 0 0 white, -1px 0 0 white, 0 1px 0 white, 0 -1px 0 white' }}>EXPLORE</p>
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

            {/* Clickable overlay covering the heart area */}
            <button
              type="button"
              aria-label="Explore selected location"
              onClick={handleCityClick}
              className="absolute"
              style={{
                width: '70vw',
                height: '70vw',
                maxWidth: '1400px',
                maxHeight: '1400px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                WebkitMask: 'url(/SelectionHeartMask.svg) no-repeat center',
                mask: 'url(/SelectionHeartMask.svg) no-repeat center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                backgroundColor: 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                zIndex: 50,
                border: 'none',
                padding: 0,
              }}
            />
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
                disabled={isTransitioning}
                className="absolute left-8 text-white hover:text-white/80 transition text-4xl z-30 bg-black/30 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
                style={{ fontSize: '24px' }}
              >
                ←
              </button>
              
              <button 
                onClick={handleNext} 
                disabled={isTransitioning}
                className="absolute right-8 text-white hover:text-white/80 transition text-4xl z-30 bg-black/30 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
                style={{ fontSize: '24px' }}
              >
                →
              </button>
              
              {/* Carousel items */}
              <div 
                ref={carouselRef}
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
                className={`flex h-full ${!instantJump && isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                  transform: `translateX(${translateX}px)`,
                  width: `${extendedCities.length * itemWidth}px`,
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
                      <img 
                        src={city.image} 
                        alt={city.name}
                        className={`w-full h-full px-[1px] object-cover transition-all duration-300 select-none ${
                          isSelected
                            ? 'opacity-100 shadow-lg scale-100' 
                            : 'opacity-80 scale-100'
                        }`}
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          minWidth: '100%',
                          minHeight: '100%',
                          filter: 'grayscale(0.50)', // Add a little bit of grayscale
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
            className="w-72 h-36"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${selectedCity.image})`,
                clipPath: 'path("M 0 150 A 150 150, 0, 0, 1, 300 150 L 150 150 Z")'
              }}
            ></div>
          </animated.div>
        </div>

        {/* (Old city text overlay removed ‑ now integrated inside heart) */}

        {/* Instruction text with glass panel background */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
          <div 
            className="bg-white backdrop-blur-md rounded-lg px-8 py-2 border-2 border-white shadow-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}
          >
           <p className="text-black text-xl font-bold tracking-widest text-center font-brand whitespace-nowrap">
              CHOOSE A LOCATION TO EXPLORE ITS UNIQUE PAINT TONES.
            </p>
          </div> 
        </div>
      </div>
    </div>
  );
};

export default CitySelector;