import React from 'react';
import type { Player } from '../../types/game';

interface PlayerListProps {
  players: Player[];
  currentTurnIndex: number;
  myPlayerId: string;
  onAvatarClick?: (playerId: string) => void;
}

const playerColors = [
  'bg-[#8B0000]', 'bg-[#00008B]', 'bg-[#006400]', 'bg-[#DAA520]',
  'bg-[#4B0082]', 'bg-[#8B4513]', 'bg-[#2F4F4F]', 'bg-[#A0522D]'
];
const borderColors = [
  'border-[#8B0000]', 'border-[#00008B]', 'border-[#006400]', 'border-[#DAA520]',
  'border-[#4B0082]', 'border-[#8B4513]', 'border-[#2F4F4F]', 'border-[#A0522D]'
];

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentTurnIndex, myPlayerId, onAvatarClick }) => {
  return (
    <div className="flex gap-4 justify-start sm:justify-center items-center h-full p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#5C4033]">
      {players.map((player, index) => {
        const isCurrentTurn = currentTurnIndex === index;
        const isMe = player.id === myPlayerId;

        return (
          <div
            key={player.id}
            className={`flex flex-col items-center bg-[#1A1814] rounded p-1 border-2 transition-all ${
              isCurrentTurn ? `${borderColors[index]} shadow-[0_0_15px_rgba(232,224,213,0.3)] scale-105` : 'border-[#5C4033]'
            }`}
            style={{ width: '140px' }}
          >
            {/* Tokens Display (Public) */}
            <div className="flex gap-1.5 mb-1 bg-black/60 px-1 py-1 rounded w-full justify-center text-xs">
              <div className="flex items-center text-red-500 font-bold">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full mr-0.5 inline-block border border-red-800"></span>
                {isMe ? player.wallet.red : '*'}
              </div>
              <div className="flex items-center text-blue-500 font-bold">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-0.5 inline-block border border-blue-800"></span>
                {isMe ? player.wallet.blue : '*'}
              </div>
              <div className="flex items-center text-green-500 font-bold">
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full mr-0.5 inline-block border border-green-800"></span>
                {isMe ? player.wallet.green : '*'}
              </div>
            </div>

            {/* Avatar / Identity */}
            <div
              className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center font-bold text-xl text-white shadow-inner ${playerColors[index % playerColors.length]} ${!isMe && onAvatarClick ? 'cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all' : ''}`}
              onClick={() => { if (!isMe && onAvatarClick) onAvatarClick(player.id); }}
              title={!isMe ? "派间谍偷取该对手资产情报" : undefined}
            >
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