import React from 'react';
import type { Player } from '../../types/game';

interface PlayerListProps {
  players: Player[];
  currentTurnIndex: number;
}

const playerColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
const borderColors = ['border-red-500', 'border-blue-500', 'border-green-500', 'border-yellow-500'];

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentTurnIndex }) => {
  return (
    <div className="flex gap-4 justify-center items-center h-full p-2">
      {players.map((player, index) => {
        const isCurrentTurn = currentTurnIndex === index;

        return (
          <div
            key={player.id}
            className={`flex flex-col items-center bg-gray-800 rounded p-3 border-2 transition-all ${
              isCurrentTurn ? `${borderColors[index]} shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105` : 'border-gray-700'
            }`}
            style={{ width: '140px' }}
          >
            {/* Tokens Display (Public) */}
            <div className="flex gap-2 mb-2 bg-gray-900 px-2 py-1 rounded w-full justify-center">
              <div className="flex items-center text-red-400 font-bold">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-1 inline-block"></span>
                {player.wallet.red}
              </div>
              <div className="flex items-center text-blue-400 font-bold">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-1 inline-block"></span>
                {player.wallet.blue}
              </div>
            </div>

            {/* Avatar / Identity */}
            <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center font-bold text-xl ${playerColors[index]}`}>
              {player.name.charAt(0).toUpperCase()}
            </div>

            <div className="text-sm font-bold text-gray-200 truncate w-full text-center">
              {player.name}
            </div>

            {isCurrentTurn && (
              <div className="mt-1 text-xs text-white bg-blue-600 px-2 py-0.5 rounded animate-pulse">
                ACTION
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
