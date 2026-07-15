import React, { useState } from 'react';
import type { Player, Territory } from '../../types/game';

interface ControlPanelProps {
  currentPlayer: Player | null;
  isMyTurn: boolean;
  selectedTerritory: Territory | null;
  onEarnMoney: () => void;
  onBid: (red: number, blue: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentPlayer,
  isMyTurn,
  selectedTerritory,
  onEarnMoney,
  onBid
}) => {
  const [bidRed, setBidRed] = useState(0);
  const [bidBlue, setBidBlue] = useState(0);

  if (!currentPlayer) return null;

  return (
    <div className="h-full earth-panel rounded p-4 flex flex-col font-mono">
      <div className="mb-4">
        <h3 className="text-gray-400 text-xs mb-1 uppercase">【军备库】</h3>
        <div className="flex gap-4">
          <div className="bg-red-900/30 border border-red-800 rounded p-2 flex-1 text-center shadow-[inset_0_0_10px_rgba(139,0,0,0.5)]">
            <span className="text-red-500 font-bold text-xl">{currentPlayer.wallet.red}</span>
            <span className="text-red-500/50 text-xs block">红晶</span>
          </div>
          <div className="bg-blue-900/30 border border-blue-800 rounded p-2 flex-1 text-center shadow-[inset_0_0_10px_rgba(0,0,139,0.5)]">
            <span className="text-blue-500 font-bold text-xl">{currentPlayer.wallet.blue}</span>
            <span className="text-blue-500/50 text-xs block">蓝晶</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end space-y-4">
        {/* Action 1: Earn Money */}
        <button
          disabled={!isMyTurn}
          onClick={onEarnMoney}
          className={`w-full py-3 rounded font-bold transition-all ${
            isMyTurn
              ? 'bg-green-800 hover:bg-green-700 text-white shadow-[0_0_10px_rgba(0,100,0,0.8)] border border-green-600'
              : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
          }`}
        >
          [A] 呼叫后勤补给
        </button>

        <hr className="border-[#5C4033]" />

        {/* Action 2: Bid */}
        <div className="bg-[#1A1814] p-3 rounded border border-[#5C4033]">
          <div className="text-xs text-gray-400 mb-2">
            锁定目标: {selectedTerritory ? <span className="text-yellow-500 font-bold">{selectedTerritory.name} (防线强度: {selectedTerritory.currentPrice})</span> : '未选择目标'}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min="0"
              max={currentPlayer.wallet.red}
              value={bidRed}
              onChange={(e) => setBidRed(Number(e.target.value))}
              className="w-full bg-[#2C241B] border border-red-800 text-red-500 p-2 rounded outline-none text-center"
              placeholder="红晶数量"
            />
            <input
              type="number"
              min="0"
              max={currentPlayer.wallet.blue}
              value={bidBlue}
              onChange={(e) => setBidBlue(Number(e.target.value))}
              className="w-full bg-[#2C241B] border border-blue-800 text-blue-500 p-2 rounded outline-none text-center"
              placeholder="蓝晶数量"
            />
          </div>

          <button
            disabled={!isMyTurn || !selectedTerritory || (bidRed === 0 && bidBlue === 0) || selectedTerritory.id === 'start' || selectedTerritory.id === 'end'}
            onClick={() => {
              onBid(bidRed, bidBlue);
              setBidRed(0);
              setBidBlue(0);
            }}
            className={`w-full py-3 rounded font-bold transition-all ${
              isMyTurn && selectedTerritory && (bidRed > 0 || bidBlue > 0) && selectedTerritory.id !== 'start' && selectedTerritory.id !== 'end'
                ? 'bg-red-800 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(139,0,0,0.8)] border border-red-600'
                : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
            }`}
          >
            [B] 发起攻占
          </button>
        </div>
      </div>
    </div>
  );
};