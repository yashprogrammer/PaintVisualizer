
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

  const handleNavigate = () => {
    navigate('/city-selection');
  };

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
        {/* Logo Container */}
        <div 
          className="bg-white bg-opacity-70 backdrop-blur-md rounded-xl p-6 text-center cursor-pointer shadow-lg max-w-md"
          onClick={handleNavigate}
        >
          <img 
            src="/colorOfTheWorld.jpg" 
            alt="Colours of the World" 
            className="w-full h-auto"
          />
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
