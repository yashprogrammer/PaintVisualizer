// API service for communicating with ColorsWorld backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:15205/api/v1';
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('Raw API response:', response.data);
    
    // Check if response has the expected ColorsWorld API structure
    // The actual structure is: {status: 'Success', message: '...', payload: {data: [...]}}
    if (response.data.status === 'Success') {
      // Return the actual data from payload.data
      return response.data.payload?.data || response.data.payload;
    } else {
      throw new Error(response.data.message || 'API request failed');
    }
  },
  (error) => {
    console.error('API request failed:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

// Utility: normalize external city inputs to canonical slugs
const normalizeCitySlug = (input) => {
  if (!input || typeof input !== 'string') return '';
  const slug = input.toLowerCase().replace(/['\s-]+/g, '').trim();
  if (slug === 'ldweep' || slug === 'lakshadweep') return 'lakshwadeep';
  return slug;
};

class ApiService {
  // Cache for storing API data to avoid repeated calls
  static _countriesCache = null;
  static _cacheTimestamp = null;
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  // Keys used for persisting API results in localStorage so we can reuse them across app sessions
  static LOCAL_STORAGE_KEY = 'countriesData';
  static LOCAL_STORAGE_TS_KEY = 'countriesDataTimestamp';

  /**
   * Fetch all countries with their color palettes and hotspots
   * @returns {Promise<Array>} Array of country objects
   */
  static async getCountries() {
    try {
      const now = Date.now();

      // 1) In-memory cache
      if (this._countriesCache && this._cacheTimestamp && (now - this._cacheTimestamp) < this.CACHE_DURATION) {
        console.log('Using in-memory cached countries');
        return this._countriesCache;
      }

      // 2) Check localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        const storedTsStr = localStorage.getItem(this.LOCAL_STORAGE_TS_KEY);
        const storedTs = storedTsStr ? parseInt(storedTsStr, 10) : null;

        if (storedJson) {
          try {
            const parsed = JSON.parse(storedJson);

            if (storedTs && (now - storedTs) < this.CACHE_DURATION) {
              console.log('Loaded countries from localStorage');
              this._countriesCache = parsed;
              this._cacheTimestamp = storedTs;
              return parsed;
            }
          } catch (e) {
            console.warn('Failed to parse countries from localStorage, will fetch fresh', e);
          }
        }
      }

      // 3) Fetch from backend
      console.log('Fetching countries from backend…');
      const data = await apiClient.get('/countries');
      console.log('Fetched', data.length, 'countries');

      // Update caches
      this._countriesCache = data;
      this._cacheTimestamp = now;

      // Persist to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(this.LOCAL_STORAGE_TS_KEY, now.toString());
          console.log('Countries data saved to localStorage');
        } catch (e) {
          console.warn('Failed to save countries to localStorage', e);
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  /**
   * Get country data by name
   * @param {string} countryName - Country name
   * @returns {Promise<Object>} Country object
   */
  static async getCountryByName(countryName) {
    const countries = await this.getCountries();
    const country = countries.find(country => 
      country.name.toLowerCase() === countryName.toLowerCase()
    );
    
    if (!country) {
      throw new Error(`Country "${countryName}" not found in API data`);
    }
    
    return country;
  }

  /**
   * Transform backend country data to frontend format
   * @param {Object} backendCountry - Country data from backend
   * @returns {Object} Formatted country data for frontend
   */
  static transformCountryData(backendCountry) {
    // Normalize to canonical slug (maps ldweep/l'dweep/lakshadweep -> lakshwadeep)
    const normalizedName = backendCountry.name.toLowerCase().replace(/'/g, '');
    const cityKey = normalizeCitySlug(normalizedName);

    // Transform hotspots from the combined vibrant and calm colors
    // Note: The x,y coordinates from backend are in pixels, convert to percentages
    // Based on the coordinate values we see (max x: ~3272, max y: ~1803), adjusting reference dimensions
    const REFERENCE_WIDTH = 3500; // Adjusted based on coordinate analysis
    const REFERENCE_HEIGHT = 2000; // Adjusted based on coordinate analysis
    
    const hotspots = backendCountry.hotspots?.map(hotspot => ({
      id: hotspot.color_id || hotspot._id,
      name: hotspot.name,
      color: hotspot.color,
      x: `${(hotspot.x / REFERENCE_WIDTH * 100).toFixed(1)}%`,
      y: `${(hotspot.y / REFERENCE_HEIGHT * 100).toFixed(1)}%`
    })) || [];

    // If the backend did not provide hotspot coordinates (common for non-France data at the moment),
    // create a temporary set of mock hotspots so the UI can still function.
    let finalHotspots = hotspots;

    if (finalHotspots.length === 0) {
      const combinedColors = [
        ...(backendCountry.color_pallets?.vibrant || []),
        ...(backendCountry.color_pallets?.calm || []),
      ];

      // Pick up to 4 colors to create placeholder hotspots.
      const fallbackColors = combinedColors.slice(0, 4);

      // Pre-defined coordinates (percentage values) spread around the image.
      const fallbackPositions = [
        { x: '30%', y: '35%' },
        { x: '65%', y: '28%' },
        { x: '45%', y: '65%' },
        { x: '75%', y: '55%' },
      ];

      finalHotspots = fallbackColors.map((c, idx) => ({
        id: c.color_id || `mock-${idx}`,
        name: c.name || `Shade ${idx + 1}`,
        color: c.color,
        x: fallbackPositions[idx]?.x || '50%',
        y: fallbackPositions[idx]?.y || '50%',
      }));
    }

    // Extract color palettes
    const vibrantColors = backendCountry.color_pallets?.vibrant?.map(color => color.color) || [];
    const calmColors = backendCountry.color_pallets?.calm?.map(color => color.color) || [];

    // Dynamically construct hotspot image path based on country name.
    // Strategy: Use the **last** word of the name (so "Tropical Bali" -> "Bali.png").
    const words = backendCountry.name.split(/\s+/);
    const lastWord = words[words.length - 1].replace(/[^a-zA-Z]/g, '');
    const hotspotImageUrl = `/City/Hotspot/${lastWord}.png`;
    const videoUrl = "/City/Video/Video.mp4";

    console.log(`Transforming ${backendCountry.name} data:`, {
      hotspotImage: hotspotImageUrl,
      video: videoUrl,
      hotspotsCount: finalHotspots.length,
      vibrantColorsCount: vibrantColors.length,
      calmColorsCount: calmColors.length,
      sampleHotspot: finalHotspots[0] // Log first hotspot for debugging
    });

    return {
      [cityKey]: {
        name: backendCountry.name,
        hotspotImage: hotspotImageUrl,
        videos: [videoUrl],
        hotspots: finalHotspots,
        colorPalettes: {
          vibrant: vibrantColors.length > 0 ? vibrantColors : [],
          calm: calmColors.length > 0 ? calmColors : []
        }
      }
    };
  }

  /**
   * Get all countries formatted for the frontend
   * @returns {Promise<Object>} Cities data object
   */
  static async getFormattedCountries() {
    const countries = await this.getCountries();
    
    let citiesData = {};
    
    countries.forEach(country => {
      const transformedData = this.transformCountryData(country);
      citiesData = { ...citiesData, ...transformedData };
    });

    return citiesData;
  }

  static async getCityData(requestedName) {
    const slug = normalizeCitySlug(requestedName);
    const formatted = await this.getFormattedCountries();
  
    // 1) Direct match
    if (formatted[slug]) {
      const data = { ...formatted[slug] };
  
      // Ensure hotspotImage isn't the default image.png
      if (data.hotspotImage?.endsWith('/image.png')) {
        const lastWord = data.name.split(/\s+/).pop().replace(/[^a-zA-Z]/g, '');
        data.hotspotImage = `/City/Hotspot/${lastWord}.png`;
      }
  
      // Ensure Lakshwadeep hotspot path is correct
      if (slug === 'lakshwadeep') {
        data.hotspotImage = "/City/Hotspot/Lakshwadeep.png";
      }
  
      return data; // ✅ return on exact match
    }
  
    // 2) Fuzzy key match (ignore spaces)
    const stripSpaces = (s) => s.replace(/\s+/g, '');
    const slugNoSpace = stripSpaces(slug);
  
    const matchedKey = Object.keys(formatted).find((k) =>
      stripSpaces(k).includes(slugNoSpace)
    );
    if (matchedKey) {
      return formatted[matchedKey];
    }
  
    // 3) Safety net: alias fallback for known cases like L'Dweep/Lakshadweep → lakshwadeep
    const aliasMap = { ldweep: 'lakshwadeep', lakshadweep: 'lakshwadeep' };
    const aliasKey = aliasMap[slug];
    if (aliasKey && formatted[aliasKey]) {
      const fallback = { ...formatted[aliasKey] };
      if (!fallback.hotspotImage || fallback.hotspotImage.endsWith('/image.png')) {
        fallback.hotspotImage = "/City/Hotspot/Lakshwadeep.png";
      }
      return fallback;
    }
  
    // 4) Nothing found
    throw new Error(`City "${requestedName}" not found in cached data`);
  }
  


}

export default ApiService;
