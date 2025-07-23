import React, { useState, useEffect, useRef } from 'react';

const RoomVisualizer = () => {
  // State management
  const [currentPalette, setCurrentPalette] = useState(1);
  const [currentRoom, setCurrentRoom] = useState('bedroom');
  const [currentPaintColor, setCurrentPaintColor] = useState('#d07171');
  const [selectedSurface, setSelectedSurface] = useState('wall1');
  const [surfaceColors, setSurfaceColors] = useState({
    wall1: '#d07171',
    wall2: '#d07171', 
    wall3: '#d07171'
  });
  const [colorPalettes, setColorPalettes] = useState({
    1: {
      name: 'Vibrant Cool',
      colors: [],
      paintColors: []
    },
    2: {
      name: 'Vibrant Warm',
      colors: [],
      paintColors: []
    }
  });

  // Refs for canvas operations
  const containerRef = useRef(null);
  const maskImagesRef = useRef({});
  const [isMasksLoaded, setIsMasksLoaded] = useState(false);

  // Function to extract colors from SVG content
  const extractColorsFromSVG = (svgContent) => {
    const fillRegex = /fill="([^"]+)"/g;
    const colors = [];
    let match;
    
    while ((match = fillRegex.exec(svgContent)) !== null) {
      const color = match[1];
      // Only include valid hex colors and exclude 'none', 'white', or url references
      if (color.startsWith('#') && 
          color !== '#ffffff' && 
          color !== '#fff' && 
          color.toLowerCase() !== '#white' &&
          !color.includes('url(')) {
        // Normalize hex colors to uppercase and ensure proper format
        let normalizedColor = color.toUpperCase();
        
        // Fix any malformed hex colors (e.g., #fCADC7 should be #FCADC7)
        if (normalizedColor.length === 7) {
          // Check if it's a valid hex color
          const hexPattern = /^#[0-9A-F]{6}$/i;
          if (hexPattern.test(normalizedColor)) {
            if (!colors.includes(normalizedColor)) {
              colors.push(normalizedColor);
            }
          }
        }
      }
    }
    
    console.log('Extracted colors:', colors);
    return colors;
  };

  // Function to load SVG and extract colors
  const loadPaletteColors = async () => {
    try {
      console.log('Loading SVG colors...');
      
      // Fetch cool.svg
      const coolResponse = await fetch('/LockUpSvg/cool.svg');
      const coolSvgContent = await coolResponse.text();
      console.log('Cool SVG loaded, extracting colors...');
      const coolColors = extractColorsFromSVG(coolSvgContent);

      // Fetch vibrant.svg
      const vibrantResponse = await fetch('/LockUpSvg/vibrant.svg');
      const vibrantSvgContent = await vibrantResponse.text();
      console.log('Vibrant SVG loaded, extracting colors...');
      const vibrantColors = extractColorsFromSVG(vibrantSvgContent);

      console.log('Final cool colors:', coolColors);
      console.log('Final vibrant colors:', vibrantColors);

      // Update color palettes with extracted colors
      setColorPalettes({
        1: {
          name: 'Vibrant Cool',
          colors: coolColors,
          paintColors: coolColors
        },
        2: {
          name: 'Vibrant Warm',
          colors: vibrantColors,
          paintColors: vibrantColors
        }
      });

      // Set initial paint color to first color of current palette
      if (coolColors.length > 0) {
        setCurrentPaintColor(coolColors[0]);
      }
    } catch (error) {
      console.error('Error loading SVG colors:', error);
      // Fallback to default colors if SVG loading fails
      setColorPalettes({
        1: {
          name: 'Vibrant Cool',
          colors: ['#8B5FB5', '#9B6FC5', '#7A9CC6', '#8FA9D0'],
          paintColors: ['#8B5FB5', '#7A9CC6', '#9B6FC5', '#8FA9D0']
        },
        2: {
          name: 'Vibrant Warm',
          colors: ['#A0725C', '#D4956B', '#7A9B6C', '#9BB08A'],
          paintColors: ['#A0725C', '#D4956B', '#7A9B6C', '#9BB08A']
        }
      });
    }
  };

  // Load colors when component mounts
  useEffect(() => {
    loadPaletteColors();
  }, []);

  // Load mask images for the current room
  useEffect(() => {
    const loadMaskImages = async () => {
      const currentRoomData = roomData[currentRoom];
      if (!currentRoomData?.surfaces) return;

      console.log(`Loading masks for room: ${currentRoom}`);
      
      const loadPromises = currentRoomData.surfaces.map(surface => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = surface.mask;
          
          console.log(`Loading mask for ${surface.id}: ${surface.mask}`);
          
          img.onload = () => {
            console.log(`✅ Successfully loaded mask for ${surface.id}`);
            maskImagesRef.current[surface.id] = img;
            resolve();
          };
          img.onerror = (error) => {
            console.error(`❌ Failed to load mask for ${surface.id}:`, surface.mask, error);
            resolve(); // Continue even if one mask fails
          };
        });
      });

      try {
        await Promise.all(loadPromises);
        console.log(`✅ All masks loaded for ${currentRoom}. Loaded masks:`, Object.keys(maskImagesRef.current));
        setIsMasksLoaded(true);
      } catch (error) {
        console.error('Error loading mask images:', error);
        setIsMasksLoaded(false);
      }
    };

    setIsMasksLoaded(false);
    maskImagesRef.current = {}; // Clear previous masks
    loadMaskImages();
  }, [currentRoom]);

  // Handle canvas click for surface selection
  const handleCanvasClick = (e) => {
    if (!isMasksLoaded) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const currentRoomData = roomData[currentRoom];
    if (!currentRoomData?.surfaces) return;

    // Check surfaces in reverse order (top-most first)
    const reversedSurfaces = [...currentRoomData.surfaces].reverse();

    for (const surface of reversedSurfaces) {
      const img = maskImagesRef.current[surface.id];
      if (!img) continue;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        if (pixelData[3] > 0) { // Check alpha channel
          setSelectedSurface(surface.id);
          return;
        }
      } catch (error) {
        console.warn('Error reading pixel data:', error);
      }
    }
  };

  // Room data with different surface colors
  const roomData = {
    'bedroom': {
      name: 'Bedroom',
      baseColor: '#6b4f8a',
      baseImage: '/Room/Bedroom/base.png',
      surfaces: [
        { id: 'wall1', name: 'Wall 1', mask: '/Room/Bedroom/wall1.png' },
        { id: 'wall2', name: 'Wall 2', mask: '/Room/Bedroom/wall2.png' },
        { id: 'wall3', name: 'Wall 3', mask: '/Room/Bedroom/wall3.png' }
      ]
    },
    'living-room': {
      name: 'Living Room',
      baseColor: '#883f3f',
      baseImage: '/Room/Bedroom/base.png', // Fallback to bedroom
      surfaces: [
        { id: 'wall1', name: 'Wall 1', mask: '/Room/Bedroom/wall1.png' },
        { id: 'wall2', name: 'Wall 2', mask: '/Room/Bedroom/wall2.png' },
        { id: 'wall3', name: 'Wall 3', mask: '/Room/Bedroom/wall3.png' }
      ]
    },
    'kitchen': {
      name: 'Kitchen',
      baseColor: '#5a7c65',
      baseImage: '/Room/Bedroom/base.png', // Fallback to bedroom
      surfaces: [
        { id: 'wall1', name: 'Wall 1', mask: '/Room/Bedroom/wall1.png' },
        { id: 'wall2', name: 'Wall 2', mask: '/Room/Bedroom/wall2.png' },
        { id: 'wall3', name: 'Wall 3', mask: '/Room/Bedroom/wall3.png' }
      ]
    },
    'bathroom': {
      name: 'Bathroom',
      baseColor: '#7a6b5a',
      baseImage: '/Room/Bedroom/base.png', // Fallback to bedroom
      surfaces: [
        { id: 'wall1', name: 'Wall 1', mask: '/Room/Bedroom/wall1.png' },
        { id: 'wall2', name: 'Wall 2', mask: '/Room/Bedroom/wall2.png' },
        { id: 'wall3', name: 'Wall 3', mask: '/Room/Bedroom/wall3.png' }
      ]
    }
  };

  // Initialize paint swatches based on current palette
  useEffect(() => {
    if (colorPalettes[currentPalette]?.paintColors?.length > 0) {
      setCurrentPaintColor(colorPalettes[currentPalette].paintColors[0]);
    }
  }, [currentPalette, colorPalettes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Number keys 1-4 for paint colors
      if (event.key >= '1' && event.key <= '4') {
        const colorIndex = parseInt(event.key) - 1;
        const paletteColors = colorPalettes[currentPalette]?.paintColors;
        if (paletteColors && paletteColors[colorIndex]) {
          selectPaint(paletteColors[colorIndex]);
        }
      }
      
      // Number keys 5-7 for surface selection (wall1, wall2, wall3)
      if (event.key >= '5' && event.key <= '7') {
        const surfaceIndex = parseInt(event.key) - 5;
        const currentRoomData = roomData[currentRoom];
        if (currentRoomData?.surfaces && currentRoomData.surfaces[surfaceIndex]) {
          setSelectedSurface(currentRoomData.surfaces[surfaceIndex].id);
        }
      }
      
      // P key for palette switching
      if (event.key.toLowerCase() === 'p') {
        setCurrentPalette(currentPalette === 1 ? 2 : 1);
      }
      
      // R key for room cycling
      if (event.key.toLowerCase() === 'r') {
        const rooms = Object.keys(roomData);
        const currentIndex = rooms.indexOf(currentRoom);
        const nextIndex = (currentIndex + 1) % rooms.length;
        selectRoom(rooms[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPalette, currentRoom, colorPalettes, selectedSurface]);

  // Event handlers
  const selectPalette = (paletteId) => {
    setCurrentPalette(paletteId);
  };

  const selectPaint = (color) => {
    setCurrentPaintColor(color);
    // Update the color for the currently selected surface
    setSurfaceColors(prev => ({
      ...prev,
      [selectedSurface]: color
    }));
  };

  const selectSurface = (surfaceId) => {
    setSelectedSurface(surfaceId);
  };

  const selectRoom = (roomType) => {
    setCurrentRoom(roomType);
    // Reset surface colors when changing rooms
    setSurfaceColors({
      wall1: currentPaintColor,
      wall2: currentPaintColor,
      wall3: currentPaintColor
    });
  };

  // Get current room surface color
  const getCurrentSurfaceColor = () => {
    return surfaceColors[selectedSurface] || currentPaintColor || roomData[currentRoom].baseColor;
  };

  return (
    <div className="bg-white w-screen h-screen overflow-hidden font-['Inter',sans-serif]">
      <style jsx>{`
        .color-palette {
          background: linear-gradient(45deg, #8B5FB5 25%, #9B6FC5 25%, #9B6FC5 50%, #7A9CC6 50%, #7A9CC6 75%, #8FA9D0 75%);
          background-size: 40px 40px;
        }
        .selected-color {
          box-shadow: 0 0 0 4px #3B82F6;
        }
        .room-surface:hover {
          filter: brightness(1.1);
          transition: filter 0.2s ease;
        }
        .paint-swatch:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .palette-container:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
        .room-option:hover > div:first-child {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        
        /* Mask overlay improvements */
        .mask-overlay {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        .room-container {
          position: relative;
          overflow: hidden;
        }
        
        .room-container img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        /* Surface selection feedback */
        .surface-selected {
          filter: brightness(1.1) saturate(1.2);
        }
        
        /* Responsive adjustments */
         @media (max-width: 1024px) {
           .main-container {
             flex-direction: column;
             height: auto;
             min-height: 100vh;
           }
           .column-1, .column-2, .column-3 {
             width: 100% !important;
             flex-shrink: 1 !important;
           }
          .title-text {
            font-size: 28px !important;
          }
          .container-height {
            height: auto !important;
            min-height: 400px;
          }
        }
        
        @media (max-width: 768px) {
          .title-text {
            font-size: 24px !important;
          }
          .vibrant-text {
            font-size: 28px !important;
          }
          .surface-text {
            font-size: 20px !important;
          }
          .column-padding {
            padding: 20px !important;
          }
        }
      `}</style>

      <div className="main-container bg-white flex flex-row items-stretch justify-start w-full h-full py-16">
        
        {/* Column 1: Color Lock UP - 25% width */}
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
        
        {/* Column 2: Visualizer - 50% width */}
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
        
        {/* Column 3: Select Room - 25% width */}
        <div className="column-3 column-padding flex flex-col gap-4 lg:gap-8 items-start justify-start overflow-hidden px-4 lg:px-[25px]  w-1/4 flex-shrink-0">
          <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-right w-full">
            <p className="block leading-normal">Select Room</p>
          </div>
          <div className="container-height flex flex-col flex-1 items-start justify-start p-3 lg:p-[16px] rounded-2xl lg:rounded-3xl border-[3px] lg:border-[5px] border-solid border-[#d2d2d2] w-full h-full min-h-0">
            
            {/* Room Options */}
            <div className="flex flex-col flex-1 w-full h-full min-h-0 gap-2.5">
              {Object.entries(roomData).map(([roomKey, room], index) => (
                <div 
                  key={roomKey}
                  className={`flex flex-col gap-2.5 items-center justify-start w-full room-option cursor-pointer flex-1 min-h-0 ${currentRoom === roomKey ? 'ring-2 lg:ring-4 ring-blue-500' : ''}`}
                  onClick={() => selectRoom(roomKey)}
                  style={{ minHeight: 0 }}
                >
                  <div className="rounded-lg w-full overflow-hidden relative hover:opacity-80 transition-opacity flex-1 min-h-0">
                    <img 
                      src={room.baseImage} 
                      alt={`${room.name} preview`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {room.name}
                      </span>
                    </div>
                  </div>
                  {index < Object.keys(roomData).length - 1 && (
                    <div className="bg-[#cec5c5] h-0.5 rounded-lg w-3/4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomVisualizer;