import React from 'react';
import type { GameState } from '../../types/game';

interface ActionFeedProps {
  logs: GameState['logs'];
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ logs }) => {
  return (
    <div className="h-full earth-panel rounded p-4 flex flex-col font-mono text-sm overflow-hidden">
      <h3 className="text-yellow-600 border-b border-[#5C4033] pb-2 mb-3 tracking-wider font-bold text-xs flex items-center">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2 shadow-[0_0_5px_red]"></span>
        【前线战报】
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-[#5C4033]">
        {[...logs].reverse().map((log) => {
          const isEvent = log.message.includes('【');
          return (
          <div key={log.id} className={`break-words leading-tight p-2 rounded border-l-2 ${isEvent ? 'border-yellow-600 text-yellow-500 bg-[#3E2723]' : 'border-[#8B5A2B] text-gray-300 bg-black/40'}`}>
            <span className="text-gray-500 text-xs mr-2">
              [{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]
            </span>
            {log.message}
          </div>
        )})}
      </div>
    </div>
  );
};