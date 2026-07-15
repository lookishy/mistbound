import React from 'react';
import type { GameState } from '../../types/game';

interface ActionFeedProps {
  logs: GameState['logs'];
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ logs }) => {
  return (
    <div className="h-full bg-gray-900 border border-blue-800 rounded p-4 flex flex-col font-mono text-sm overflow-hidden">
      <h3 className="text-blue-400 border-b border-blue-800 pb-2 mb-3 uppercase tracking-wider font-bold text-xs flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
        System Feed
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-blue-900">
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="text-gray-300 break-words leading-tight bg-gray-800/50 p-2 rounded border-l-2 border-blue-500">
            <span className="text-gray-500 text-xs mr-2">
              [{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]
            </span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};
