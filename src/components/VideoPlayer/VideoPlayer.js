import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';

const VideoPlayer = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('/City/Video/Video.mp4'); // fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (!city) {
        setError("No city specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch cached video list
        const sanitizedCity = city.toLowerCase().trim();
        const cityData = await ApiService.getCityData(sanitizedCity);

        if (cityData && cityData.videos && cityData.videos.length > 0) {
          console.log(`Using cached video for ${sanitizedCity}:`, cityData.videos[0]);
          setVideoUrl(cityData.videos[0]);
        } else {
          console.log(`No cached video for ${sanitizedCity}, using fallback`);
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

  const handleVideoEnd = () => {
    // Navigate to hotspots selection after video ends
    navigate(`/hotspots/${city}`);
  };

  const handleVideoClick = () => {
    // Allow users to skip video by clicking
    navigate(`/hotspots/${city}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => navigate('/city-selection')}
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Back to City Selection
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
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