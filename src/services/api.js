// API service for communicating with ColorsWorld backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:15205/api/v1';

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

class ApiService {
  // Cache for storing API data to avoid repeated calls
  static _countriesCache = null;
  static _cacheTimestamp = null;
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all countries with their color palettes and hotspots
   * @returns {Promise<Array>} Array of country objects
   */
  static async getCountries() {
    try {
      // Check if we have cached data that's still valid
      const now = Date.now();
      if (this._countriesCache && this._cacheTimestamp && 
          (now - this._cacheTimestamp) < this.CACHE_DURATION) {
        console.log('Using cached API data (cached', Math.round((now - this._cacheTimestamp) / 1000), 'seconds ago)');
        return this._countriesCache;
      }

      console.log('Fetching fresh API data...');
      const data = await apiClient.get('/countries');
      console.log('Fresh API data received:', data.length, 'countries');
      
      // Store in cache
      this._countriesCache = data;
      this._cacheTimestamp = now;
      console.log('Data cached successfully');
      
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
    // Handle special case for L'Dweep naming
    const normalizedName = backendCountry.name.toLowerCase().replace(/'/g, '');
    const cityKey = normalizedName === 'ldweep' ? 'ldweep' : normalizedName;

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

    // Extract color palettes
    const vibrantColors = backendCountry.color_pallets?.vibrant?.map(color => color.color) || [];
    const calmColors = backendCountry.color_pallets?.calm?.map(color => color.color) || [];

    // Use static images for now
    const hotspotImageUrl = "/City/Hotspot/image.png";
    const videoUrl = "/City/Video/Video.mp4";

    console.log(`Transforming ${backendCountry.name} data:`, {
      hotspotImage: hotspotImageUrl,
      video: videoUrl,
      hotspotsCount: hotspots.length,
      vibrantColorsCount: vibrantColors.length,
      calmColorsCount: calmColors.length,
      sampleHotspot: hotspots[0] // Log first hotspot for debugging
    });

    return {
      [cityKey]: {
        name: backendCountry.name,
        hotspotImage: hotspotImageUrl,
        videos: [videoUrl],
        hotspots: hotspots,
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
}

export default ApiService;
