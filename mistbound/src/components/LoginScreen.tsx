import React, { useState } from 'react';
import { loginWithGoogle } from '../services/firebase';

export const LoginScreen: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const user = await loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-mono">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-bold text-blue-400 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]">
          雾境占拓
        </h1>
        <p className="text-xl text-gray-400">Mistbound - Strategy Board Game</p>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">系统登录 / System Login</h2>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition duration-200 border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
        >
          使用 Google 账号登录
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          * 仅限 @tsunjin.edu.my 域名用户</p>



        <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-gray-400">
           <h3 className="font-bold text-yellow-500 mb-2">作战规则简介：</h3>
           <ul className="list-disc pl-5 space-y-2">
             <li><span className="text-white">战役目标：</span>建立从起点到终点的连续防线。</li>
             <li><span className="text-white">最高机密：</span>系统每局暗中赋予红蓝晶 1-5 之间不同的价值。</li>
             <li><span className="text-white">防线争夺：</span>投入资源价值大等于标价即可占领，原主获全额退款。</li>
             <li><span className="text-yellow-400">锁定机制：</span>当房间人数为 1 至 4 人时，每个领地最多允许易主 3 次；当房间人数为 5 至 8 人时，每个领地最多允许易主 6 次，达到上限后领地将永久锁定。</li>
           </ul>
        </div>



        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
