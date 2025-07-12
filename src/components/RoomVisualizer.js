import React from 'react';
import baseImage from '../assets/base.jpg';

function RoomVisualizer({ parts, colors, onSelectPart, selectedPart }) {
  return (
    <div className="room-container">
      <img src={baseImage} alt="Empty Room" className="base-image" />
      {parts.map((part) => (
        <div
          key={part.id}
          className={`room-part ${selectedPart === part.id ? 'selected' : ''}`}
          onClick={() => onSelectPart(part.id)}
          style={{
            backgroundColor: colors[part.id],
            maskImage: `url(${part.mask})`,
            WebkitMaskImage: `url(${part.mask})`,
          }}
        />
      ))}
    </div>
  );
}

export default RoomVisualizer; 