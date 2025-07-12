import React, { useState } from 'react';
import RoomVisualizer from './components/RoomVisualizer';
import ColorPicker from './components/ColorPicker';
import './components/style.css';

const roomParts = [
  { id: 'wall1', name: 'Main Wall', mask: require('./assets/wall_1_mask.png') },
  { id: 'wall2', name: 'Right Wall', mask: require('./assets/wall_2_mask.png') },
  { id: 'wall3', name: 'Left Wall', mask: require('./assets/wall_3_mask.png') },
];

function App() {
  const [colors, setColors] = useState({
    wall1: '#e0e0e0',
    wall2: '#d1d1d1',
    wall3: '#f0f0f0',
  });
  const [selectedPart, setSelectedPart] = useState('wall1');

  const handleColorChange = (color) => {
    setColors({ ...colors, [selectedPart]: color });
  };

  return (
    <div className="app-container">
      <div className="visualizer-section">
        <RoomVisualizer
          parts={roomParts}
          colors={colors}
          onSelectPart={setSelectedPart}
          selectedPart={selectedPart}
        />
      </div>
      <div className="controls-section">
        <h2>Paint Visualizer POC</h2>
        <p>
          Selected: <strong>{roomParts.find(p => p.id === selectedPart)?.name}</strong>
        </p>
        <ColorPicker
          activeColor={colors[selectedPart]}
          onColorChange={handleColorChange}
        />
      </div>
    </div>
  );
}

export default App; 