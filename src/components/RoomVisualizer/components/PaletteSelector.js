import React from 'react';

const PaletteSelector = ({ currentPalette, selectPalette, colorPalettes, onColorPick = () => {} }) => {
  const [svgContent, setSvgContent] = React.useState({ 1: null, 2: null });

  // Utility to recolor an SVG string given an array of hex colors.
  const recolorSvg = (rawSvg, colors) => {
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rawSvg, 'image/svg+xml');
      // Add a class to the root SVG element so we can target paths for hover effects
      xmlDoc.documentElement.setAttribute('class', 'lockup-svg');
      const paths = Array.from(xmlDoc.querySelectorAll('path'));
      if (paths.length === 0 || colors.length === 0) return rawSvg; // nothing to recolor or no colors
      paths.forEach((p, idx) => {
        const color = colors[idx % colors.length];
        if (color) {
          p.setAttribute('fill', color);
        }
      });
      const serializer = new XMLSerializer();
      return serializer.serializeToString(xmlDoc);
    } catch (e) {
      console.warn('Failed to recolor svg:', e);
      return rawSvg;
    }
  };

  // Load and recolor SVGs whenever palette colors change
  React.useEffect(() => {
    const loadSvgs = async () => {
      try {
        const [coolRes, vibrantRes] = await Promise.all([
          fetch('/LockUpSvg/cool.svg'),
          fetch('/LockUpSvg/vibrant.svg'),
        ]);
        const [coolSvgRaw, vibrantSvgRaw] = await Promise.all([
          coolRes.text(),
          vibrantRes.text(),
        ]);
        const vibrantColors = colorPalettes?.[1]?.colors || [];
        const calmColors = colorPalettes?.[2]?.colors || [];
        setSvgContent({
          1: recolorSvg(coolSvgRaw, vibrantColors),
          2: recolorSvg(vibrantSvgRaw, calmColors),
        });
      } catch (e) {
        console.error('Failed to load lock-up svgs:', e);
      }
    };
    // Only trigger if palettes ready
    if (colorPalettes?.[1]?.colors?.length || colorPalettes?.[2]?.colors?.length) {
      loadSvgs();
    }
  }, [colorPalettes]);

  const renderPaletteSvg = (paletteId, altText) => {
    const html = svgContent[paletteId];
    if (html) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    // fallback while loading
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={paletteId === 1 ? '/LockUpSvg/cool.svg' : '/LockUpSvg/vibrant.svg'}
          alt={altText}
          className="w-full h-full max-w-[280px] max-h-[280px] opacity-30"
        />
      </div>
    );
  };

  // Determines whether the click event was on an SVG <path>. If so, extract its fill colour
  const handleContainerClick = (paletteId) => (event) => {
    const target = event.target;
    if (target && typeof target.getAttribute === 'function') {
      const fill = target.getAttribute('fill');
      const validHex = /^#[0-9A-F]{6}$/i;
      if (fill && validHex.test(fill)) {
        onColorPick(fill.toUpperCase());
        return; // Do not switch palette when picking a colour
      }
    }
    // Fallback: treat as palette selection
    selectPalette(paletteId);
  };

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
              onClick={handleContainerClick(1)}
            >
              {renderPaletteSvg(1, 'Cool Palette')}
            </div>
            <div className="vibrant-text font-normal leading-none text-black text-[28px] lg:text-[40px] text-left text-nowrap">
              <p className="block leading-normal whitespace-pre">Vibrant</p>
            </div>
          </div>
          
          {/* Palette 2 */}
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            <div 
              className={`aspect-square overflow-hidden relative w-full cursor-pointer palette-container ${currentPalette === 2 ? 'selected-color' : ''}`}
              onClick={handleContainerClick(2)}
            >
              {renderPaletteSvg(2, 'Vibrant Palette')}
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