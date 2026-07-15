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
    <div className="h-full bg-gray-900 border border-blue-800 rounded p-4 flex flex-col font-mono">
      <div className="mb-4">
        <h3 className="text-gray-400 text-xs mb-1 uppercase">Your Wallet</h3>
        <div className="flex gap-4">
          <div className="bg-red-900/30 border border-red-500 rounded p-2 flex-1 text-center">
            <span className="text-red-400 font-bold text-xl">{currentPlayer.wallet.red}</span>
            <span className="text-red-500/50 text-xs block">RED</span>
          </div>
          <div className="bg-blue-900/30 border border-blue-500 rounded p-2 flex-1 text-center">
            <span className="text-blue-400 font-bold text-xl">{currentPlayer.wallet.blue}</span>
            <span className="text-blue-500/50 text-xs block">BLUE</span>
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
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          [A] 赚钱 (EARN MONEY)
        </button>

        <hr className="border-gray-700" />

        {/* Action 2: Bid */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="text-xs text-gray-400 mb-2">
            Target: {selectedTerritory ? <span className="text-white font-bold">{selectedTerritory.id.toUpperCase()} (Current: ${selectedTerritory.currentPrice})</span> : 'Select a node'}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min="0"
              max={currentPlayer.wallet.red}
              value={bidRed}
              onChange={(e) => setBidRed(Number(e.target.value))}
              className="w-full bg-gray-900 border border-red-500 text-red-400 p-2 rounded outline-none"
              placeholder="Red"
            />
            <input
              type="number"
              min="0"
              max={currentPlayer.wallet.blue}
              value={bidBlue}
              onChange={(e) => setBidBlue(Number(e.target.value))}
              className="w-full bg-gray-900 border border-blue-500 text-blue-400 p-2 rounded outline-none"
              placeholder="Blue"
            />
          </div>

          <button
            disabled={!isMyTurn || !selectedTerritory || (bidRed === 0 && bidBlue === 0)}
            onClick={() => {
              onBid(bidRed, bidBlue);
              setBidRed(0);
              setBidBlue(0);
            }}
            className={`w-full py-3 rounded font-bold transition-all ${
              isMyTurn && selectedTerritory && (bidRed > 0 || bidBlue > 0)
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            [B] 报价 (BID)
          </button>
        </div>
      </div>
    </div>
  );
};
