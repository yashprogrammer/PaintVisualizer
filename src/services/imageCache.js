/**
 * Image Cache Service
 * Handles preloading, caching, and quality selection for room assets
 */

class ImageCacheService {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.networkQuality = 'medium'; // default to medium quality
    this.qualityDetected = false;
  }

  /**
   * Detect network bandwidth and set appropriate image quality
   */
  async detectNetworkQuality() {
    if (this.qualityDetected) return this.networkQuality;

    try {
      // Use Navigator API if available
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            this.networkQuality = 'low';
            break;
          case '3g':
            this.networkQuality = 'medium';
            break;
          case '4g':
          default:
            this.networkQuality = 'high';
            break;
        }
      } else {
        // Fallback: Download speed test with a small image
        const testImageUrl = '/optimized/Room/Bedroom/base-lqip.jpg';
        const startTime = performance.now();
        
        try {
          const response = await fetch(testImageUrl);
          if (response.ok) {
            const blob = await response.blob();
            const endTime = performance.now();
            const duration = endTime - startTime;
            const sizeKB = blob.size / 1024;
            const speedKBps = sizeKB / (duration / 1000);
            
            if (speedKBps > 500) {
              this.networkQuality = 'high';
            } else if (speedKBps > 100) {
              this.networkQuality = 'medium';
            } else {
              this.networkQuality = 'low';
            }
          }
        } catch (error) {
          console.warn('Network speed test failed, using medium quality:', error);
          this.networkQuality = 'medium';
        }
      }
    } catch (error) {
      console.warn('Network detection failed, using medium quality:', error);
      this.networkQuality = 'medium';
    }

    this.qualityDetected = true;
    console.log(`Network quality detected: ${this.networkQuality}`);
    return this.networkQuality;
  }

  /**
   * Build optimized asset paths based on quality
   */
  buildOptimizedPaths(originalSrc, targetQuality = null) {
    if (!originalSrc || typeof originalSrc !== 'string') {
      return { lqip: originalSrc, low: originalSrc, medium: originalSrc, high: originalSrc, original: originalSrc };
    }

    const lastDot = originalSrc.lastIndexOf('.');
    if (lastDot === -1) {
      return {
        lqip: `/optimized${originalSrc}-lqip.jpg`,
        low: `/optimized${originalSrc}-low`,
        medium: `/optimized${originalSrc}-med`,
        high: `/optimized${originalSrc}-high`,
        original: originalSrc
      };
    }

    const base = originalSrc.substring(0, lastDot);
    const ext = originalSrc.substring(lastDot);

    return {
      lqip: `/optimized${base}-lqip.jpg`,
      low: `/optimized${base}-low${ext}`,
      medium: `/optimized${base}-med${ext}`,
      high: `/optimized${base}-high${ext}`,
      original: originalSrc
    };
  }

  /**
   * Get the appropriate image source based on current network quality
   */
  getOptimalSrc(originalSrc, forceQuality = null) {
    const paths = this.buildOptimizedPaths(originalSrc);
    const quality = forceQuality || this.networkQuality;

    switch (quality) {
      case 'low':
        return paths.low;
      case 'medium':
        return paths.medium;
      case 'high':
        return paths.high;
      default:
        return paths.medium;
    }
  }

  /**
   * Load and cache a single image
   */
  async loadImage(src, cacheKey = null) {
    const key = cacheKey || src;
    
    // Return cached image if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Create loading promise
    const loadingPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        console.log(`✅ Cached image: ${key}`);
        this.cache.set(key, img);
        this.loadingPromises.delete(key);
        resolve(img);
      };

      img.onerror = (error) => {
        console.error(`❌ Failed to load image: ${key}`, error);
        this.loadingPromises.delete(key);
        reject(error);
      };

      img.src = src;
    });

    this.loadingPromises.set(key, loadingPromise);
    return loadingPromise;
  }

  /**
   * Load image with fallback quality options
   */
  async loadImageWithFallback(originalSrc, cacheKey = null) {
    const key = cacheKey || originalSrc;
    const paths = this.buildOptimizedPaths(originalSrc);
    
    // Try optimal quality first
    const optimalSrc = this.getOptimalSrc(originalSrc);
    
    try {
      return await this.loadImage(optimalSrc, key);
    } catch (error) {
      console.warn(`Failed to load optimal quality image, trying medium: ${optimalSrc}`);
      
      try {
        return await this.loadImage(paths.medium, key);
      } catch (fallbackError) {
        console.warn(`Failed to load medium quality image, trying original: ${paths.medium}`);
        return await this.loadImage(paths.original, key);
      }
    }
  }

  /**
   * Preload all room assets (base images and masks)
   */
  async preloadAllRoomAssets(roomData) {
    console.log('🚀 Starting to preload all room assets...');
    
    // Detect network quality first
    await this.detectNetworkQuality();

    const loadingPromises = [];

    // Preload all base images
    Object.entries(roomData).forEach(([roomKey, room]) => {
      const baseImageKey = `${roomKey}-base`;
      loadingPromises.push(
        this.loadImageWithFallback(room.baseImage, baseImageKey)
          .catch(error => {
            console.error(`Failed to preload base image for ${roomKey}:`, error);
            return null;
          })
      );

      // Preload all mask images for this room
      room.surfaces.forEach(surface => {
        const maskKey = `${roomKey}-${surface.id}-mask`;
        loadingPromises.push(
          this.loadImageWithFallback(surface.mask, maskKey)
            .catch(error => {
              console.error(`Failed to preload mask ${surface.id} for ${roomKey}:`, error);
              return null;
            })
        );
      });
    });

    // Wait for all assets to load
    try {
      const results = await Promise.allSettled(loadingPromises);
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const totalCount = loadingPromises.length;
      
      console.log(`✅ Preloading complete: ${successCount}/${totalCount} assets loaded successfully`);
      return { success: true, loaded: successCount, total: totalCount };
    } catch (error) {
      console.error('Error during asset preloading:', error);
      return { success: false, error };
    }
  }

  /**
   * Get cached base image for a room
   */
  getCachedBaseImage(roomKey) {
    const key = `${roomKey}-base`;
    return this.cache.get(key) || null;
  }

  /**
   * Get cached mask image for a room surface
   */
  getCachedMaskImage(roomKey, surfaceId) {
    const key = `${roomKey}-${surfaceId}-mask`;
    return this.cache.get(key) || null;
  }

  /**
   * Get all cached mask images for a room
   */
  getCachedRoomMasks(roomKey, surfaces) {
    const masks = {};
    surfaces.forEach(surface => {
      const cachedMask = this.getCachedMaskImage(roomKey, surface.id);
      if (cachedMask) {
        masks[surface.id] = cachedMask;
      }
    });
    return masks;
  }

  /**
   * Check if all assets for a room are cached
   */
  isRoomFullyCached(roomKey, room) {
    const baseImage = this.getCachedBaseImage(roomKey);
    if (!baseImage) return false;

    return room.surfaces.every(surface => 
      this.getCachedMaskImage(roomKey, surface.id) !== null
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalCached: this.cache.size,
      currentQuality: this.networkQuality,
      qualityDetected: this.qualityDetected
    };
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
    console.log('Image cache cleared');
  }

  /**
   * Get thumbnail source for room options with appropriate quality
   */
  getThumbnailSrc(originalSrc) {
    const paths = this.buildOptimizedPaths(originalSrc);
    
    // For thumbnails, use lower quality to save bandwidth
    switch (this.networkQuality) {
      case 'low':
        return paths.lqip;
      case 'medium':
        return paths.low;
      case 'high':
        return paths.medium;
      default:
        return paths.low;
    }
  }

  /**
   * Get srcSet for responsive images
   */
  getSrcSet(originalSrc) {
    const paths = this.buildOptimizedPaths(originalSrc);
    return `${paths.lqip} 20w, ${paths.low} 400w, ${paths.medium} 800w, ${paths.high} 1600w`;
  }
}

// Create and export singleton instance
export const imageCache = new ImageCacheService();
export default imageCache;
