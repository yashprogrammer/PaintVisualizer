import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import { useNavigate } from 'react-router-dom';

const cities = [
  { name: 'Bali', image: '/City/Bali H Small.png', blurredImage: '/City/Blurred/Bali H Small.jpg' },
  { name: 'Egypt', image: '/City/Egypt H Small.png', blurredImage: '/City/Blurred/Egypt H Small.jpg' },
  { name: 'France', image: '/City/France H Small.png', blurredImage: '/City/Blurred/France H Small.jpg' },
  { name: 'Greece', image: '/City/Greece H Small.png', blurredImage: '/City/Blurred/Greece H Small.jpg' },
  { name: 'Japan', image: '/City/Japan H Small.png', blurredImage: '/City/Blurred/Japan H Small.jpg' },
  { name: 'Kenya', image: '/City/Kenya H Small.png', blurredImage: '/City/Blurred/Kenya H Small.jpg' },
  { name: 'L\'Dweep', image: '/City/L\'Dweep H Small.png', blurredImage: '/City/Blurred/L\'Dweep H Small.jpg' },
  { name: 'Morocco', image: '/City/Morocco H Small.png', blurredImage: '/City/Blurred/Morocco H Small.jpg' },
  { name: 'Spain', image: '/City/Spain H Small.png', blurredImage: '/City/Blurred/Spain H Small.jpg' },
  { name: 'Vietnam', image: '/City/Vietnam H Small.png', blurredImage: '/City/Blurred/Vietnam H Small.jpg' },
];

const CitySelector = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const itemWidth = 288; // 256px width + 32px margin (doubled from 144)
  const itemHeight = 160; // 160px height (doubled from 80px)
  const carouselRef = useRef(null);
  
  // Create a smaller multiplier so repeats are visible
  const multiplier = 5; // Reduced so you can see repetitions
  const infiniteCities = Array(multiplier).fill(cities).flat();
  const startIndex = Math.floor(multiplier / 2) * cities.length;

  // Initialize position to center
  useEffect(() => {
    setCurrentPosition(startIndex);
  }, [startIndex]);

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setCurrentPosition(prev => {
      const newPos = prev - 1;
      // If we go below 0, wrap to the end
      return newPos < 0 ? infiniteCities.length - 1 : newPos;
    });
    
    setSelectedIndex((prev) => (prev === 0 ? cities.length - 1 : prev - 1));
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setCurrentPosition(prev => {
      const newPos = prev + 1;
      // If we go beyond the array, wrap to the beginning
      return newPos >= infiniteCities.length ? 0 : newPos;
    });
    
    setSelectedIndex((prev) => (prev === cities.length - 1 ? 0 : prev + 1));
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
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

  const fanAnimation = useSpring({
    transform: 'scale(1)',
    from: { transform: 'scale(0.9)' },
    reset: true,
    key: selectedIndex,
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background Image with Blur */}
      <img 
        src={selectedCity.blurredImage} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: 'scale(1.1)',
        }}
      />
      
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
            {/* Carousel container with center indicator */}
            <div className="relative w-full flex justify-center items-center overflow-hidden">
              {/* Center indicator */}
              <div 
                className="absolute z-20 pointer-events-none"
                style={{
                  width: '272px', // doubled from 136px
                  height: '168px', // doubled from 84px
                  border: '3px solid white',
                  borderRadius: '12px',
                  boxShadow: '0 0 15px rgba(255,255,255,0.6)',
                }}
              ></div>
              
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
                      className="flex-shrink-0 mx-4"
                      style={{ 
                        width: '256px', // doubled from 128px
                        height: '160px' // doubled from 80px
                      }}
                    >
                      <img 
                        src={city.image} 
                        alt={city.name}
                        className={`w-64 h-40 object-cover rounded-lg transition-all duration-300 select-none ${
                          isSelected
                            ? 'opacity-100 shadow-lg scale-105' 
                            : 'opacity-60 scale-95'
                        }`}
                        draggable={false}
                      />
                      {/* Debug label to show repetitions */}
                      <div className="text-xs text-center mt-1 text-white/70">
                        {city.name}
                      </div>
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

        {/* City Text - Centered with higher z-index */}
        <div 
          className="fixed z-30 cursor-pointer hover:scale-105 transition-transform duration-300"
          style={{ 
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            width: '300px',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
          onClick={handleCityClick}
        >
          {/* Circle background */}
          <div 
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 30px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(5px)',
              zIndex: -1,
            }}
          ></div>
          
          {/* City name and explore text */}
          <h1 className="text-5xl font-bold tracking-wider mb-2">{selectedCity.name.toUpperCase()}</h1>
          <p className="text-xl font-light tracking-[0.3em]">EXPLORE</p>
        </div>

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