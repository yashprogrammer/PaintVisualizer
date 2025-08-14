import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import CitySelector from './components/CitySelector/CitySelector';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import HotspotSelector from './components/HotspotSelector/HotspotSelector';
import RoomVisualizer from './components/RoomVisualizer/RoomVisualizer';

function App() {
  useEffect(() => {
    const documentRef = document;
    const rootElement = document.documentElement;

    const isFullscreenActive = () => {
      return Boolean(
        documentRef.fullscreenElement ||
          documentRef.webkitFullscreenElement ||
          documentRef.msFullscreenElement
      );
    };

    const supportsFullscreen = () => {
      return Boolean(
        rootElement.requestFullscreen ||
          rootElement.webkitRequestFullscreen ||
          rootElement.msRequestFullscreen
      );
    };

    const requestFullscreen = () => {
      if (isFullscreenActive()) return;
      const requestFn =
        rootElement.requestFullscreen ||
        rootElement.webkitRequestFullscreen ||
        rootElement.msRequestFullscreen;
      if (typeof requestFn !== 'function') return;
      try {
        const maybePromise = requestFn.call(rootElement);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch(() => {});
        }
      } catch (error) {
        // Silently ignore failures (browser may require a user gesture)
      }
    };

    if (!supportsFullscreen()) {
      return undefined;
    }

    // Attempt immediately (may be blocked without a user gesture)
    requestFullscreen();

    const onFirstInteraction = () => {
      requestFullscreen();
      documentRef.removeEventListener('pointerdown', onFirstInteraction);
      documentRef.removeEventListener('keydown', onFirstInteraction);
      documentRef.removeEventListener('touchend', onFirstInteraction);
    };

    documentRef.addEventListener('pointerdown', onFirstInteraction, { once: true });
    documentRef.addEventListener('keydown', onFirstInteraction, { once: true });
    documentRef.addEventListener('touchend', onFirstInteraction, { once: true });

    const onFullscreenChange = () => {
      if (!isFullscreenActive()) {
        // Re-arm so the next interaction returns to fullscreen
        documentRef.addEventListener('pointerdown', onFirstInteraction, { once: true });
        documentRef.addEventListener('keydown', onFirstInteraction, { once: true });
        documentRef.addEventListener('touchend', onFirstInteraction, { once: true });
      }
    };

    documentRef.addEventListener('fullscreenchange', onFullscreenChange);
    documentRef.addEventListener('webkitfullscreenchange', onFullscreenChange);
    documentRef.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      documentRef.removeEventListener('pointerdown', onFirstInteraction);
      documentRef.removeEventListener('keydown', onFirstInteraction);
      documentRef.removeEventListener('touchend', onFirstInteraction);
      documentRef.removeEventListener('fullscreenchange', onFullscreenChange);
      documentRef.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      documentRef.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

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