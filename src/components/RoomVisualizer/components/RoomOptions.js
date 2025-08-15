import React from 'react';
import { roomData } from '../../../data/roomData';

const RoomOptions = ({ currentRoom, selectRoom }) => {
  return (
    <div className="column-3 column-padding flex flex-col gap-4 lg:gap-8 items-start justify-start overflow-hidden px-4 lg:px-[25px]  w-1/4 flex-shrink-0 h-full">
     <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-right w-full font-brand">
        <p className="block leading-normal">Select Room</p>
      </div>
      <div
        className="container-height flex flex-col flex-1 items-start justify-start p-3 lg:p-[16px] rounded-3xl w-full h-full min-h-0"
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          boxShadow:
            '0 244px 68px 0 rgba(0, 0, 0, 0.00), 0 156px 63px 0 rgba(0, 0, 0, 0.01), 0 88px 53px 0 rgba(0, 0, 0, 0.03), 0 39px 39px 0 rgba(0, 0, 0, 0.04), 0 10px 22px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        
        {/* Room Options */}
        <div className="flex flex-col flex-1 w-full h-full min-h-0 gap-2.5">
          {Object.entries(roomData).map(([roomKey, room], index) => (
            <div 
              key={roomKey}
              className={`flex flex-col gap-2.5 items-center justify-start w-full room-option cursor-pointer flex-1 min-h-0`}
              onClick={() => selectRoom(roomKey)}
              style={{ minHeight: 0 }}
            >
              <div className={`rounded-lg w-full overflow-hidden relative transition-all flex-1 min-h-0 ${currentRoom === roomKey ? 'ring-[2.5px] ring-[#8a9ce6] ring-offset-2 ring-offset-transparent shadow-[0px_48px_13px_rgba(138,156,230,0),0px_30px_12px_rgba(138,156,230,0.02),0px_17px_10px_rgba(138,156,230,0.08),0px_8px_8px_rgba(138,156,230,0.13),0px_2px_4px_rgba(138,156,230,0.15)]' : 'hover:opacity-80'}`}>
                <img 
                  src={room.baseImage} 
                  alt={`${room.name} preview`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                 <span className="text-white text-xs font-medium font-brand">
                    {room.name}
                  </span>
                </div>
              </div>
              {index < Object.keys(roomData).length - 1 && (
                <div className="bg-[#cec5c5] h-0.5 rounded-lg w-3/4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomOptions; 