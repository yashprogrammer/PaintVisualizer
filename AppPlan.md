
# Paint Visualizer App - Master Plan

Based on your description and the images you've shared, I'll create a comprehensive plan for your "Colours of the World" Paint Visualizer app. This document will serve as a blueprint for development and help keep track of progress.

-----

## App Overview

The Paint Visualizer app allows users to explore color palettes inspired by different cities around the world and visualize how these colors would look in various room settings. The app transforms the memories and aesthetics of global destinations into paint colors that users can apply to their own spaces.

-----

## Target Audience

  * Home decorators and DIY enthusiasts
  * Interior designers and professionals
  * Customers of the paint brand (appears to be Dulux based on the images)
  * People planning to repaint their homes who want inspiration from global destinations

-----

## User Flow

1.  **Welcome Screen**

      * Central logo with "colours of the world" branding
      * Tagline: "TURNING MEMORIES OF PLACES INTO SHADES YOU CAN FEEL"
      * Background carousel of destination images
      * Loading animation within the heart logo

2.  **Loading Screen**

      * Similar to welcome screen but with animated heart logo
      * Loading indicator using the heart with blood-red color fill animation
      * "Explore" button appears within heart when loading completes

3.  **City Selection Screen**

      * Horizontal scrollable carousel of city images
      * Heart-shaped frame highlighting the currently selected city
      * City name displayed within the heart
      * Blurred background showing the currently selected city
      * Instruction text: "CHOOSE A LOCATION TO EXPLORE ITS UNIQUE PAINT TONES"

4.  **City Video Playback**

      * Automatic playback of videos related to the selected city
      * Videos stored in public directory
      * Sequential playback of multiple video clips

5.  **Paint Tone Hotspot Selection**

      * Final frame from video used as static background
      * Interactive hotspots overlaid on the image
      * Instruction text: "TAP A PAINT TONE HOTSPOT TO CONTINUE"
      * Clicking a hotspot navigates to the Paint Visualizer screen

6.  **Paint Visualizer Screen**

      * Three-column layout:
          * Left: Color palette selection from the chosen city ("Color Lock Up")
          * Center: Room visualization with selectable surfaces
          * Right: Room type selection options
      * Color swatches at bottom of center panel for quick selection
      * "Share" button for sharing results
      * Options to toggle between "Vibrant" and "Calm" color schemes

-----

## Technical Architecture

### Frontend Framework

**React**: For building the interactive UI components
**Tailwind CSS**: For styling

### Key Components

1.  **App.js**
      * Main application container
      * Routing and state management
2.  **Components**
      * **WelcomeScreen**: Initial landing page with animations
      * **LoadingScreen**: Loading animation and transition
      * **CitySelector**: Horizontal carousel with selection logic
      * **VideoPlayer**: Video playback functionality
      * **HotspotSelector**: Interactive image with clickable regions
      * **RoomVisualizer**: Main visualization tool
      * **ColorPicker**: Color selection interface
      * **RoomSelector**: Room type selection interface
3.  **Assets**
      * City images and videos
      * Room template images
      * Color palettes for each city
      * Mask images for colorable surfaces

-----

## Data Structure

```javascript
// Example data structure
const cities = [
  {
    id: "france",
    name: "France",
    images: ["france_1.jpg", "france_2.jpg"],
    videos: ["france_video_1.mp4", "france_video_2.mp4"],
    hotspots: [
      { x: 120, y: 350, colorId: "french_blue" },
      { x: 250, y: 180, colorId: "paris_pink" },
      // More hotspots
    ],
    colorPalettes: {
      vibrant: ["#e8c1c5", "#b6d8f2", "#f4afab", "#c9b7ad"],
      calm: ["#d1e0eb", "#e8d1c5", "#c9d8c5", "#e0ebde"]
    }
  },
  // More cities
];

const rooms = [
  {
    id: "bedroom",
    name: "Bedroom",
    image: "bedroom.jpg",
    masks: ["bedroom_wall.png", "bedroom_accent.png"]
  },
  // More rooms
];
```

-----

## Implementation Plan

**Phase 1: Setup and Basic Structure**

*   [x] Initialize React project
*   [x] Set up routing
*   [x] Create basic component structure
*   [x] Implement responsive layout

**Phase 2: Welcome and Loading Screens**

*   [x] Implement welcome screen with animations and background carousel
*   [x] Update welcome screen to match the "Colours of the World" design with split-screen layout
*   [x] Implement heart logo in the welcome screen
*   [x] Replace text logo with colorOfTheWorld.jpg image
*   [x] Implement infinitely drifting carousel animation with stacked city images
*   [ ] Create loading animation with heart fill effect
*   [ ] Add transition to city selection

**Phase 1: Setup and Basic Structure**

  * Initialize React project
  * Set up routing
  * Create basic component structure
  * Implement responsive layout

**Phase 2: Welcome and Loading Screens**

  * Implement welcome screen with animations
  * Create loading animation with heart fill effect
  * Add transition to city selection

**Phase 3: City Selection**

  * Build horizontal carousel for city selection
  * Implement selection logic and visual feedback
  * Create blurred background effect that changes with selection

**Phase 4: Video Playback**

  * Implement video player component
  * Set up sequential playback functionality
  * Add transition to hotspot selection screen

**Phase 5: Hotspot Selection**

  * Create interactive image with clickable hotspots
  * Implement hotspot highlighting and selection
  * Add transition to visualizer screen

**Phase 6: Paint Visualizer**

  * Implement three-column layout
  * Create room visualization with selectable surfaces
  * Build color application functionality using image masks
  * Add room type selection
  * Implement color palette selection

**Phase 7: Refinement and Additional Features**

  * Add share functionality
  * Implement save/favorite options
  * Optimize performance
  * Add animations and transitions
  * Implement responsive design for different devices

-----

## Technical Considerations

  * **Image Processing**
      * Use `canvas` or `WebGL` for color application
      * Implement mask-based coloring for different surfaces
      * Consider performance optimization for mobile devices
  * **Video Handling**
      * Preload videos for smoother transitions
      * Consider bandwidth usage and optimization
      * Implement fallback for browsers with limited video support
  * **State Management**
      * Use React Context or Redux for global state
      * Maintain user selections throughout the flow
      * Consider persistence for returning users
  * **Responsive Design**
      * Ensure the app works well on various screen sizes
      * Adapt layout for mobile, tablet, and desktop
      * Consider touch interactions for mobile users

-----

## Testing Strategy

  * Component testing with Jest and React Testing Library
  * User flow testing to ensure smooth navigation
  * Performance testing, especially for image processing
  * Cross-browser compatibility testing
  * Mobile device testing

-----

## Deployment Considerations

  * Build optimization for production
  * Asset compression and optimization
  * CDN for image and video assets
  * Analytics integration for user behavior tracking

-----

## Future Enhancements

  * Additional cities and color palettes
  * User accounts to save favorite colors and rooms
  * AR functionality to visualize colors in real rooms
  * Integration with e-commerce to purchase selected paints
  * Social sharing with rendered results