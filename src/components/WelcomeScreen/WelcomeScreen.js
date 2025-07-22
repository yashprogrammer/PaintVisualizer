
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const cityImages = [
  '/City/Bali H Small.png',
  '/City/Egypt H Small.png',
  '/City/France H Small.png',
  '/City/Greece H Small.png',
  '/City/Japan H Small.png',
  '/City/Kenya H Small.png',
  '/City/L\'Dweep H Small.png',
  '/City/Morocco H Small.png',
  '/City/Spain H Small.png',
  '/City/Vietnam H Small.png',
];

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [popupHearts, setPopupHearts] = useState([]);
  const duration = 3000; // 3 seconds
  const loop = false;
  const MIN_DISTANCE = 200; // 3rem = 48px (assuming 1rem = 16px)

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

  // Generate random position within viewport with collision detection
  const getRandomPosition = (existingHearts) => {
    let attempts = 0;
    let position;
    
    do {
      position = {
        x: Math.random() * (window.innerWidth - 100), // Subtract heart width
        y: Math.random() * (window.innerHeight - 100), // Subtract heart height
      };
      attempts++;
    } while (!isPositionValid(position, existingHearts) && attempts < 50);
    
    // If we can't find a valid position after 50 attempts, use the last generated position
    return position;
  };

  // Create a new heart
  const createHeart = (existingHearts) => {
    const newHeart = {
      id: Date.now() + Math.random(),
      ...getRandomPosition(existingHearts),
      scale: 0,
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

  // Popup hearts animation effect
  useEffect(() => {
    // Create hearts at regular intervals
    const interval = setInterval(() => {
      setPopupHearts(prev => {
        if (prev.length >= 30) return prev; // Limit to 15 hearts max
        const newHeart = createHeart(prev);
        return [...prev, newHeart];
      });
    }, 400); // New heart every 1.2 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Animate hearts after they're created and handle fade out
  useEffect(() => {
    popupHearts.forEach(heart => {
      if (heart.scale === 0 && !heart.fadeOut) {
        // Animate the heart popup
        setTimeout(() => {
          setPopupHearts(prev => 
            prev.map(h => 
              h.id === heart.id 
                ? { ...h, scale: 1, opacity: 1 }
                : h
            )
          );
        }, 100);

        // Start fade out after 4 seconds
        setTimeout(() => {
          setPopupHearts(prev => 
            prev.map(h => 
              h.id === heart.id 
                ? { ...h, fadeOut: true }
                : h
            )
          );
        }, 6000);

        // Remove heart after fade out completes
        setTimeout(() => {
          setPopupHearts(prev => prev.filter(h => h.id !== heart.id));
        }, 7000);
      }
    });
  }, [popupHearts]);

  // Drift popup hearts horizontally to the left (matches carousel drift speed)
  useEffect(() => {
    // Pixels per second so that an element would cross the full viewport in ~60 s
    const speedPxPerSec = window.innerWidth / 60;

    let animationFrameId;
    let lastTimestamp;

    const step = (timestamp) => {
      if (lastTimestamp === undefined) {
        lastTimestamp = timestamp;
      }
      const delta = timestamp - lastTimestamp; // in ms
      lastTimestamp = timestamp;

      // How many pixels to move in this frame
      const dx = (speedPxPerSec * delta) / 2000;

      setPopupHearts((prev) =>
        prev.map((heart) => ({
          ...heart,
          x: heart.x - dx,
        }))
      );

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Start main animation on mount
  useEffect(() => {
    setTimeout(startAnimation, 2000); // Start animation after 2 seconds
  }, []);

  const clipPathValue = `inset(${100 - (progress * 100)}% 0 0 0)`;

  return (
    <div className="h-screen w-screen overflow-hidden flex relative">
      {/* Background Layer - Carousel Container (z-index: 1) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-[1]">
        <div className="flex animate-carousel-drift">
          {[...cityImages, ...cityImages].map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`City ${index}`}
              className="h-full object-cover"
              style={{ width: 'auto', height: '100vh' }}
            />
          ))}
        </div>
      </div>

      {/* Content Layer - Centered Content (z-index: 10) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-[20]">
        {/* Heart Animation Container */}
        <div 
          className="bg-white bg-opacity-70 backdrop-blur-md rounded-2xl text-center cursor-pointer shadow-lg flex flex-col items-center gap-6"
          onClick={handleNavigate}
        >
          {/* Heart Loading Animation */}
          <div className="relative w-[38rem] h-[20rem] flex items-center justify-center">
            {/* White heart as base - inherits z-index from parent */}
            <img 
              src="/COW_white_heart.png" 
              alt="White Heart" 
              className="absolute w-full h-full object-contain"
            />
            
            {/* Red heart with animated clip-path - inherits z-index from parent */}
            <img 
              src="/COW_Red_heart_Explore.png" 
              alt="Red Heart" 
              className="absolute w-full h-full object-contain"
              style={{ 
                clipPath: clipPathValue,
                transition: isAnimating ? 'none' : 'clip-path 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Tagline Container - explicit z-index for clarity */}
        <div className="absolute bottom-10 bg-white bg-opacity-70 backdrop-blur-md rounded-lg px-6 py-3 shadow-md z-[11]">
          <p className="text-black text-lg font-bold tracking-wider">
            {animationCompleted 
              ? "TAP THE HEART TO EXPLORE PALLETTES FROM AROUND THE GLOBE"
              : "TURNING MEMORIES OF PLACES INTO SHADES YOU CAN FEEL."
            }
          </p>
        </div>
      </div>

      {/* Overlay Layer - Popup Hearts Animation (z-index: 20) */}
      <div className="absolute inset-0 pointer-events-none z-[10]">
        {popupHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute transition-all duration-1000 ease-out"
            style={{
              left: heart.x,
              top: heart.y,
              transform: `scale(${heart.fadeOut ? 0.5 : heart.scale})`,
              opacity: heart.fadeOut ? 0 : heart.opacity,
            }}
          >
            <img
              src="/HeartTransparent.svg"
              alt="Heart"
              className="w-12 h-12 sm:w-16 sm:h-16 "
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
