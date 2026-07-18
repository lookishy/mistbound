import React from 'react';
import type { TokenCombo } from '../../../types/game';

interface DrawModalProps {
  options: [TokenCombo, TokenCombo] | null;
  onSelect: (combo: TokenCombo) => void;
  onCancel?: () => void;
}

export const DrawModal: React.FC<DrawModalProps> = ({ options, onSelect, onCancel }) => {
  if (!options) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="earth-panel p-8 rounded-xl border-2 border-green-800 shadow-[0_0_30px_rgba(0,100,0,0.5)]">
         <h2 className="text-2xl font-black text-green-500 mb-6 text-center border-b border-green-800 pb-4">【后勤补给】请选择你要获取的物资批次</h2>

         <div className="flex gap-8 justify-center mb-8">
            {options.map((combo, i) => (
              <button
                key={i}
                onClick={() => onSelect(combo)}
                className="group w-48 h-56 bg-gray-900 border-2 border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all hover:-translate-y-2 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="text-3xl font-black text-gray-400 group-hover:text-green-400 mb-4 transition-colors">方案 {i+1}</div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                     <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.8)] mb-2 flex items-center justify-center font-bold text-white">
                        {combo.red}
                     </div>
                     <span className="text-xs text-red-400">红晶</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-blue-800 shadow-[0_0_10px_rgba(37,99,235,0.8)] mb-2 flex items-center justify-center font-bold text-white">
                        {combo.blue}
                     </div>
                     <span className="text-xs text-blue-400">蓝晶</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-green-800 shadow-[0_0_10px_rgba(0,128,0,0.8)] mb-2 flex items-center justify-center font-bold text-white">
                        {combo.green}
                     </div>
                     <span className="text-xs text-green-400">绿晶</span>
                  </div>
                </div>
              </button>
            ))}
         </div>

         {onCancel && (
             <div className="flex justify-center">
                <button
                    onClick={onCancel}
                    className="py-3 px-8 rounded font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 transition-all"
                >
                    取消 / 返回大地图
                </button>
             </div>
         )}
      </div>
    </div>
  );
};