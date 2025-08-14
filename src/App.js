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
    const doc = document;

    // If already running as an installed app (PWA standalone), skip forcing fullscreen
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = typeof window.navigator.standalone === 'boolean' && window.navigator.standalone;
    if (isStandalone || isIOSStandalone) {
      return undefined;
    }

    const candidates = [
      document.documentElement,
      document.body,
      document.getElementById('root')
    ].filter(Boolean);

    const getRequestFn = (el) =>
      el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;

    const isFullscreenActive = () =>
      Boolean(
        doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.msFullscreenElement
      );

    const supportsFullscreen = () =>
      candidates.some((el) => typeof getRequestFn(el) === 'function');

    const requestFullscreen = () => {
      if (isFullscreenActive()) return;
      for (const el of candidates) {
        const fn = getRequestFn(el);
        if (typeof fn === 'function') {
          try {
            const maybePromise = fn.length > 0 ? fn.call(el, { navigationUI: 'hide' }) : fn.call(el);
            if (maybePromise && typeof maybePromise.then === 'function') {
              maybePromise.catch(() => {});
            }
            return;
          } catch (_) {
            // ignore and try next candidate
          }
        }
      }
    };

    if (!supportsFullscreen()) {
      return undefined;
    }

    // Attempt immediately (may be blocked without a user gesture)
    requestFullscreen();

    const onFirstInteraction = () => {
      requestFullscreen();
      doc.removeEventListener('pointerdown', onFirstInteraction);
      doc.removeEventListener('click', onFirstInteraction);
      doc.removeEventListener('touchstart', onFirstInteraction);
      doc.removeEventListener('touchend', onFirstInteraction);
      doc.removeEventListener('keydown', onFirstInteraction);
    };

    doc.addEventListener('pointerdown', onFirstInteraction, { once: true });
    doc.addEventListener('click', onFirstInteraction, { once: true });
    doc.addEventListener('touchstart', onFirstInteraction, { once: true });
    doc.addEventListener('touchend', onFirstInteraction, { once: true });
    doc.addEventListener('keydown', onFirstInteraction, { once: true });

    const onFullscreenChange = () => {
      if (!isFullscreenActive()) {
        // Re-arm so the next interaction returns to fullscreen
        doc.addEventListener('pointerdown', onFirstInteraction, { once: true });
        doc.addEventListener('click', onFirstInteraction, { once: true });
        doc.addEventListener('touchstart', onFirstInteraction, { once: true });
        doc.addEventListener('touchend', onFirstInteraction, { once: true });
        doc.addEventListener('keydown', onFirstInteraction, { once: true });
      }
    };

    doc.addEventListener('fullscreenchange', onFullscreenChange);
    doc.addEventListener('webkitfullscreenchange', onFullscreenChange);
    doc.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      doc.removeEventListener('pointerdown', onFirstInteraction);
      doc.removeEventListener('click', onFirstInteraction);
      doc.removeEventListener('touchstart', onFirstInteraction);
      doc.removeEventListener('touchend', onFirstInteraction);
      doc.removeEventListener('keydown', onFirstInteraction);
      doc.removeEventListener('fullscreenchange', onFullscreenChange);
      doc.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      doc.removeEventListener('MSFullscreenChange', onFullscreenChange);
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