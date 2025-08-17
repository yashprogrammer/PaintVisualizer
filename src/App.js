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
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // iOS detection: iOS <= 15 cannot use Element Fullscreen API
  const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
  const iosMajorVersion = parseInt((navigator.userAgent.match(/OS (\d+)_/) || [])[1] || '16', 10);
  const isOldIOS = isIOS && iosMajorVersion < 16;
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;

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

  const handleFsClick = () => {
    // iOS ≤ 15 cannot enter true app fullscreen; guide user to PWA instead
    if (isOldIOS && !isStandalone) {
      setShowIOSHelp(true);
      return;
    }
    if (isFs) {
      exit();
    } else {
      enter();
    }
  };

  return (
    <div ref={ref} className="app-root">
      {isTouchDevice && (
        <button
          className={`fs-btn ${isBtnVisible ? 'is-visible' : 'is-hidden'}`}
          aria-label={isFs ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          onClick={handleFsClick}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* iOS ≤ 15 helper overlay: instruct Add to Home Screen for a chrome-less experience */}
      {showIOSHelp && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            style={{
              width: 'min(640px, 92vw)',
              background: '#111',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '18px 16px 14px 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Fullscreen on older iOS</h2>
              <button
                aria-label="Close"
                onClick={() => setShowIOSHelp(false)}
                style={{ background: 'transparent', border: 0, color: '#fff', padding: 6, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '8px 0 12px 0', lineHeight: 1.6, opacity: 0.95 }}>
              This device doesn’t support app fullscreen in the browser. To get a true fullscreen experience, add this app to your Home Screen and launch it from there.
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, opacity: 0.95 }}>
              <li>Tap the Share icon in Safari.</li>
              <li>Choose “Add to Home Screen”.</li>
              <li>Open it from your Home Screen for fullscreen.</li>
            </ol>
            <p style={{ margin: '12px 0 0 0', opacity: 0.85, fontSize: 13 }}>
              Tip: In in‑app browsers (e.g., Instagram/FB), open in Safari first.
            </p>
          </div>
        </div>
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