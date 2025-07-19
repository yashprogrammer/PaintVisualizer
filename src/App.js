import React from 'react';
import { Route, Routes } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import CitySelector from './components/CitySelector/CitySelector';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import HotspotSelector from './components/HotspotSelector/HotspotSelector';
import RoomVisualizer from './components/RoomVisualizer/RoomVisualizer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/loading" element={<LoadingScreen />} />
      <Route path="/city-selection" element={<CitySelector />} />
      <Route path="/video/:city" element={<VideoPlayer />} />
      <Route path="/hotspots/:city" element={<HotspotSelector />} />
      <Route path="/visualizer/:city/:color" element={<RoomVisualizer />} />
    </Routes>
  );
}

export default App;