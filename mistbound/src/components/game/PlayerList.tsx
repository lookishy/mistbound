import React from 'react';
import type { Player } from '../../types/game';

interface PlayerListProps {
  players: Player[];
  currentTurnIndex: number;
}

const playerColors = ['bg-[#8B0000]', 'bg-[#00008B]', 'bg-[#006400]', 'bg-[#DAA520]'];
const borderColors = ['border-[#8B0000]', 'border-[#00008B]', 'border-[#006400]', 'border-[#DAA520]'];

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentTurnIndex }) => {
  return (
    <div className="flex gap-4 justify-center items-center h-full p-2">
      {players.map((player, index) => {
        const isCurrentTurn = currentTurnIndex === index;

        return (
          <div
            key={player.id}
            className={`flex flex-col items-center bg-[#1A1814] rounded p-3 border-2 transition-all ${
              isCurrentTurn ? `${borderColors[index]} shadow-[0_0_15px_rgba(232,224,213,0.3)] scale-105` : 'border-[#5C4033]'
            }`}
            style={{ width: '140px' }}
          >
            {/* Tokens Display (Public) */}
            <div className="flex gap-2 mb-2 bg-black/60 px-2 py-1 rounded w-full justify-center">
              <div className="flex items-center text-red-500 font-bold">
                <span className="w-3 h-3 bg-red-600 rounded-full mr-1 inline-block border border-red-800"></span>
                {player.wallet.red}
              </div>
              <div className="flex items-center text-blue-500 font-bold">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-1 inline-block border border-blue-800"></span>
                {player.wallet.blue}
              </div>
            </div>

            {/* Avatar / Identity */}
            <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center font-bold text-xl text-white shadow-inner ${playerColors[index]}`}>
              {player.name.charAt(0).toUpperCase()}
            </div>

            <div className="text-sm font-bold text-[#E8E0D5] truncate w-full text-center">
              {player.name}
            </div>

            {isCurrentTurn && (
              <div className="mt-1 text-xs text-white bg-red-800 border border-red-500 px-2 py-0.5 rounded animate-pulse font-bold">
                战术部署中
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};