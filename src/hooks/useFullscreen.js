import { useCallback, useEffect, useRef, useState } from 'react';

export function useFullscreen() {
  const ref = useRef(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const el =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
      setIsFs(!!el);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    document.addEventListener('MSFullscreenChange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      document.removeEventListener('MSFullscreenChange', onChange);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current || document.documentElement;
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen;
    if (req) {
      await req.call(el);
      try {
        await screen.orientation?.lock?.('landscape');
      } catch (e) {}
      return;
    }
    throw new Error('Fullscreen API not supported on this device/browser.');
  }, []);

  const exit = useCallback(async () => {
    const exitFn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (exitFn) await exitFn.call(document);
    try {
      await screen.orientation?.unlock?.();
    } catch (e) {}
  }, []);

  return { ref, isFs, enter, exit };
}


