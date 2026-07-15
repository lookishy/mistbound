import React from 'react';

interface EventOverlayProps {
  eventTitle: string | null;
}

export const EventOverlay: React.FC<EventOverlayProps> = ({ eventTitle }) => {
  if (!eventTitle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
      <div className="animate-pulse">
         <h1 className="text-8xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,1)] tracking-[0.2em] transform scale-150 animate-[bounce_1s_ease-in-out_infinite]">
           {eventTitle}
         </h1>
      </div>
    </div>
  );
};
