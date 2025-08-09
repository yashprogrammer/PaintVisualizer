import React from 'react';
import { roomData } from '../../../data/roomData';

const RoomOptions = ({ currentRoom, selectRoom }) => {
  return (
    <div className="column-3 column-padding flex flex-col gap-4 lg:gap-8 items-start justify-start overflow-hidden px-4 lg:px-[25px]  w-1/4 flex-shrink-0">
     <div className="title-text font-normal leading-none text-black text-[28px] lg:text-[42px] text-right w-full font-brand">
        <p className="block leading-normal">Select Room</p>
      </div>
      <div className="container-height flex flex-col flex-1 items-start justify-start p-3 lg:p-[16px] rounded-2xl lg:rounded-3xl border-[3px] lg:border-[5px] border-solid border-[#d2d2d2] w-full h-full min-h-0">
        
        {/* Room Options */}
        <div className="flex flex-col flex-1 w-full h-full min-h-0 gap-2.5">
          {Object.entries(roomData).map(([roomKey, room], index) => (
            <div 
              key={roomKey}
              className={`flex flex-col gap-2.5 items-center justify-start w-full room-option cursor-pointer flex-1 min-h-0`}
              onClick={() => selectRoom(roomKey)}
              style={{ minHeight: 0 }}
            >
              <div className="rounded-lg w-full overflow-hidden relative hover:opacity-80 transition-opacity flex-1 min-h-0">
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