import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PaletteSelector from './components/PaletteSelector';
import Visualizer from './components/Visualizer';
import RoomOptions from './components/RoomOptions';
import { roomData } from '../../data/roomData';
import ApiService from '../../services/api';
import ShareModal from './components/ShareModal';

const RoomVisualizer = () => {
  const { city } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const queryColorParam = searchParams.get('color');
  
  // State management
  const [currentPalette, setCurrentPalette] = useState(1);
  const [currentRoom, setCurrentRoom] = useState('bedroom');
  // No default paint colour until user selects
  const [currentPaintColor, setCurrentPaintColor] = useState(null);
  // No wall is selected initially; user must click a wall first
  const [selectedSurface, setSelectedSurface] = useState(null);
  // Surfaces start with no paint applied
  const [surfaceColors, setSurfaceColors] = useState(
    Object.keys(roomData).reduce((acc, roomKey) => {
      acc[roomKey] = {};
      return acc;
    }, {})
  );
  const [colorPalettes, setColorPalettes] = useState({
    1: {
      name: 'Vibrant',
      colors: [],
      paintColors: []
    },
    2: {
      name: 'Calm',
      colors: [],
      paintColors: []
    }
  });
  const [colorInfo, setColorInfo] = useState({});
  const [cityLabel, setCityLabel] = useState('');
  // Step guidance: true once the user selects any surface at least once
  const [hasSelectedSurfaceOnce, setHasSelectedSurfaceOnce] = useState(false);

  // Refs for canvas operations
  const containerRef = useRef(null);
  const maskImagesRef = useRef({});
  const [isMasksLoaded, setIsMasksLoaded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Persist selected city for restoring selection on browser back
  useEffect(() => {
    try {
      const sanitizedCity = city?.toLowerCase().replace(/'/g,'').trim();
      if (sanitizedCity && typeof window !== 'undefined') {
        sessionStorage.setItem('selectedCity', sanitizedCity);
      }
    } catch (_) {}
  }, [city]);

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
      const sanitizedCity = city?.toLowerCase().replace(/'/g,'').trim();
      const cityData = await ApiService.getCityData(sanitizedCity);
      if (!cityData || !cityData.colorPalettes) {
        throw new Error(`No color palette data found for city "${sanitizedCity}"`);
      }

      let vibrantColors = cityData.colorPalettes.vibrant || [];
      let calmColors = cityData.colorPalettes.calm || [];

      // If API palettes empty, try deriving from hotspots colours as fallback
      if (vibrantColors.length === 0 || calmColors.length === 0) {
        const allHotspotColors = cityData.hotspots?.map(h => h.color) || [];
        vibrantColors = allHotspotColors.slice(0, 4);
        calmColors = allHotspotColors.slice(4, 8);
      }

      if (vibrantColors.length === 0 || calmColors.length === 0) {
        throw new Error(`Incomplete palette data for city "${sanitizedCity}"`);
      }

      // Determine initial hotspot colour from route param, if provided
      let initialColor = null;
      if (queryColorParam) {
        try {
          initialColor = decodeURIComponent(queryColorParam).toUpperCase();
          if (!initialColor.startsWith('#')) {
            initialColor = '#' + initialColor.replace(/^#+/, '');
          }
        } catch {}
      }

      let initialPaletteId = 1;
      if (initialColor) {
        if (calmColors.map(c => c.toUpperCase()).includes(initialColor)) initialPaletteId = 2;
        else if (!vibrantColors.map(c => c.toUpperCase()).includes(initialColor)) {
          // if colour not in predefined lists, still allow prefill but keep palette 1
        }
      }

      const buildPaintArray = (paletteColors) => {
        if (initialColor && initialPaletteId === (paletteColors === vibrantColors ? 1 : 2)) {
          return [initialColor];
        }
        return [];
      };

      setColorPalettes({
        1: { name: 'Vibrant', colors: vibrantColors, paintColors: buildPaintArray(vibrantColors) },
        2: { name: 'Calm', colors: calmColors, paintColors: buildPaintArray(calmColors) }
      });

      // Set city label for UI (left column subheader)
      setCityLabel(cityData?.name || city || '');

      if (initialColor) {
        setCurrentPalette(initialPaletteId);
        setCurrentPaintColor(initialColor);

        // Pre-apply the hotspot color to Wall 1 of the pre-selected room
        const targetSurfaceId = 'wall1';
        setSurfaceColors(prev => ({
          ...prev,
          [currentRoom]: {
            ...(prev[currentRoom] || {}),
            [targetSurfaceId]: initialColor,
          },
        }));
      } else {
        setCurrentPaintColor(null);
      }

      // Fetch detailed color info from backend country data
      try {
        const backendCountry = await ApiService.getCountryByName(cityData.name);
        const vibrantDetails = backendCountry.color_pallets?.vibrant || [];
        const calmDetails = backendCountry.color_pallets?.calm || [];
        const infoMap = {};
        [...vibrantDetails, ...calmDetails].forEach((c) => {
          if (c?.color) {
            infoMap[c.color.toUpperCase()] = {
              name: c.name || '',
              detail: c.detail || c.description || '',
            };
          }
        });
        setColorInfo(infoMap);
      } catch (e) {
        console.warn('Failed to fetch detailed colour info', e);
      }
      // Keep pre-selected colour if provided via hotspot; otherwise clear
      if (!initialColor) {
        setCurrentPaintColor(null);
      }
    } catch (error) {
      console.error('Failed to load colour palettes:', error);
    }
  };

  // Load colors when component mounts or city changes
  useEffect(() => {
    loadPaletteColors();
  }, [city]);

  // Load mask images for the current room
  useEffect(() => {
    const loadMaskImages = async () => {
      const currentRoomData = roomData[currentRoom];
      if (!currentRoomData?.surfaces) return;

      console.log(`Loading masks for room: ${currentRoom}`);
      
      const loadPromises = currentRoomData.surfaces.map(surface => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";

          const originalSrc = surface.mask;
          const mediumSrc = `/optimized${originalSrc.replace(/\.[^.]+$/, (ext) => `-med${ext}`)}`;
          let triedFallback = false;

          const finish = () => {
            maskImagesRef.current[surface.id] = img;
            resolve();
          };

          img.onload = () => {
            console.log(`✅ Successfully loaded mask for ${surface.id}`);
            finish();
          };
          img.onerror = (error) => {
            if (!triedFallback) {
              triedFallback = true;
              console.warn(`Retry original for mask ${surface.id}:`, mediumSrc, error);
              img.src = originalSrc;
              return;
            }
            console.error(`❌ Failed to load mask for ${surface.id}:`, originalSrc, error);
            resolve(); // Continue even if one mask fails
          };

          // Try optimized medium first, then fallback to original on error
          img.src = mediumSrc;

          console.log(`Loading mask for ${surface.id}: trying ${mediumSrc} then ${originalSrc}`);
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
          setHasSelectedSurfaceOnce(true);
          return;
        }
      } catch (error) {
        console.warn('Error reading pixel data:', error);
      }
    }
  };

  // Auto-select first swatch only if none selected yet
  useEffect(() => {
    if (!currentPaintColor && colorPalettes[currentPalette]?.paintColors?.length > 0) {
      setCurrentPaintColor(colorPalettes[currentPalette].paintColors[0]);
    }
  }, [currentPalette, colorPalettes, currentPaintColor]);

  // Handle colour selection from the lock-up SVG (paths)
  const handleColorPick = (hexColor) => {
    if (!hexColor) return;

    // 1. Add or replace colour in swatches (max 4)
    setColorPalettes(prev => {
      const palette = prev[currentPalette] || {};
      const existing = palette.paintColors || [];

      // Ignore duplicates completely
      if (existing.includes(hexColor)) {
        return prev;
      }

      let updatedPaint;

      if (existing.length < 4) {
        // There is still room – push to the next slot
        updatedPaint = [...existing, hexColor];
      } else {
        // Swatches are full – replace the one currently selected by the user
        const indexToReplace = existing.indexOf(currentPaintColor);
        if (indexToReplace !== -1) {
          updatedPaint = [...existing];
          updatedPaint[indexToReplace] = hexColor;
        } else {
          // Fallback: replace the first swatch
          updatedPaint = [hexColor, ...existing.slice(1)];
        }
      }

      return {
        ...prev,
        [currentPalette]: {
          ...palette,
          paintColors: updatedPaint,
        },
      };
    });

    // 2. Apply colour to selected wall if one is already selected
    if (selectedSurface) {
      selectPaint(hexColor);
    } else {
      // Otherwise just set it as current paint color for convenience
      setCurrentPaintColor(hexColor);
    }
  };

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
          setHasSelectedSurfaceOnce(true);
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
      [currentRoom]: {
        ...prev[currentRoom],
        [selectedSurface]: color
      }
    }));
    // Deselect surface after applying color to remove selection shade
    if (selectedSurface) {
      setSelectedSurface(null);
    }
  };

  // Remove a paint colour from the current palette shortlist
  const removePaint = (index) => {
    setColorPalettes(prev => {
      const palette = prev[currentPalette] || {};
      const paintColors = palette.paintColors || [];
      if (index < 0 || index >= paintColors.length) return prev;

      const colorToRemove = paintColors[index];
      const updatedPaint = paintColors.filter((_, idx) => idx !== index);

      // If the removed colour was currently selected, clear the selection
      if (currentPaintColor === colorToRemove) {
        setCurrentPaintColor(null);
      }

      // Remove the colour from any surfaces that currently use it across all rooms
      setSurfaceColors(prevSurf => {
        const updatedSurf = { ...prevSurf };
        Object.keys(updatedSurf).forEach(roomKey => {
          const roomSurfaces = { ...updatedSurf[roomKey] };
          let changed = false;
          Object.keys(roomSurfaces).forEach(surfaceId => {
            if (roomSurfaces[surfaceId] === colorToRemove) {
              delete roomSurfaces[surfaceId];
              changed = true;
            }
          });
          if (changed) {
            updatedSurf[roomKey] = roomSurfaces;
          }
        });
        return updatedSurf;
      });

      return {
        ...prev,
        [currentPalette]: {
          ...palette,
          paintColors: updatedPaint,
        },
      };
    });
  };


  const selectRoom = (roomType) => {
    setCurrentRoom(roomType);
  };

  // Clear all painted areas for the current room
  const clearCurrentRoomSurfaces = () => {
    setSurfaceColors(prev => ({
      ...prev,
      [currentRoom]: {}
    }));
    setSelectedSurface(null);
  };

  // Open the Share modal
  const handleShare = () => {
    setIsShareOpen(true);
  };

  // Build a printable/exportable image of the current scene and trigger download
  const generateAndDownloadImage = async () => {
    try {
      const CANVAS_WIDTH = 1240; // approx A4 width at ~150dpi
      const CANVAS_HEIGHT = 1754; // A4-ish portrait
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Margins and layout
      const marginX = 64;
      const topAreaHeight = 120;
      const gap = 24;

      // 1) Draw Dulux logo on top, centered
      await new Promise((resolve) => {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const maxLogoW = CANVAS_WIDTH * 0.5;
          const scale = Math.min(maxLogoW / logo.width, (topAreaHeight - 20) / logo.height);
          const w = logo.width * scale;
          const h = logo.height * scale;
          const x = (CANVAS_WIDTH - w) / 2;
          const y = 20 + (topAreaHeight - 20 - h) / 2;
          ctx.drawImage(logo, x, y, w, h);
          resolve();
        };
        logo.onerror = () => resolve();
        logo.src = '/Dulux.png';
      });

      // 2) Compose the room image (base + colored masks)
      const imageArea = {
        x: marginX,
        y: topAreaHeight + gap,
        w: CANVAS_WIDTH - marginX * 2,
        h: 860,
      };

      // Draw base image, fit within imageArea keeping aspect ratio (cover)
      await new Promise((resolve) => {
        const baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';
        baseImg.onload = () => {
          const iw = baseImg.width;
          const ih = baseImg.height;
          const arImg = iw / ih;
          const arBox = imageArea.w / imageArea.h;
          let dw = imageArea.w;
          let dh = imageArea.h;
          let dx = imageArea.x;
          let dy = imageArea.y;
          if (arImg > arBox) {
            // image is wider; fit height, crop width
            dh = imageArea.h;
            dw = dh * arImg;
            dx = imageArea.x - (dw - imageArea.w) / 2;
          } else {
            // image taller; fit width, crop height
            dw = imageArea.w;
            dh = dw / arImg;
            dy = imageArea.y - (dh - imageArea.h) / 2;
          }
          ctx.save();
          ctx.beginPath();
          // Rounded corners like UI
          const r = 18;
          ctx.moveTo(imageArea.x + r, imageArea.y);
          ctx.arcTo(imageArea.x + imageArea.w, imageArea.y, imageArea.x + imageArea.w, imageArea.y + imageArea.h, r);
          ctx.arcTo(imageArea.x + imageArea.w, imageArea.y + imageArea.h, imageArea.x, imageArea.y + imageArea.h, r);
          ctx.arcTo(imageArea.x, imageArea.y + imageArea.h, imageArea.x, imageArea.y, r);
          ctx.arcTo(imageArea.x, imageArea.y, imageArea.x + imageArea.w, imageArea.y, r);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(baseImg, dx, dy, dw, dh);
          ctx.restore();
          resolve();
        };
        baseImg.onerror = () => resolve();
        baseImg.src = roomData[currentRoom].baseImage;
      });

      // Overlay coloured masks
      const currentRoomData = roomData[currentRoom];
      const surfaces = currentRoomData?.surfaces || [];
      for (const surface of surfaces) {
        const color = (surfaceColors[currentRoom] || {})[surface.id];
        const maskImg = maskImagesRef.current[surface.id];
        if (!color || !maskImg) continue;

        // Prepare an offscreen canvas to tint by mask alpha
        const temp = document.createElement('canvas');
        temp.width = imageArea.w;
        temp.height = imageArea.h;
        const tctx = temp.getContext('2d');

        // Draw mask to temp scaled to imageArea
        // We assume mask aligns with base image when stretched to the same box
        tctx.drawImage(maskImg, 0, 0, temp.width, temp.height);
        // Keep only mask area with the fill color
        tctx.globalCompositeOperation = 'source-in';
        tctx.fillStyle = color;
        tctx.fillRect(0, 0, temp.width, temp.height);

        // Multiply onto main canvas for a more natural blend
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(temp, imageArea.x, imageArea.y);
        ctx.restore();
      }

      // 3) Draw selected colors grid (2x2)
      const swatches = (colorPalettes[currentPalette]?.paintColors || []).slice(0, 4);
      const swatchAreaTop = imageArea.y + imageArea.h + gap * 1.5;
      const gridW = CANVAS_WIDTH - marginX * 2;
      const gridH = CANVAS_HEIGHT - swatchAreaTop - 64;
      const cellW = (gridW - gap) / 2;
      const cellH = (gridH - gap) / 2;

      const isColorUsedInRoom = (hex) => {
        const used = surfaceColors[currentRoom] || {};
        return Object.values(used).some((c) => (c || '').toUpperCase() === (hex || '').toUpperCase());
      };

      const parseHex = (hex) => {
        if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
        const n = hex.replace('#', '').trim();
        if (n.length === 3) {
          return { r: parseInt(n[0] + n[0], 16), g: parseInt(n[1] + n[1], 16), b: parseInt(n[2] + n[2], 16) };
        }
        return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
      };

      for (let i = 0; i < 4; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = marginX + col * (cellW + gap);
        const y = swatchAreaTop + row * (cellH + gap);
        const color = swatches[i];

        // Card background
        ctx.save();
        const radius = 18;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + cellW, y, x + cellW, y + cellH, radius);
        ctx.arcTo(x + cellW, y + cellH, x, y + cellH, radius);
        ctx.arcTo(x, y + cellH, x, y, radius);
        ctx.arcTo(x, y, x + cellW, y, radius);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = color || '#E5E7EB';
        ctx.fillRect(x, y, cellW, cellH);

        // Text overlay if there is a color
        if (color) {
          const info = (colorInfo || {})[(color || '').toUpperCase()] || {};
          const { r, g, b } = parseHex(color);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const text = brightness <= 140 ? '#FFFFFF' : '#000000';
          ctx.fillStyle = text;
          ctx.font = 'bold 24px Inter, Arial, sans-serif';
          ctx.fillText(info.name || '', x + 20, y + 40);
          ctx.font = '16px Inter, Arial, sans-serif';
          if (info.detail) ctx.fillText(info.detail, x + 20, y + 70);

          if (isColorUsedInRoom(color)) {
            // Tag: Featured in scene
            const tag = 'Featured in scene';
            const padX = 10;
            const padY = 6;
            ctx.font = 'bold 14px Inter, Arial, sans-serif';
            const tw = ctx.measureText(tag).width;
            const bx = x + 20;
            const by = y + cellH - 20 - 22;
            ctx.fillStyle = text === '#000000' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
            ctx.fillRect(bx - padX, by - 16 - padY, tw + padX * 2, 16 + padY * 2);
            ctx.fillStyle = text === '#000000' ? '#FFFFFF' : '#000000';
            ctx.fillText(tag, bx, by);
          }
        }

        ctx.restore();
      }

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `room-share-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Failed to generate image', err);
    }
  };

  const handleShareConfirm = async () => {
    await generateAndDownloadImage();
    setIsShareOpen(false);
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden font-['Inter',sans-serif]"
      style={{
        background:
          'linear-gradient(115deg, rgba(200, 214, 255, 0.40) 0%, rgba(226, 226, 226, 0.40) 135.34%), #FFF'
      }}
    >
      <style jsx>{`
        .color-palette {
          background: linear-gradient(45deg, #8B5FB5 25%, #9B6FC5 25%, #9B6FC5 50%, #7A9CC6 50%, #7A9CC6 75%, #8FA9D0 75%);
          background-size: 40px 40px;
        }
        .selected-color {
          /* Blue selection border removed */
        }
        .room-surface:hover {
          filter: brightness(1.1);
          transition: filter 0.2s ease;
        }
        /* Scale swatch and its remove icon together */
        .swatch-item:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
          transform-origin: center;
        }
        .palette-container:hover {
          /* No scaling of the entire lockup on hover */
        }

        /* Individual paths in the lock-up SVG (idle animation support) */
        .lockup-svg path {
          transition: transform 0.2s ease, filter 0.2s ease;
          transform-origin: center;
        }
        /* Hover scaling removed in favour of idle animation */
        .lockup-svg path:hover {
          transform: none;
        }
        /* Idle elevate animation state */
        .lockup-svg path.idle-elevate {
          transform: translateY(-3px) scale(1.12);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.18));
        }
        .room-option:hover > div:first-child {
         
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
           /* Keep a 3-column row layout on small screens (landscape mobile) */
           .main-container {
             flex-direction: row;
             height: 100vh;
           }
           /* Preserve visible three columns; rely on existing fractional widths */
           .column-1, .column-2, .column-3 {
             flex-shrink: 1 !important;
           }
           .title-text {
             font-size: 28px !important;
           }
           .container-height {
             height: auto !important;
             min-height: 300px;
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

        /* Typography scaling from FHD baseline across all viewports */
        .main-container {
          /* Scale factor relative to 1920px width, clamped for mobile and 4K */
          --vr-scale: clamp(0.42, calc(100vw / 1920), 2);
        }
        .title-text { font-size: calc(20px * var(--vr-scale)) !important; }
        .vibrant-text { font-size: calc(40px * var(--vr-scale)); }
        .surface-text { font-size: calc(28px * var(--vr-scale)) !important; }
        .room-name-label { font-size: clamp(10px, calc(14px * var(--vr-scale)), 18px) !important; }
        .subline-text { font-size: calc(12px * var(--vr-scale)) !important; }
      `}</style>
      <div className="main-container flex flex-row items-center justify-start w-full h-full  ">
        <PaletteSelector
          currentPalette={currentPalette}
          selectPalette={selectPalette}
          colorPalettes={colorPalettes}
          onColorPick={handleColorPick}
          cityName={cityLabel}
          isIdleAnimationEnabled={hasSelectedSurfaceOnce}
          onBack={() => navigate('/city-selection')}
        />
        <Visualizer
          currentRoom={currentRoom}
          currentPalette={currentPalette}
          currentPaintColor={currentPaintColor}
          selectedSurface={selectedSurface}
          surfaceColors={surfaceColors[currentRoom]}
          colorPalettes={colorPalettes}
          colorInfo={colorInfo}
          containerRef={containerRef}
          handleCanvasClick={handleCanvasClick}
          selectPaint={selectPaint}
          isMasksLoaded={isMasksLoaded}
          maskImagesRef={maskImagesRef}
          removePaint={removePaint}
          onClearAreas={clearCurrentRoomSurfaces}
          onShare={handleShare}
          shouldBlinkSelection={!hasSelectedSurfaceOnce}
        />
        <RoomOptions
          currentRoom={currentRoom}
          selectRoom={selectRoom}
        />
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          onConfirm={handleShareConfirm}
        />
      </div>
    </div>
  );
};

export default RoomVisualizer;