import React from 'react';

function ColorPicker({ activeColor, onColorChange }) {
  const swatches = ['#86B6F6', '#B2C8BA', '#F4EAD5', '#9DBC98', '#638889'];

  return (
    <div className="color-picker-container">
      <label>Select Color:</label>
      <input
        type="color"
        value={activeColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="color-input"
      />
      <div className="swatches">
        {swatches.map((swatch) => (
          <div
            key={swatch}
            className="swatch"
            style={{ backgroundColor: swatch }}
            onClick={() => onColorChange(swatch)}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorPicker; 