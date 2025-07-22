
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

The primary data will be structured around cities, with nested information for hotspots, palettes, and associated assets. Using predefined coordinates for hotspots is crucial for performance and reliability.

```javascript
// Example data structure in /src/data/cities.js
export const citiesData = {
  france: {
    name: "France",
    hotspotImage: "/City/Hotspot/france.png",
    videos: ["/City/Video/France.mp4"],
    hotspots: [
      { id: "provence-lavender", name: "Provence Lavender", color: "#8b80b6", x: "25%", y: "40%" },
      { id: "sunflower-yellow", name: "Sunflower Yellow", color: "#f9d71c", x: "60%", y: "65%" },
      { id: "riviera-blue", name: "Riviera Blue", color: "#0077be", x: "75%", y: "30%" }
    ],
    colorPalettes: {
      vibrant: ["#e8c1c5", "#b6d8f2", "#f4afab", "#c9b7ad"],
      calm: ["#d1e0eb", "#e8d1c5", "#c9d8c5", "#e0ebde"]
    }
  },
  // ... more cities
};

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

*   [x] Initialize React project with Vite for a fast development experience.
*   [x] Set up routing using `react-router-dom`.
*   [x] Create basic component folder structure.
*   [x] Implement a responsive layout foundation with Tailwind CSS.

**Phase 2: Welcome and Loading Screens**

*   [x] Implement welcome screen with animations and background carousel.
*   [x] Update welcome screen to match the "Colours of the World" design.
*   [x] Implement heart logo and brand imagery.
*   [x] Implement infinitely drifting carousel animation.
*   [ ] Create loading animation with heart fill effect.
*   [ ] Add transition from Loading screen to City Selection.

**Phase 3: City Selection**

*   [x] Build horizontal carousel for city selection.
*   [x] Implement selection logic and visual feedback (center highlight).
*   [x] Create blurred background effect that changes with selection.
*   [x] On selection, navigate to the city's video player screen.

**Phase 4: Video Playback**

*   [ ] Implement video player component to play city-specific videos.
*   [ ] Set up sequential playback if multiple videos exist.
*   [ ] On video completion, navigate to the Hotspot Selection screen.

**Phase 5: Hotspot Selection**

*   [x] **Define Data:** Finalize the `citiesData` structure with `hotspotImage` and an array of `hotspots` using percentage-based coordinates for responsiveness.
*   [x] **Create Route:** Add a new route in `App.js` for `'/hotspot/:cityName'`.
*   [x] **Build Component:** Create `HotspotSelector.js`.
    *   It will use `useParams` to identify the current city.
    *   It will render the city's static `hotspotImage` as the background.
    *   It will map over the `hotspots` array, rendering an absolutely positioned, animated button for each one based on its `x` and `y` coordinates.
*   [x] **Implement Navigation:** On clicking a hotspot, navigate to the visualizer screen, passing the city and selected color information (e.g., `/visualizer/france?color=provence-lavender`).
*   [x] **Add Instructions:** Display the text "TAP A PAINT TONE HOTSPOT TO CONTINUE".

**Phase 6: Paint Visualizer**

*   [ ] Implement three-column layout.
*   [ ] Create room visualization with selectable surfaces
*   [ ] Build color application functionality using image masks
*   [ ] Add room type selection
*   [ ] Implement color palette selection

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

  * **Component Testing**: Use Jest and React Testing Library for unit and integration testing of individual components.
  * **End-to-End (E2E) Testing**: Use **Playwright** to create functional tests that simulate the full user journey.
      * *Example Flow*: A test could start at the City Selector, choose a city, watch the video, land on the Hotspot Selector, click a specific hotspot, and verify it navigates to the Visualizer screen with the correct parameters in the URL.
  * **Performance Testing**: Manually assess performance, especially for animations and the room visualizer's color application.

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