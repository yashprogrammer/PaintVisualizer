import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';

const HotspotSelector = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [usingApiData, setUsingApiData] = useState(true); // Always using API data now

  useEffect(() => {
    const fetchCityData = async () => {
      // Validate and sanitize city parameter
      if (!city) {
        setError("No city specified");
        setLoading(false);
        return;
      }

      // Sanitize city name to prevent XSS and path traversal
      const sanitizedCity = city.replace(/[<>/"'&]/g, '').toLowerCase().trim();
      if (sanitizedCity !== city.toLowerCase().trim()) {
        setError("Invalid city parameter");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log(`Loading cached data for ${sanitizedCity}...`);

        const cityData = await ApiService.getCityData(sanitizedCity);
        
        
        if (cityData) {
          console.log(`Successfully loaded API data for ${sanitizedCity}:`, cityData);
          setCityData(cityData);
          setLoading(false);
          return;
        } else {
          setError(`No data found for ${sanitizedCity}`);
          setLoading(false);
          return;
        }
        
      } catch (error) {
        console.error('Error fetching city data:', error);
        setError(`Failed to load data for ${city}: ${error.message}`);
        setLoading(false);
      }
    };

    fetchCityData();
  }, [city]);

  const handleHotspotClick = (hotspot) => {
    if (!cityData || !hotspot) return;
    
    // Navigate to visualizer with city and color parameters
    // Using query parameter for color to maintain flexibility
    navigate(`/visualizer/${city.toLowerCase()}/${hotspot.id}?color=${encodeURIComponent(hotspot.color)}&name=${encodeURIComponent(hotspot.name)}`);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setError("Failed to load hotspot image");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading hotspots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="text-xl mb-4">Error: {error}</div>
        <div className="text-sm mb-4 opacity-70">
          Make sure the backend server is running on port 15205
        </div>
        <button 
          onClick={() => navigate('/city-selection')}
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Back to City Selection
        </button>
      </div>
    );
  }

  if (!cityData) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={cityData.hotspotImage}
          alt={`${cityData.name} hotspot selection`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-white text-lg">Loading image...</div>
          </div>
        )}
      </div>

      

      {/* Hotspots */}
      {cityData.hotspots.map((hotspot) => (
        <button
          key={hotspot.id}
          onClick={() => handleHotspotClick(hotspot)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
          style={{
            left: hotspot.x,
            top: hotspot.y,
          }}
          aria-label={`Select ${hotspot.name} color`}
          data-testid={`hotspot-${hotspot.id}`}
        >
          {/* Hotspot Circle */}
          <div 
            className="w-8 h-8 rounded-full border-4 border-white shadow-lg transform transition-all duration-300 group-hover:scale-125 group-hover:shadow-xl"
            style={{ 
              backgroundColor: hotspot.color,
              boxShadow: '0 0 20px rgba(255,255,255,0.5), inset 0 0 10px rgba(0,0,0,0.2)'
            }}
          >
            {/* Pulsing animation */}
            <div 
              className="absolute inset-0 rounded-full animate-ping"
              style={{ 
                backgroundColor: hotspot.color,
                opacity: 0.4 
              }}
            />
          </div>

          {/* Hotspot Label - appears on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm">
              {hotspot.name}
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-t-opacity-80"></div>
          </div>
        </button>
      ))}

      {/* Instructions */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-70 text-white px-8 py-4 rounded-lg backdrop-blur-sm">
          <p className="text-lg font-medium tracking-wide text-center">
            TAP A PAINT TONE HOTSPOT TO CONTINUE
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <button 
          onClick={() => navigate(`/video/${city}`)}
          className="bg-black bg-opacity-50 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-opacity-70 transition-colors"
          aria-label="Go back to video"
        >
          ←
        </button>
      </div>

      {/* City Name Display */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-70 text-white px-6 py-2 rounded-lg backdrop-blur-sm">
          <span className="text-lg font-semibold tracking-wider">
            {cityData.name.toUpperCase()}
          </span>
          {/* Data source indicator */}
          <div className="text-xs mt-1 opacity-70">
            {usingApiData ? '🌐 API Data' : '📁 Static Data'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotSelector;