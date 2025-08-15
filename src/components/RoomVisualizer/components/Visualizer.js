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
  onClearAreas,
  onShare
}) => {
  return (
    <div className="column-2 column-padding flex flex-col items-center justify-between overflow-hidden px-4 lg:px-[25px]  w-1/2 flex-shrink-0 h-full">
      <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-center w-full font-brand">
        <p className="block leading-normal">Visualizer</p>
      </div>
      <div
        className="container-height flex flex-col gap-4 lg:gap-[21px] flex-1 items-center justify-end relative rounded-3xl w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          boxShadow:
            '0 244px 68px 0 rgba(0, 0, 0, 0.00), 0 156px 63px 0 rgba(0, 0, 0, 0.01), 0 88px 53px 0 rgba(0, 0, 0, 0.03), 0 39px 39px 0 rgba(0, 0, 0, 0.04), 0 10px 22px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        
        {/* Room Visualization Area */}
        <div className="flex-1 flex flex-col gap-2.5 items-center justify-center overflow-hidden pb-0 pt-4 lg:pt-8 px-4 lg:px-[18px] w-full min-h-0">
          <div 
            ref={containerRef}
            className="flex-1 w-full rounded-2xl lg:rounded-3xl relative cursor-pointer min-h-[200px] overflow-hidden"
            onClick={handleCanvasClick}
          >
            {/* Clear Areas pill */}
            <div className="absolute top-6 right-6 bg-white text-black px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm z-[200]">
              <button
                type="button"
                className="text-[12px] font-medium"
                onClick={(e) => { e.stopPropagation(); onClearAreas && onClearAreas(); }}
              >
                CLEAR AREAS
              </button>
            </div>
            {/* Base room image */}
            <img 
              src={roomData[currentRoom].baseImage} 
              alt={`${roomData[currentRoom].name} base`}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
            />
            
            {/* Mask overlays for each surface */}
            {roomData[currentRoom].surfaces.map((surface, idx) => {
              const maskLoaded = maskImagesRef.current[surface.id];
              const isSelected = selectedSurface === surface.id;
              const surfaceColor = surfaceColors[surface.id];

              // Skip rendering if not selected and no colour applied yet
              if (!isSelected && !surfaceColor) return null;

              const styleObj = {
                backgroundColor: surfaceColor ? surfaceColor : (isSelected ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.001)'),
                maskImage: maskLoaded ? `url(${surface.mask})` : 'none',
                WebkitMaskImage: maskLoaded ? `url(${surface.mask})` : 'none',
                maskSize: 'cover',
                WebkitMaskSize: 'cover',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                mixBlendMode: surfaceColor ? 'multiply' : 'normal',
                zIndex: isSelected ? 100 : idx + 1,
                pointerEvents: 'none',
                // Hide overlay if mask hasn't loaded to prevent full-image coloring
                display: maskLoaded ? 'block' : 'none',
                transition: 'opacity 0.2s ease',
              };

              const overlayOpacityClass = surfaceColor ? 'opacity-100' : (isSelected ? 'opacity-100' : 'opacity-80');

              return (
                <div
                  key={surface.id}
                  className={`absolute inset-0 w-full h-full rounded-2xl lg:rounded-3xl ${overlayOpacityClass}`}
                  style={styleObj}
                />
              );
            })}
            
            {/* Loading indicator */}
            {!isMasksLoaded && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-2xl lg:rounded-3xl">
                <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium font-brand">
                  Loading masks...
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            {selectedSurface && (
              <div className="absolute top-6 left-6 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium font-brand">
                {roomData[currentRoom].surfaces.find(s => s.id === selectedSurface)?.name || selectedSurface}
              </div>
            )}
            
      
         
          </div>
          <div className="surface-text font-light leading-none text-[#575454] text-[20px] lg:text-[28px] text-center font-brand w-full flex items-center justify-between px-6">
            <p className="block leading-normal">Select surface to paint</p>
            <button
              type="button"
              onClick={onShare}
              className="bg-white text-black text-[16px] px-[18px] py-2 rounded-xl border border-[#bab1b1] flex items-center gap-2 hover:bg-gray-50"
            >
              Share
            </button>
          </div>
        </div>
        
        {/* Paint Color Swatches */}
        <div className="w-full border-t-[3px] lg:border-t-[5px] border-solid border-[#d2d2d2]">
          <div className="flex flex-row gap-4 lg:gap-[42px] items-center justify-center overflow-hidden px-8 lg:px-16 py-4 lg:py-6 w-full">
            {Array.from({ length: 4 }).map((_, index) => {
              const color = (colorPalettes[currentPalette]?.paintColors || [])[index];
              const isFilled = Boolean(color);
              const commonClasses = 'aspect-square w-20 lg:w-28 rounded-bl-[16px] lg:rounded-bl-[24px] rounded-tr-[16px] lg:rounded-tr-[24px]';
 
              if (isFilled) {
                const details = colorInfo?.[color?.toUpperCase()] || {};
                return (
                  <div key={index} className="flex flex-col items-center gap-1 swatch-item min-h-[130px] lg:min-h-[160px]">
                    <div className="relative swatch-container overflow-visible">
                      <div
                        className={`${commonClasses} cursor-pointer paint-swatch ${currentPaintColor === color ? 'selected-color' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => selectPaint(color)}
                        title={details.name || color}
                      />
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
                    <span className="text-xs text-center whitespace-nowrap max-w-[112px] truncate">{details.name || ''}</span>
                    {details.detail && (
                      <span className="text-[10px] text-center whitespace-nowrap italic leading-none max-w-[112px] truncate">{details.detail}</span>
                    )}
                  </div>
                );
              }
 
              // Placeholder swatch
              return (
                <div key={index} className="flex flex-col items-center gap-1 swatch-item min-h-[130px] lg:min-h-[160px]">
                  <div className={`${commonClasses} bg-gray-200`} />
                  <span className="text-xs">&nbsp;</span>
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