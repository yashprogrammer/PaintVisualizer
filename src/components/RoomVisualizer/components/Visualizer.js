import React from 'react';
import { roomData } from '../../../data/roomData';

const Visualizer = ({
  currentRoom,
  currentPalette,
  currentPaintColor,
  selectedSurface,
  surfaceColors,
  colorPalettes,
  containerRef,
  handleCanvasClick,
  selectPaint,
  isMasksLoaded,
  maskImagesRef
}) => {
  return (
    <div className="column-2 column-padding flex flex-col items-center justify-between overflow-hidden px-4 lg:px-[25px]  w-1/2 flex-shrink-0">
      <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-center w-full">
        <p className="block leading-normal">Visualizer</p>
      </div>
      <div className="container-height flex flex-col gap-4 lg:gap-[21px] flex-1 items-center justify-end relative rounded-2xl lg:rounded-3xl w-full border-[3px] lg:border-[5px] border-solid border-[#d2d2d2]">
        
        {/* Room Visualization Area */}
        <div className="flex-1 flex flex-col gap-2.5 items-center justify-center overflow-hidden pb-0 pt-4 lg:pt-8 px-4 lg:px-[18px] w-full min-h-0">
          <div 
            ref={containerRef}
            className="flex-1 w-full rounded-2xl lg:rounded-3xl relative cursor-pointer min-h-[200px] overflow-hidden"
            onClick={handleCanvasClick}
          >
            {/* Base room image */}
            <img 
              src={roomData[currentRoom].baseImage} 
              alt={`${roomData[currentRoom].name} base`}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
            />
            
            {/* Mask overlays for each surface */}
            {roomData[currentRoom].surfaces.map((surface, idx) => {
              const maskLoaded = maskImagesRef.current[surface.id];
              const surfaceColor = surfaceColors[surface.id] || currentPaintColor;
              
              return (
                <div
                  key={surface.id}
                  className={`absolute inset-0 w-full h-full rounded-2xl lg:rounded-3xl transition-opacity duration-200 ${selectedSurface === surface.id ? 'opacity-100' : 'opacity-80'}`}
                  style={{
                    backgroundColor: surfaceColor,
                    maskImage: maskLoaded ? `url(${surface.mask})` : 'none',
                    WebkitMaskImage: maskLoaded ? `url(${surface.mask})` : 'none',
                    maskSize: 'cover',
                    WebkitMaskSize: 'cover',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    mixBlendMode: 'multiply',
                    zIndex: idx + 1,
                    pointerEvents: 'none',
                    // Hide overlay if mask hasn't loaded to prevent full-image coloring
                    display: maskLoaded ? 'block' : 'none',
                  }}
                />
              );
            })}
            
            {/* Loading indicator */}
            {!isMasksLoaded && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-2xl lg:rounded-3xl">
                <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium">
                  Loading masks...
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            {selectedSurface && (
              <div className="absolute top-6 left-6 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                {roomData[currentRoom].surfaces.find(s => s.id === selectedSurface)?.name || selectedSurface}
              </div>
            )}
            
            {/* Debug info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                Masks loaded: {isMasksLoaded ? 'Yes' : 'No'} | 
                Count: {Object.keys(maskImagesRef.current).length}
              </div>
            )}
          </div>
          <div className="surface-text font-light leading-none text-[#575454] text-[20px] lg:text-[28px] text-center">
            <p className="block leading-normal">Click on surfaces to select and paint</p>
          </div>
        </div>
        
        {/* Paint Color Swatches */}
        <div className="w-full border-t-[3px] lg:border-t-[5px] border-solid border-[#d2d2d2]">
          <div className="flex flex-row gap-4 lg:gap-[42px] items-center justify-center overflow-hidden px-8 lg:px-16 py-4 lg:py-6 w-full">
            {colorPalettes[currentPalette]?.paintColors?.map((color, index) => (
              <div 
                key={index}
                className={`aspect-square flex-1 max-w-[80px] lg:max-w-none rounded-bl-[16px] lg:rounded-bl-[24px] rounded-tr-[16px] lg:rounded-tr-[24px] cursor-pointer paint-swatch ${currentPaintColor === color ? 'selected-color' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => selectPaint(color)}
              />
            )) || (
              // Loading state - show placeholder swatches
              <div className="flex flex-row gap-4 lg:gap-[42px] items-center justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="aspect-square flex-1 max-w-[80px] lg:max-w-none rounded-bl-[16px] lg:rounded-bl-[24px] rounded-tr-[16px] lg:rounded-tr-[24px] bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer; 