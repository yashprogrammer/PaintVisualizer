import React from 'react';
import { roomData } from '../../../data/roomData';



const RoomOptions = ({ currentRoom, selectRoom }) => {
  // Font sizing is now controlled globally via `.room-name-label` CSS in `RoomVisualizer.js`.
// Landscape scaling (mobile) relative to FHD baseline
const [landscapeScale, setLandscapeScale] = React.useState(1);
const [isLandscapeMobile, setIsLandscapeMobile] = React.useState(false);
React.useEffect(() => {
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;
  const updateScale = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLandscape = w > h;
    const isMobile = w <= 1024;
    if (isLandscape && isMobile) {
      const s = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
      setLandscapeScale(s);
      setIsLandscapeMobile(true);
    } else {
      setLandscapeScale(1);
      setIsLandscapeMobile(false);
    }
  };
  updateScale();
  window.addEventListener('resize', updateScale);
  window.addEventListener('orientationchange', updateScale);
  return () => {
    window.removeEventListener('resize', updateScale);
    window.removeEventListener('orientationchange', updateScale);
  };
}, []);

  // Build optimized asset paths for thumbnails: lqip -> low -> medium (no original)
  const buildOptimized = React.useCallback((src) => {
    if (!src || typeof src !== 'string') return { lqip: src, low: src, medium: src };
    const lastDot = src.lastIndexOf('.');
    if (lastDot === -1) return { lqip: `/optimized${src}-lqip.jpg`, low: `/optimized${src}-low`, medium: `/optimized${src}-med` };
    const base = src.substring(0, lastDot);
    const ext = src.substring(lastDot);
    return {
      lqip: `/optimized${base}-lqip.jpg`,
      low: `/optimized${base}-low${ext}`,
      medium: `/optimized${base}-med${ext}`,
    };
  }, []);

  return (
    <React.Fragment>
      <style>{`
        @media (orientation: landscape) and (max-width: 1024px) {
          .room-options .room-name-label { font-size: 10px !important; }
        }
      `}</style>
      <div className="room-options column-3 column-padding flex flex-col items-center justify-between overflow-hidden py-6 px-4 lg:px-[25px] w-1/4 flex-shrink-0 h-full">
      <div
        className="container-height flex flex-col gap-4 lg:gap-[21px] flex-1 items-center justify-end relative rounded-3xl w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          boxShadow:
            '0 244px 68px 0 rgba(0, 0, 0, 0.00), 0 156px 63px 0 rgba(0, 0, 0, 0.01), 0 88px 53px 0 rgba(0, 0, 0, 0.03), 0 39px 39px 0 rgba(0, 0, 0, 0.04), 0 10px 22px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Room Options Area */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-hidden  pt-4 lg:pt-6 px-4 lg:px-[18px] w-full min-h-0 max-h-[95vh]">
          {/* Header section with title */}
          <div className="flex flex-col px-0 lg:px-2 pt-0 pb-3 lg:pb-4 w-full">
            <div className="title-text font-bold leading-none text-black text-[18px] lg:text-[20px] text-end font-brand mb-3">
              <p className="block leading-normal" style={{
                fontSize: `${Math.max(12, Math.round(16 * landscapeScale))}px`
              }}>Select Room</p>
            </div>
            {/* Separator line */}
            <div className="w-full h-px bg-gray-200"></div>
          </div>
          
          {/* Room Options */}
          <div className="flex flex-col flex-1 w-full min-h-0 gap-3 lg:gap-4 px-0 lg:px-2 pb-4 lg:pb-6 -mb-4 lg:-mb-6 box-border overflow-y-auto">
          {Object.entries(roomData).map(([roomKey, room], index) => (
            <div 
              key={roomKey}
              className={`flex flex-col items-center justify-start w-full room-option cursor-pointer flex-1 min-h-0`}
              onClick={() => selectRoom(roomKey)}
            >
              <div 
                className={`w-full h-full overflow-hidden relative transition-all box-border ${currentRoom === roomKey ? '' : 'hover:opacity-80'}`}
                style={currentRoom === roomKey ? {
                  borderRadius: '8px',
                  border: '2.5px solid #8A9CE6',
                  boxShadow: '0 48px 13px 0 rgba(138, 156, 230, 0.00), 0 30px 12px 0 rgba(138, 156, 230, 0.02), 0 17px 10px 0 rgba(138, 156, 230, 0.08), 0 8px 8px 0 rgba(138, 156, 230, 0.13), 0 2px 4px 0 rgba(138, 156, 230, 0.15)'
                } : { borderRadius: '8px' }}
              >
                <img 
                  src={buildOptimized(room.baseImage).medium}
                  srcSet={`${buildOptimized(room.baseImage).lqip} 20w, ${buildOptimized(room.baseImage).low} 400w, ${buildOptimized(room.baseImage).medium} 800w`}
                  sizes="25vw"
                  alt={`${room.name} preview`}
                  className="w-full h-full object-cover"
                  decoding="async"
                />
                
                {/* Text overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div 
                    className={`px-4 py-2 flex items-center justify-center ${currentRoom === roomKey ? '' : ''}`}
                    style={currentRoom === roomKey ? {
                      borderRadius: '32px',
                      background: 'rgba(0, 0, 0, 0.35)'
                    } : {}}
                  >
                    <span 
                      className={`font-medium room-name-label ${currentRoom === roomKey ? '' : 'text-white font-brand'}`}
                      style={{
                        color: '#FFF',
                        textAlign: 'right',
                        fontFamily: '"Open Sans"',
                        fontWeight: '700',
                        lineHeight: 'normal'
                      }}
                    >
                      {room.name}
                    </span>
                  </div>
                </div>
                
                {/* Checkmark for selected room */}
                {currentRoom === roomKey && (
                  <div className="absolute top-2 right-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path 
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                        fill="white" 
                        fillOpacity="0.8"
                      />
                      <path 
                        d="M9 12L11 14L15 10" 
                        stroke="#162667" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {/* {index < Object.keys(roomData).length - 1 && (
                <div className="bg-[#cec5c5] h-0.5 rounded-lg w-3/4" />
              )} */}
            </div>
          ))}
          </div>
          
        
        </div>
      </div>
      </div>
    </React.Fragment>
  );
};

export default RoomOptions; 