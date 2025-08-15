import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';

const HotspotSelector = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [usingApiData, setUsingApiData] = useState(true); // Always using API data now
  const [filteredHotspots, setFilteredHotspots] = useState([]);

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

      // If we were navigated with preloaded data, use it and skip fetching
      if (location.state && location.state.cityData) {
        setCityData(location.state.cityData);
        setLoading(false);
        if (location.state.imagePreloaded) {
          setImageLoaded(true);
        }
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
  }, [city, location.state]);

  // Compute a filtered list of hotspots where overlapping points are deduplicated
  useEffect(() => {
    if (!cityData?.hotspots || cityData.hotspots.length === 0) {
      setFilteredHotspots([]);
      return;
    }

    const computeFiltered = () => {
      const hasWindow = typeof window !== 'undefined';
      const viewportWidth = hasWindow ? window.innerWidth : 1920;
      const viewportHeight = hasWindow ? window.innerHeight : 1080;

      // Approximate visual diameter of hotspot circle including border
      const HOTSPOT_DIAMETER_PX = 40;
      const PROXIMITY_PX = HOTSPOT_DIAMETER_PX * 0.8; // hide if centers are closer than this

      const toPx = (value, total) => {
        if (typeof value === 'number') return value; // assume already px
        if (typeof value === 'string') {
          const num = parseFloat(value);
          if (Number.isNaN(num)) return 0;
          return value.includes('%') ? (num / 100) * total : num;
        }
        return 0;
      };

      const result = [];
      cityData.hotspots.forEach((hotspot) => {
        const xPx = toPx(hotspot.x, viewportWidth);
        const yPx = toPx(hotspot.y, viewportHeight);

        const overlaps = result.some((kept) => {
          const keptXPx = toPx(kept.x, viewportWidth);
          const keptYPx = toPx(kept.y, viewportHeight);
          const dx = xPx - keptXPx;
          const dy = yPx - keptYPx;
          return Math.hypot(dx, dy) < PROXIMITY_PX;
        });

        if (!overlaps) {
          result.push(hotspot);
        }
      });

      setFilteredHotspots(result);
    };

    computeFiltered();

    // Recompute on resize so proximity in pixels stays accurate
    const onResize = () => computeFiltered();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cityData]);

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

  // No full-screen black loader; show lightweight transparent overlay at render time

  // Error banner overlay instead of page swap

  const hotspotsToRender = cityData?.hotspots
    ? ((filteredHotspots && filteredHotspots.length > 0)
      ? filteredHotspots
      : cityData.hotspots)
    : [];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="px-4 py-2 rounded-lg bg-black/40 text-white text-sm backdrop-blur-sm">
            Loading hotspots...
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
      {/* Background Image */}
      <div className="absolute inset-0">
        {cityData?.hotspotImage && (
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
        )}
        {!imageLoaded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="px-4 py-2 rounded-lg bg-black/40 text-white text-sm backdrop-blur-sm">Loading image...</div>
          </div>
        )}
      </div>

      

      {/* Hotspots */}
      {hotspotsToRender.map((hotspot) => (
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
        <div 
          className="bg-white backdrop-blur-md rounded-lg px-8 py-2 border-2 border-white shadow-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}
        >
         <p className="text-black text-xl font-bold tracking-widest text-center font-brand">
            TAP A PAINT TONE HOTSPOT TO CONTINUE
          </p>
        </div> 
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <button 
          onClick={() => navigate(`/city-selection`)}
          className="bg-black bg-opacity-50 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-opacity-70 transition-colors"
          aria-label="Go back to video"
        >
          ←
        </button>
      </div>

     
    </div>
  );
};

export default HotspotSelector;