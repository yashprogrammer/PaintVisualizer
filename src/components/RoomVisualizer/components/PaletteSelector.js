import React from 'react';

const PaletteSelector = ({ currentPalette, selectPalette }) => {
  return (
    <div className="column-1 column-padding flex flex-col gap-4 lg:gap-8 items-start justify-start overflow-hidden px-4 lg:px-[25px] w-1/4 flex-shrink-0">
      <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-left w-full">
        <p className="block leading-normal">Color Lock UP</p>
      </div>
      <div className="container-height flex-1 relative rounded-2xl lg:rounded-3xl w-full border-[3px] lg:border-[5px] border-solid border-[#d2d2d2]">
        <div className="flex flex-col gap-6 lg:gap-12 h-full items-center justify-center overflow-hidden px-4 lg:px-14 py-2.5 relative w-full">
          
          {/* Palette 1 */}
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            <div 
              className={`aspect-square overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 1 ? 'selected-color' : ''}`}
              onClick={() => selectPalette(1)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/LockUpSvg/cool.svg" 
                  alt="Cool Palette"
                  className="w-full h-full max-w-[280px] max-h-[280px]"
                />
              </div>
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-left text-nowrap">
              <p className="block leading-normal whitespace-pre">Vibrant</p>
            </div>
          </div>
          
          {/* Palette 2 */}
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            <div 
              className={`aspect-square overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 2 ? 'selected-color' : ''}`}
              onClick={() => selectPalette(2)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/LockUpSvg/vibrant.svg" 
                  alt="Vibrant Palette"
                  className="w-full h-full max-w-[280px] max-h-[280px]"
                />
              </div>
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-left text-nowrap">
              <p className="block leading-normal whitespace-pre">Cool</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaletteSelector; 