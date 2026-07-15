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
        <p className="mt-8 text-xs text-blue-500/50 animate-pulse text-center">Initializing Mistbound Network... v1.0.0
        </p>

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
