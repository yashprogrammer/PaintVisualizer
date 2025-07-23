import React, { useState, useEffect, useRef } from 'react';
import PaletteSelector from './components/PaletteSelector';
import Visualizer from './components/Visualizer';
import RoomOptions from './components/RoomOptions';
import { roomData } from '../../data/roomData';

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

  const selectRoom = (roomType) => {
    setCurrentRoom(roomType);
    // Reset surface colors when changing rooms
    setSurfaceColors({
      wall1: currentPaintColor,
      wall2: currentPaintColor,
      wall3: currentPaintColor
    });
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
        <PaletteSelector
          currentPalette={currentPalette}
          selectPalette={selectPalette}
        />
        <Visualizer
          currentRoom={currentRoom}
          currentPalette={currentPalette}
          currentPaintColor={currentPaintColor}
          selectedSurface={selectedSurface}
          surfaceColors={surfaceColors}
          colorPalettes={colorPalettes}
          containerRef={containerRef}
          handleCanvasClick={handleCanvasClick}
          selectPaint={selectPaint}
          isMasksLoaded={isMasksLoaded}
          maskImagesRef={maskImagesRef}
        />
        <RoomOptions
          currentRoom={currentRoom}
          selectRoom={selectRoom}
        />
      </div>
    </div>
  );
};

export default RoomVisualizer;