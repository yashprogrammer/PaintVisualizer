import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import Hls from 'hls.js';

const VideoPlayer = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hasNavigatedRef = useRef(false);
  const hlsRef = useRef(null);
  const mp4FallbackRef = useRef('/City/Video/Video.mp4');
  const [playbackSource, setPlaybackSource] = useState({ type: 'mp4', url: '/City/Video/Video.mp4' });
  const mp4FallbackTriedDefaultRef = useRef(false);
  const [error, setError] = useState(null);
  const [isPreparingHotspots, setIsPreparingHotspots] = useState(false);
  const [prepMessage, setPrepMessage] = useState('');

  useEffect(() => {
    const fetchAndSelectSource = async () => {
      if (!city) {
        setError('No city specified');
        setLoading(false);
        return;
      }

      try {
        const sanitizedCity = city.toLowerCase().replace(/'/g, '').trim();

        // Determine MP4 fallback candidates
        let fallbackMp4 = mp4FallbackRef.current || '/City/Video/Video.mp4';
        if (typeof window !== 'undefined' && window.cityVideoUrls && window.cityVideoUrls[sanitizedCity]) {
          fallbackMp4 = window.cityVideoUrls[sanitizedCity];
        } else {
          try {
            const cityData = await ApiService.getCityData(sanitizedCity);
            if (cityData && cityData.videos && cityData.videos.length > 0) {
              console.log(`Using API video for ${sanitizedCity}:`, cityData.videos[0]);
              fallbackMp4 = cityData.videos[0];
            } else {
              console.log(`No API video for ${sanitizedCity}, using fallback MP4`);
            }
            // Prefer per-city MP4 in public/City/Video/<CityName>.mp4 when available by convention
            if (cityData && cityData.name) {
              const encodedName = encodeURIComponent(cityData.name);
              fallbackMp4 = `/City/Video/${encodedName}.mp4`;
            }
          } catch (apiErr) {
            console.warn('API video lookup failed; will use default MP4 fallback.', apiErr);
          }
        }

        mp4FallbackRef.current = fallbackMp4;

        // Prefer HLS path for the city; rely on runtime fallback if unavailable
        const hlsUrl = `/videos/${sanitizedCity}/master.m3u8`;
        setPlaybackSource({ type: 'hls', url: hlsUrl });
        // Note: loading will be set to false when HLS is ready or we fallback to MP4
      } catch (err) {
        console.error('Error preparing video sources:', err);
        setError(`Failed to load video for ${city}`);
        setPlaybackSource({ type: 'mp4', url: mp4FallbackRef.current || '/City/Video/Video.mp4' });
      }
    };

    fetchAndSelectSource();
  }, [city]);

  // Attach HLS or use native/Safari HLS, otherwise fall back to MP4
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS instance if any
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (_) {}
      hlsRef.current = null;
    }

    if (playbackSource.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(playbackSource.url);
        hls.attachMedia(video);
        const onManifestParsed = () => {
          video.play().catch((e) => console.log('Auto-play failed (HLS):', e));
        };
        const onError = (_event, data) => {
          if (data && data.fatal) {
            try { hls.destroy(); } catch (_) {}
            hlsRef.current = null;
            setPlaybackSource({ type: 'mp4', url: mp4FallbackRef.current || '/City/Video/Video.mp4' });
            setLoading(false);
          }
        };
        hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        hls.on(Hls.Events.ERROR, onError);

        return () => {
          hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          hls.off(Hls.Events.ERROR, onError);
          try { hls.destroy(); } catch (_) {}
          hlsRef.current = null;
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        const onLoadedMetadata = () => {
          video.play().catch((e) => console.log('Auto-play failed (Safari HLS):', e));
        };
        const onError = () => {
          setPlaybackSource({ type: 'mp4', url: mp4FallbackRef.current || '/City/Video/Video.mp4' });
        };
        video.src = playbackSource.url;
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
        return () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          try { video.removeAttribute('src'); video.load(); } catch (_) {}
        };
      } else {
        // No HLS support, fallback to MP4
        setPlaybackSource({ type: 'mp4', url: mp4FallbackRef.current || '/City/Video/Video.mp4' });
      }
    }
  }, [playbackSource]);

  // Auto-play for MP4 fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playbackSource.type === 'mp4') {
      try {
        video.load();
        video.play().catch((e) => console.log('Auto-play failed (MP4):', e));
      } catch (e) {
        console.log('Error starting MP4 playback:', e);
      }
    }
  }, [playbackSource]);

  // Handle video element errors (particularly for MP4 fallback path existence)
  const handleVideoElementError = () => {
    if (playbackSource.type !== 'mp4') return;
    // If per-city MP4 failed, try default shared MP4 once
    if (!mp4FallbackTriedDefaultRef.current && playbackSource.url !== '/City/Video/Video.mp4') {
      mp4FallbackTriedDefaultRef.current = true;
      setPlaybackSource({ type: 'mp4', url: '/City/Video/Video.mp4' });
    }
  };

  const preloadImage = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve();
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });
  };

  const prepareAndNavigateToHotspots = async () => {
    if (hasNavigatedRef.current || isPreparingHotspots) return;
    setIsPreparingHotspots(true);
    setPrepMessage('Preparing hotspots...');
    try {
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (_) {}
      }
      const sanitizedCity = city.toLowerCase().replace(/'/g, '').trim();
      const cityData = await ApiService.getCityData(sanitizedCity);
      setPrepMessage('Loading hotspot image...');
      await preloadImage(cityData?.hotspotImage);
      hasNavigatedRef.current = true;
      navigate(`/hotspots/${city}`, { state: { cityData, imagePreloaded: true } });
    } catch (e) {
      console.warn('Failed to prepare hotspots before navigation:', e);
      hasNavigatedRef.current = true;
      navigate(`/hotspots/${city}`);
    } finally {
      setIsPreparingHotspots(false);
      setPrepMessage('');
    }
  };

  const handleVideoEnd = () => {
    prepareAndNavigateToHotspots();
  };

  const handleVideoClick = () => {
    prepareAndNavigateToHotspots();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || hasNavigatedRef.current) return;
    if (videoRef.current.currentTime >= 4.5) {
      try { videoRef.current.pause(); } catch (_) {}
      prepareAndNavigateToHotspots();
    }
  };

  // No full-screen loader: keep page content, show overlay badge instead

  // Error banner overlay instead of page swap

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {isPreparingHotspots && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2 rounded-lg bg-black/40 text-white text-sm backdrop-blur-sm">
            {prepMessage || 'Loading hotspots...'}
          </div>
        </div>
      )}
      {/* Loading overlay removed per request */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600/80 text-white shadow-lg">
            <span>Error: {error}</span>
            <button
              onClick={() => navigate('/city-selection')}
              className="bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded"
            >
              Back
            </button>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoElementError}
        muted
        playsInline
        style={{
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none'
        }}
      >
        {playbackSource.type === 'mp4' && (
          <source src={playbackSource.url} type="video/mp4" />
        )}
        Your browser does not support the video tag.
      </video>
      {/* Skip indicator */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleVideoClick}
          className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          Skip →
        </button>
      </div>
      {/* City indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <span className="text-sm uppercase tracking-wider">
            {city} Experience
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;