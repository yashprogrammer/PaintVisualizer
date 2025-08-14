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
      // Still keep the dynamic viewport height var updated for better layout
      const updateViewportHeight = () => {
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-dvh', `${height}px`);
      };
      updateViewportHeight();
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportHeight);
      }
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', updateViewportHeight);
        }
      };
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

    const lockLandscape = () => {
      try {
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
          screen.orientation.lock('landscape').catch(() => {});
        } else if (screen.lockOrientation) {
          screen.lockOrientation('landscape');
        }
      } catch (_) {}
    };

    const supportsFullscreen = () =>
      candidates.some((el) => typeof getRequestFn(el) === 'function');

    const requestFullscreen = () => {
      if (isFullscreenActive()) {
        lockLandscape();
        return;
      }
      for (const el of candidates) {
        const fn = getRequestFn(el);
        if (typeof fn === 'function') {
          try {
            const maybePromise = fn.length > 0 ? fn.call(el, { navigationUI: 'hide' }) : fn.call(el);
            if (maybePromise && typeof maybePromise.then === 'function') {
              maybePromise.then(() => { lockLandscape(); }).catch(() => {});
            } else {
              lockLandscape();
            }
            return;
          } catch (_) {
            // ignore and try next candidate
          }
        }
      }
    };

    const nudgeScroll = () => {
      try { window.scrollTo(0, 1); } catch (_) {}
    };

    const updateViewportHeight = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-dvh', `${height}px`);
    };

    const rearmIfNeeded = () => {
      if (!isFullscreenActive()) {
        doc.addEventListener('pointerdown', onFirstInteraction, { once: true });
        doc.addEventListener('click', onFirstInteraction, { once: true });
        doc.addEventListener('touchstart', onFirstInteraction, { once: true });
        doc.addEventListener('touchend', onFirstInteraction, { once: true });
        doc.addEventListener('keydown', onFirstInteraction, { once: true });
        window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
      }
    };

    const onFirstInteraction = () => {
      requestFullscreen();
      nudgeScroll();
      doc.removeEventListener('pointerdown', onFirstInteraction);
      doc.removeEventListener('click', onFirstInteraction);
      doc.removeEventListener('touchstart', onFirstInteraction);
      doc.removeEventListener('touchend', onFirstInteraction);
      doc.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };

    if (!supportsFullscreen()) {
      // Still keep dynamic height updated even if fullscreen API is not supported
      updateViewportHeight();
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportHeight);
      }
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', updateViewportHeight);
        }
      };
    }

    // Initial attempts
    updateViewportHeight();
    requestFullscreen();
    nudgeScroll();

    // First-gesture listeners
    doc.addEventListener('pointerdown', onFirstInteraction, { once: true });
    doc.addEventListener('click', onFirstInteraction, { once: true });
    doc.addEventListener('touchstart', onFirstInteraction, { once: true });
    doc.addEventListener('touchend', onFirstInteraction, { once: true });
    doc.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });

    // Re-try hooks
    const onFullscreenChange = () => rearmIfNeeded();
    doc.addEventListener('fullscreenchange', onFullscreenChange);
    doc.addEventListener('webkitfullscreenchange', onFullscreenChange);
    doc.addEventListener('MSFullscreenChange', onFullscreenChange);

    const onOrientation = () => { updateViewportHeight(); requestFullscreen(); nudgeScroll(); };
    window.addEventListener('orientationchange', onOrientation);
    window.addEventListener('pageshow', requestFullscreen);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFullscreen(); });

    window.addEventListener('resize', updateViewportHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      doc.removeEventListener('pointerdown', onFirstInteraction);
      doc.removeEventListener('click', onFirstInteraction);
      doc.removeEventListener('touchstart', onFirstInteraction);
      doc.removeEventListener('touchend', onFirstInteraction);
      doc.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
      doc.removeEventListener('fullscreenchange', onFullscreenChange);
      doc.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      doc.removeEventListener('MSFullscreenChange', onFullscreenChange);
      window.removeEventListener('orientationchange', onOrientation);
      window.removeEventListener('pageshow', requestFullscreen);
      document.removeEventListener('visibilitychange', () => { if (!document.hidden) requestFullscreen(); });
      window.removeEventListener('resize', updateViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  return (
    <div className="fullscreen-container">
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