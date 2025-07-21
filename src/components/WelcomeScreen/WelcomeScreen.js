
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
  const duration = 3000; // 3 seconds
  const loop = true;

  const handleNavigate = () => {
    navigate('/city-selection');
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setProgress(0);
  };

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
          
          if (loop) {
            setTimeout(startAnimation, 1000); // Restart after 1 second
          }
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isAnimating, duration, loop]);

  // Start animation on mount
  useEffect(() => {
    setTimeout(startAnimation, 1000); // Start animation after 1 second
  }, []);

  const clipPathValue = `inset(${100 - (progress * 100)}% 0 0 0)`;

  return (
    <div className="h-screen w-screen overflow-hidden flex relative">
      {/* Carousel Container */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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

      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Heart Animation Container */}
        <div 
          className="bg-white bg-opacity-70 backdrop-blur-md rounded-xl p-8 text-center cursor-pointer shadow-lg max-w-md flex flex-col items-center gap-6"
          onClick={handleNavigate}
        >
          {/* Heart Loading Animation */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* White heart as base */}
            <img 
              src="/COW_white_heart.png" 
              alt="White Heart" 
              className="absolute w-full h-full object-contain z-10"
            />
            
            {/* Red heart with animated clip-path */}
            <img 
              src="/COW_Red_heart.png" 
              alt="Red Heart" 
              className="absolute w-full h-full object-contain z-20"
              style={{ 
                clipPath: clipPathValue,
                transition: isAnimating ? 'none' : 'clip-path 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Tagline Container */}
        <div className="absolute bottom-10 bg-white bg-opacity-70 backdrop-blur-md rounded-lg px-6 py-3 shadow-md">
          <p className="text-black text-sm font-medium tracking-wider">
            TURNING MEMORIES OF PLACES INTO SHADES YOU CAN FEEL.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
