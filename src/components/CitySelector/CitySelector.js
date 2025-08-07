import React, { useState, useRef, useEffect } from 'react';
import { useSpring, useTransition, animated } from 'react-spring';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayedCityIndex, setDisplayedCityIndex] = useState(0); // controls the city name shown in text
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHeart, setShowHeart] = useState(true);
  const [showText, setShowText] = useState(true);
  const [playVideo, setPlayVideo] = useState(true);
  const [animationKey, setAnimationKey] = useState(0); // Add animation key state

  // Retrieve preloaded video from localStorage if available
  const getVideoSource = (city) => {
    if (typeof window === 'undefined') return city.video;
    if (typeof window !== 'undefined' && window.cityVideoUrls && window.cityVideoUrls[city.name]) {
      return window.cityVideoUrls[city.name];
    }
    return city.video;
  };
  const [textAnimationTrigger, setTextAnimationTrigger] = useState(0); // Separate trigger for text animation
  const itemWidth = typeof window !== 'undefined' ? (window.innerWidth / 4) : 375; // 1/4 of viewport width for 4 images
  const itemHeight = 180; // Reduced height to make images more rectangular (16:9 aspect ratio)
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  
  // Create a smaller multiplier so repeats are visible
  const multiplier = 5; // Reduced so you can see repetitions
  const infiniteCities = Array(multiplier).fill(cities).flat();
  const startIndex = Math.floor(multiplier / 2) * cities.length;

  // Initialize position to center
  useEffect(() => {
    setCurrentPosition(startIndex);
  }, [startIndex]);

  // Update video source when selected city changes
  useEffect(() => {
    if (videoRef.current) {
      const selectedCity = cities[selectedIndex];
      videoRef.current.src = getVideoSource(selectedCity);
      videoRef.current.load();
      
      if (playVideo) {
        // Only play if playVideo is true
        videoRef.current.play().catch(error => {
          console.log('Auto-play failed:', error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [selectedIndex]);

  // Handle video play/pause when playVideo state changes
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
  }, [playVideo]);

  const handlePrev = () => {
    if (isTransitioning) return;
    const newIndex = selectedIndex === 0 ? cities.length - 1 : selectedIndex - 1;
    startAnimationSequence(newIndex);
    
    setCurrentPosition(prev => {
      const newPos = prev - 1;
      // If we go below 0, wrap to the end
      return newPos < 0 ? infiniteCities.length - 1 : newPos;
    });
    
    setSelectedIndex(newIndex);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    const newIndex = selectedIndex === cities.length - 1 ? 0 : selectedIndex + 1;
    startAnimationSequence(newIndex);
    
    setCurrentPosition(prev => {
      const newPos = prev + 1;
      // If we go beyond the array, wrap to the beginning
      return newPos >= infiniteCities.length ? 0 : newPos;
    });
    
    setSelectedIndex(newIndex);
  };

  const startAnimationSequence = (nextDisplayIndex) => {
    setIsTransitioning(true);
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
      setTextAnimationTrigger(prev => prev + 1); // Trigger text animation
    }, 800);

    // Step 4: After text animation completes (2.3s total), start video
    setTimeout(() => {
      setPlayVideo(true);
      setIsTransitioning(false);
      // Don't increment textAnimationTrigger here - we want text to stay in place
    }, 2300);
  };

  const handleCityClick = () => {
    const selectedCity = cities[selectedIndex];
    // Navigate to video player with city name as parameter
    navigate(`/video/${selectedCity.name.toLowerCase()}`);
  };

  // Calculate translateX based on current position
  const centerOffset = typeof window !== 'undefined' ? (window.innerWidth / 2) - (itemWidth / 2) : 0;
  const translateX = centerOffset - (currentPosition * itemWidth);

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
    immediate: true, // change instantly without interpolation
  });

  // Animation for city text - slide-in / fade-out pattern
  const textAnimation = useSpring({
    from: showText ? { x: 500, opacity: 1 } : { x: 0, opacity: 1 },
    to: showText ? { x: 0, opacity: 1 } : { x: 0, opacity: 0 },
    reset: showText, // Reset animation when showing (to trigger slide-in)
    key: textAnimationTrigger,
    config: (key) => key === "x" ? { tension: 30, friction: 15 } : { tension: 280, friction: 30 },
    immediate: (key) => showText ? key === "opacity" : key === "x", // When showing: don't animate opacity, When hiding: don't animate x
  });

  // Animation for the white panel - slide-in / fade-out pattern  
  const panelAnimation = useSpring({
    from: showText ? { x: -300, opacity: 1 } : { x: 0, opacity: 1 },
    to: showText ? { x: 0, opacity: 1 } : { x: 0, opacity: 0 },
    reset: showText, // Reset animation when showing (to trigger slide-in)
    key: textAnimationTrigger,
    config: (key) => key === "x" ? { tension: 30, friction: 15 } : { tension: 280, friction: 30 },
    immediate: (key) => showText ? key === "opacity" : key === "x", // When showing: don't animate opacity, When hiding: don't animate x
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
                {/* Video background */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain pointer-events-none"
                  autoPlay
                  muted
                  playsInline
                >
                  <source src={getVideoSource(selectedCity)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                /* Animated City Text */
                        <animated.div
                          onClick={handleCityClick}
                          style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: textAnimation.x.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                          opacity: textAnimation.opacity,
                          pointerEvents: 'auto',
                          }}
                          className="cursor-pointer text-white flex flex-col items-center justify-center"
                        >
                          {/* Animated white panel behind text */}
                          <animated.div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: panelAnimation.x.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                              opacity: panelAnimation.opacity.to((val) => val * 0.8), // Apply base opacity of 0.8 to the animated value
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: '4px',
                              padding: '20px 80px',
                              minWidth: '700px',
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
                              transform: panelAnimation.x.to((val) => `translate(-50%, -50%) translateX(${val}px)`),
                              opacity: panelAnimation.opacity.to((val) => val * 0.4), // Apply base opacity of 0.4 to the animated value
                              backgroundColor: 'rgba(255, 255, 255, 0.4)',
                              borderRadius: '4px',
                              padding: '20px 80px',
                              minWidth: '700px',
                              minHeight: '170px',
                              zIndex: -2,
                              pointerEvents: 'none',
                            }}
                            className="backdrop-blur-sm"
                          />
                          
                          <h1 className=" tracking-wider select-none flex flex-column items-center text-gray-800" style={{ fontSize: '6.2rem', maxHeight:"100px" }}>
                          {displayedCity.name.toUpperCase()}
                          </h1>
                          <p className="font-light tracking-[0.3em] select-none text-gray-800" style={{ fontSize: '2rem' }}>EXPLORE</p>
                        </animated.div>

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
              className="relative w-full flex justify-center items-center overflow-hidden"
              // This style creates a border that is white and thickest at the center, fading out towards the edges.
              style={{
                /* Create a white border that is thickest at the centre and fades towards the edges */
                // The following creates a border that is thickest and most opaque at the center, fading out to transparent at the edges:
                // 1. 'border: 4px solid transparent' sets up a 4px border but makes it transparent so the borderImage can show through.
                // 2. 'borderImage' uses a horizontal linear gradient: fully transparent white at 0% (left edge), fully opaque white at 50% (center), and transparent again at 100% (right edge).
                //    The '1' at the end is the border image slice value, which means the gradient is stretched to fill the border area.
                border: '4px solid transparent',
                borderImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 70%, rgba(255,255,255,0) 100%) 1',
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
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                  transform: `translateX(${translateX}px)`,
                  width: `${infiniteCities.length * itemWidth}px`,
                }}
              >
                {infiniteCities.map((city, index) => {
                  // Calculate which city this represents in our original array
                  const cityIndex = index % cities.length;
                  
                  // Check if this is the currently selected item (in center)
                  const isSelected = index === currentPosition;
                  
                  return (
                    <div
                      key={`${city.name}-${index}`}
                      className="flex-shrink-0s"
                      style={{ 
                        width: `${itemWidth}px`,
                        height: `${itemHeight}px`,
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
          <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg px-8 py-4 border border-white border-opacity-30 shadow-lg">
            <p className="text-white text-sm tracking-widest text-center" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
              CHOOSE A LOCATION TO EXPLORE ITS UNIQUE PAINT TONES.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitySelector;