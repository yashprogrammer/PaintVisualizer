import React, { useRef, useEffect, useState } from 'react';
import baseImage from '../assets/base.jpg';

function RoomVisualizer({ parts, colors, onSelectPart, selectedPart }) {
  const containerRef = useRef(null);
  const maskImagesRef = useRef({});
  const [isMasksLoaded, setIsMasksLoaded] = useState(false);

  useEffect(() => {
    const loadImage = (part) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = part.mask;
        img.onload = () => {
          maskImagesRef.current[part.id] = img;
          resolve();
        };
        img.onerror = reject;
      });
    };

    Promise.all(parts.map(loadImage)).then(() => {
      setIsMasksLoaded(true);
    });
  }, [parts]);

  const handleContainerClick = (e) => {
    if (!isMasksLoaded) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // The parts are rendered with increasing z-index.
    // We need to check for clicks from the top-most layer first, so we reverse the parts array.
    const reversedParts = [...parts].reverse();

    for (const part of reversedParts) {
      const img = maskImagesRef.current[part.id];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pixelData = ctx.getImageData(x, y, 1, 1).data;

      if (pixelData[3] > 0) { // Check alpha channel of the mask
        onSelectPart(part.id);
        return; // Stop after finding the first match
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="room-container"
      onClick={handleContainerClick}
    >
      <img src={baseImage} alt="Empty Room" className="base-image" />
      {parts.map((part, idx) => (
        <div
          key={part.id}
          className={`room-part ${selectedPart === part.id ? 'selected' : ''}`}
          style={{
            backgroundColor: colors[part.id],
            maskImage: `url(${part.mask})`,
            WebkitMaskImage: `url(${part.mask})`,
            zIndex: idx + 1,
            pointerEvents: 'none', // Clicks are handled by the container
          }}
        />
      ))}
    </div>
  );
}

export default RoomVisualizer;