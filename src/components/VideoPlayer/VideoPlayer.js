import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VideoPlayer = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    // Auto-play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play failed:', error);
      });
    }
  }, []);

  const handleVideoEnd = () => {
    // Navigate to hotspots selection after video ends
    navigate(`/hotspots/${city}`);
  };

  const handleVideoClick = () => {
    // Allow users to skip video by clicking
    navigate(`/hotspots/${city}`);
  };

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
        {/* For now, using the single video file. Later can be dynamic based on city */}
        <source src="/City/Video/Video.mp4" type="video/mp4" />
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