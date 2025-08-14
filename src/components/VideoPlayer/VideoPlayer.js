import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';

const VideoPlayer = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hasNavigatedRef = useRef(false);
  const [videoUrl, setVideoUrl] = useState('/City/Video/Video.mp4'); // fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPreparingHotspots, setIsPreparingHotspots] = useState(false);
  const [prepMessage, setPrepMessage] = useState('');

  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (!city) {
        setError("No city specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const sanitizedCity = city.toLowerCase().trim();

        // Prefer pre-fetched object URL if present
        if (typeof window !== 'undefined' && window.cityVideoUrls && window.cityVideoUrls[sanitizedCity]) {
          setVideoUrl(window.cityVideoUrls[sanitizedCity]);
          setLoading(false);
          return;
        }

        // Fetch cached video list
        const cityData = await ApiService.getCityData(sanitizedCity);

        if (cityData && cityData.videos && cityData.videos.length > 0) {
          console.log(`Using API video for ${sanitizedCity}:`, cityData.videos[0]);
          setVideoUrl(cityData.videos[0]);
        } else {
          console.log(`No API video for ${sanitizedCity}, using fallback`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError(`Failed to load video for ${city}`);
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [city]);

  useEffect(() => {
    // Auto-play the video when component mounts and video URL is ready
    if (videoRef.current && !loading) {
      videoRef.current.load(); // Reload video with new source
      videoRef.current.play().catch(error => {
        console.log('Auto-play failed:', error);
      });
    }
  }, [videoUrl, loading]);

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
      const sanitizedCity = city.toLowerCase().trim();
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
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="px-4 py-2 rounded-lg bg-black/40 text-white text-sm backdrop-blur-sm">
            Loading video...
          </div>
        </div>
      )}
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
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        muted
        playsInline
        style={{
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none'
        }}
      >
        <source src={videoUrl} type="video/mp4" />
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