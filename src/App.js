import React, { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import CitySelector from './components/CitySelector/CitySelector';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import HotspotSelector from './components/HotspotSelector/HotspotSelector';
import RoomVisualizer from './components/RoomVisualizer/RoomVisualizer';
import { useFullscreen } from './hooks/useFullscreen';
import { useFirstInteraction } from './hooks/useFirstInteraction';

function App() {
  const { ref, isFs, enter, exit } = useFullscreen();
  const hasInteracted = useFirstInteraction();
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const location = useLocation();
  const isWelcome = location.pathname === '/';
  const [isBtnVisible, setIsBtnVisible] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasInteracted && !isTouch && !isFs) {
      enter().catch(() => {});
    }
  }, [hasInteracted, isFs, enter]);

  // Control visibility of the fullscreen button on mobile/touch devices
  useEffect(() => {
    if (!isTouchDevice) {
      setIsBtnVisible(false);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }
    if (isWelcome) {
      setIsBtnVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }

    setIsBtnVisible(false);

    let startY = null;
    const opts = { passive: true };

    const showTransient = () => {
      setIsBtnVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsBtnVisible(false);
        hideTimerRef.current = null;
      }, 2000);
    };

    function onTouchStart(e) {
      if (!e.touches || e.touches.length === 0) return;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (startY == null || !e.touches || e.touches.length === 0) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 10) showTransient();
    }

    function onWheel(e) {
      if (e.deltaY > 0) showTransient();
    }

    function onScroll() {
      if (window.scrollY > 0) showTransient();
    }

    window.addEventListener('touchstart', onTouchStart, opts);
    window.addEventListener('touchmove', onTouchMove, opts);
    window.addEventListener('wheel', onWheel, opts);
    window.addEventListener('scroll', onScroll, opts);

    return () => {
      window.removeEventListener('touchstart', onTouchStart, opts);
      window.removeEventListener('touchmove', onTouchMove, opts);
      window.removeEventListener('wheel', onWheel, opts);
      window.removeEventListener('scroll', onScroll, opts);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isTouchDevice, isWelcome, location.pathname]);

  return (
    <div ref={ref} className="app-root">
      {isTouchDevice && (
        <button
          className={`fs-btn ${isBtnVisible ? 'is-visible' : 'is-hidden'}`}
          aria-label={isFs ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          onClick={isFs ? exit : enter}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/city-selection" element={<CitySelector />} />
        <Route path="/video/:city" element={<VideoPlayer />} />
        <Route path="/hotspots/:city" element={<HotspotSelector />} />
        <Route path="/visualizer/:city/:color" element={<RoomVisualizer />} />
      </Routes>
    </div>
  );
}

export default App;