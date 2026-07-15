import React from 'react';
import type { Player } from '../../types/game';

interface ControlPanelProps {
  currentPlayer: Player | null;
  isMyTurn: boolean;
  onEarnMoney: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentPlayer,
  isMyTurn,
  onEarnMoney
}) => {
  if (!currentPlayer) return null;

  return (
    <div className="h-full earth-panel rounded p-4 flex flex-col font-mono relative">
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
          className={`w-full py-4 rounded-lg font-bold transition-all text-lg ${
            isMyTurn
              ? 'bg-green-800 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(0,100,0,0.8)] border-2 border-green-500 animate-pulse'
              : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
          }`}
        >
          [A] 呼叫后勤补给
        </button>

        <hr className="border-[#5C4033] my-4" />

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>提示：若需攻占领地，请直接在大地图上点击目标节点。</p>
        </div>
      </div>
    </div>
  );
};