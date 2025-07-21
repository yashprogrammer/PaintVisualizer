// Cities data structure for Paint Visualizer
// Based on the color sample provided and using single hotspot image for all cities

export const citiesData = {
  france: {
    name: "France",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "provence-lavender", 
        name: "Provence Lavender", 
        color: "#C4BBBC", 
        x: "25%", 
        y: "35%" 
      },
      { 
        id: "loire-cream", 
        name: "Loire Valley Cream", 
        color: "#E8E4DE", 
        x: "65%", 
        y: "45%" 
      },
      { 
        id: "riviera-sage", 
        name: "Riviera Sage", 
        color: "#B8B5A8", 
        x: "45%", 
        y: "60%" 
      },
      { 
        id: "bordeaux-stone", 
        name: "Bordeaux Stone", 
        color: "#9B968E", 
        x: "30%", 
        y: "70%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#C4BBBC", "#E8E4DE", "#B8B5A8", "#9B968E"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  bali: {
    name: "Bali",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "temple-sand", 
        name: "Temple Sand", 
        color: "#E8E4DE", 
        x: "20%", 
        y: "40%" 
      },
      { 
        id: "jungle-earth", 
        name: "Jungle Earth", 
        color: "#9B968E", 
        x: "70%", 
        y: "35%" 
      },
      { 
        id: "rice-field", 
        name: "Rice Field", 
        color: "#B8B5A8", 
        x: "50%", 
        y: "55%" 
      },
      { 
        id: "volcanic-ash", 
        name: "Volcanic Ash", 
        color: "#8A8680", 
        x: "35%", 
        y: "75%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#B8B5A8", "#9B968E", "#8A8680"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  egypt: {
    name: "Egypt",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "desert-dawn", 
        name: "Desert Dawn", 
        color: "#E8E4DE", 
        x: "30%", 
        y: "30%" 
      },
      { 
        id: "pyramid-stone", 
        name: "Pyramid Stone", 
        color: "#C4BBBC", 
        x: "60%", 
        y: "50%" 
      },
      { 
        id: "nile-clay", 
        name: "Nile Clay", 
        color: "#9B968E", 
        x: "40%", 
        y: "65%" 
      },
      { 
        id: "sphinx-shadow", 
        name: "Sphinx Shadow", 
        color: "#8A8680", 
        x: "25%", 
        y: "80%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#C4BBBC", "#9B968E", "#8A8680"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  greece: {
    name: "Greece",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "santorini-white", 
        name: "Santorini White", 
        color: "#E8E4DE", 
        x: "35%", 
        y: "25%" 
      },
      { 
        id: "olive-grove", 
        name: "Olive Grove", 
        color: "#B8B5A8", 
        x: "55%", 
        y: "45%" 
      },
      { 
        id: "marble-dust", 
        name: "Marble Dust", 
        color: "#C4BBBC", 
        x: "75%", 
        y: "60%" 
      },
      { 
        id: "aegean-mist", 
        name: "Aegean Mist", 
        color: "#9B968E", 
        x: "40%", 
        y: "70%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#B8B5A8", "#C4BBBC", "#9B968E"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  japan: {
    name: "Japan",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "zen-pebble", 
        name: "Zen Pebble", 
        color: "#C4BBBC", 
        x: "40%", 
        y: "30%" 
      },
      { 
        id: "bamboo-mist", 
        name: "Bamboo Mist", 
        color: "#B8B5A8", 
        x: "20%", 
        y: "50%" 
      },
      { 
        id: "temple-stone", 
        name: "Temple Stone", 
        color: "#9B968E", 
        x: "65%", 
        y: "55%" 
      },
      { 
        id: "cherry-bark", 
        name: "Cherry Bark", 
        color: "#8A8680", 
        x: "45%", 
        y: "75%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#C4BBBC", "#B8B5A8", "#9B968E", "#8A8680"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  kenya: {
    name: "Kenya",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "savanna-dust", 
        name: "Savanna Dust", 
        color: "#E8E4DE", 
        x: "30%", 
        y: "35%" 
      },
      { 
        id: "acacia-bark", 
        name: "Acacia Bark", 
        color: "#9B968E", 
        x: "60%", 
        y: "40%" 
      },
      { 
        id: "baobab-trunk", 
        name: "Baobab Trunk", 
        color: "#8A8680", 
        x: "50%", 
        y: "65%" 
      },
      { 
        id: "red-earth", 
        name: "Red Earth", 
        color: "#B8B5A8", 
        x: "25%", 
        y: "80%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#9B968E", "#8A8680", "#B8B5A8"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  ldweep: {
    name: "L'Dweep",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "coral-sand", 
        name: "Coral Sand", 
        color: "#E8E4DE", 
        x: "35%", 
        y: "40%" 
      },
      { 
        id: "palm-shadow", 
        name: "Palm Shadow", 
        color: "#B8B5A8", 
        x: "55%", 
        y: "30%" 
      },
      { 
        id: "lagoon-bed", 
        name: "Lagoon Bed", 
        color: "#C4BBBC", 
        x: "70%", 
        y: "65%" 
      },
      { 
        id: "driftwood", 
        name: "Driftwood", 
        color: "#9B968E", 
        x: "40%", 
        y: "75%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#B8B5A8", "#C4BBBC", "#9B968E"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  morocco: {
    name: "Morocco",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "marrakech-clay", 
        name: "Marrakech Clay", 
        color: "#C4BBBC", 
        x: "25%", 
        y: "30%" 
      },
      { 
        id: "sahara-sand", 
        name: "Sahara Sand", 
        color: "#E8E4DE", 
        x: "65%", 
        y: "45%" 
      },
      { 
        id: "atlas-stone", 
        name: "Atlas Stone", 
        color: "#9B968E", 
        x: "45%", 
        y: "60%" 
      },
      { 
        id: "casablanca-mist", 
        name: "Casablanca Mist", 
        color: "#B8B5A8", 
        x: "30%", 
        y: "75%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#C4BBBC", "#E8E4DE", "#9B968E", "#B8B5A8"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  spain: {
    name: "Spain",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "andalusian-white", 
        name: "Andalusian White", 
        color: "#E8E4DE", 
        x: "40%", 
        y: "25%" 
      },
      { 
        id: "seville-stone", 
        name: "Seville Stone", 
        color: "#C4BBBC", 
        x: "60%", 
        y: "50%" 
      },
      { 
        id: "flamenco-dust", 
        name: "Flamenco Dust", 
        color: "#B8B5A8", 
        x: "25%", 
        y: "65%" 
      },
      { 
        id: "madrid-shadow", 
        name: "Madrid Shadow", 
        color: "#9B968E", 
        x: "70%", 
        y: "70%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  },
  vietnam: {
    name: "Vietnam",
    hotspotImage: "/City/Hotspot/image.png",
    videos: ["/City/Video/Video.mp4"],
    hotspots: [
      { 
        id: "ha-long-mist", 
        name: "Ha Long Mist", 
        color: "#E8E4DE", 
        x: "35%", 
        y: "35%" 
      },
      { 
        id: "mekong-clay", 
        name: "Mekong Clay", 
        color: "#9B968E", 
        x: "55%", 
        y: "45%" 
      },
      { 
        id: "bamboo-forest", 
        name: "Bamboo Forest", 
        color: "#B8B5A8", 
        x: "75%", 
        y: "60%" 
      },
      { 
        id: "saigon-dust", 
        name: "Saigon Dust", 
        color: "#C4BBBC", 
        x: "40%", 
        y: "75%" 
      }
    ],
    colorPalettes: {
      vibrant: ["#E8E4DE", "#9B968E", "#B8B5A8", "#C4BBBC"],
      calm: ["#E8E4DE", "#C4BBBC", "#B8B5A8", "#9B968E"]
    }
  }
};

// Helper function to get city data by name (case-insensitive)
export const getCityData = (cityName) => {
  if (!cityName) return null;
  
  // Normalize city name and handle special cases
  const normalizedName = cityName.toLowerCase().trim();
  
  // Handle special case for L'Dweep
  if (normalizedName === "l'dweep" || normalizedName === "ldweep") {
    return citiesData.ldweep;
  }
  
  return citiesData[normalizedName] || null;
};

// Get all city names for validation
export const getAllCityNames = () => {
  return Object.keys(citiesData);
}; 