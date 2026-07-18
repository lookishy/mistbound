import React, { useState } from 'react';
import type { Territory, TokenCombo } from '../../../types/game';

interface BidModalProps {
  territory: Territory;
  wallet: TokenCombo;
  onConfirm: (red: number, blue: number, green: number) => void;
  onCancel: () => void;
}

export const BidModal: React.FC<BidModalProps> = ({ territory, wallet, onConfirm, onCancel }) => {
  const [red, setRed] = useState(0);
  const [blue, setBlue] = useState(0);
  const [green, setGreen] = useState(0);

  const canBid = territory.id !== 'start' && territory.id !== 'end';
  const isInvalid = red === 0 || blue === 0 || green === 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="earth-panel p-8 rounded-xl border-2 border-red-800 shadow-[0_0_30px_rgba(139,0,0,0.5)] w-[500px] max-w-[90vw]">
         <h2 className="text-2xl font-black text-red-500 mb-2 text-center">战术攻占指令</h2>

         <div className="bg-black/40 p-4 rounded mb-6 text-center border border-[#5C4033]">
            <div className="text-gray-400 text-sm mb-1">目标防线</div>
            <div className="text-xl font-bold text-yellow-500">{territory.name}</div>
            {canBid ? (
                <div className="text-sm mt-1 text-gray-300">领地标价: $ <span className="text-white font-bold">{territory.currentPrice}</span></div>
            ) : (
                <div className="text-sm mt-1 text-red-500">该要塞受到神圣庇护，不可被攻占！</div>
            )}
         </div>

         {canBid && (
             <>
                <div className="flex justify-between mb-4 gap-3">
                    <div className="flex-1">
                        <label className="block text-red-400 text-xs mb-1 text-center">红晶 (最大: {wallet.red})</label>
                        <input
                            type="number" min="0" max={wallet.red} value={red}
                            onChange={(e) => setRed(Math.min(wallet.red, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-[#2C241B] border border-red-800 text-red-500 p-2 rounded outline-none text-center text-xl"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-blue-400 text-xs mb-1 text-center">蓝晶 (最大: {wallet.blue})</label>
                        <input
                            type="number" min="0" max={wallet.blue} value={blue}
                            onChange={(e) => setBlue(Math.min(wallet.blue, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-[#2C241B] border border-blue-800 text-blue-500 p-2 rounded outline-none text-center text-xl"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-green-400 text-xs mb-1 text-center">绿晶 (最大: {wallet.green})</label>
                        <input
                            type="number" min="0" max={wallet.green} value={green}
                            onChange={(e) => setGreen(Math.min(wallet.green, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-[#2C241B] border border-green-800 text-green-500 p-2 rounded outline-none text-center text-xl"
                        />
                    </div>
                </div>


                {isInvalid && (
                    <div className="text-red-500 text-sm font-bold text-center mb-2 animate-pulse">
                        战术受限！攻占每个领地必须至少投入 1红、1蓝、1绿晶！
                    </div>
                )}

                <div className="text-xs text-gray-500 text-center mb-6">

                    提示：若攻占失败，投入资源将安全退回库中。
                </div>
             </>
         )}

         <div className="flex gap-4">
             <button
                onClick={onCancel}
                className="flex-1 py-3 rounded font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 transition-all"
             >
                 撤销指令
             </button>
             {canBid && (
                <button
                    disabled={isInvalid}
                    onClick={() => onConfirm(red, blue, green)}
                    className="flex-1 py-3 rounded font-bold bg-red-800 text-white hover:bg-red-700 border border-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(139,0,0,0.5)]"
                >
                    确认攻占
                </button>
             )}
         </div>
      </div>
    </div>
  );
};