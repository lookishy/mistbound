import React, { useState } from 'react';
import type { TokenCombo } from '../../../types/game';

interface SpyModalProps {
  wallet: TokenCombo;
  onConfirm: (red: number, blue: number, green: number) => void;
  onCancel: () => void;
  targetName: string;
  hasUsedSpy: boolean;
}

export const SpyModal: React.FC<SpyModalProps> = ({ wallet, onConfirm, onCancel, targetName, hasUsedSpy }) => {
  const [red, setRed] = useState(0);
  const [blue, setBlue] = useState(0);
  const [green, setGreen] = useState(0);

  // We don't know the exact x, y, z values here on the client side perfectly (since they are secret and might not be exposed, wait they are exposed in state, but let's assume we validate on server anyway).
  // The prompt says "实际隐藏总面值必须 >= 5". We can't validate the true sum locally without using the secret values, but since secretValues are actually sent to the client in GameState, we could calculate it. Or we just let the server evaluate it.
  // We'll let the backend evaluate it and just enforce a basic UI check that at least *some* tokens are selected.
  const isZero = red === 0 && blue === 0 && green === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="earth-panel p-8 rounded-xl border-2 border-purple-800 max-w-md w-full relative shadow-[0_0_30px_rgba(128,0,128,0.5)]">
         <h2 className="text-2xl font-black text-purple-400 mb-2 text-center">【间谍潜入】</h2>

         <div className="bg-black/40 p-4 rounded mb-6 text-center border border-purple-900">
            <div className="text-gray-400 text-sm mb-1">目标对象</div>
            <div className="text-lg font-bold text-yellow-500">{targetName}</div>
            <div className="text-xs mt-2 text-purple-300 leading-relaxed">
              派遣间谍需要支付资源作为经费。投入的代币组合其【真实隐藏面值总和】必须 <span className="font-bold text-red-400">≥ 5</span>，否则间谍行动将失败且资源被没收！
            </div>
            {hasUsedSpy && (
                <div className="text-xs mt-2 text-red-500 font-bold animate-pulse">
                    注意：你本回合已经执行过一次间谍行动，无法再次派遣。
                </div>
            )}
         </div>

         <div className="flex justify-between mb-6 gap-3">
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

         <div className="flex gap-4">
             <button
                onClick={onCancel}
                className="flex-1 py-3 rounded font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 transition-all"
             >
                 放弃行动
             </button>
             <button
                disabled={isZero || hasUsedSpy}
                onClick={() => onConfirm(red, blue, green)}
                className="flex-1 py-3 rounded font-bold bg-purple-900 text-white hover:bg-purple-800 border border-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(128,0,128,0.5)]"
             >
                 确认支付并派遣
             </button>
         </div>
      </div>
    </div>
  );
};