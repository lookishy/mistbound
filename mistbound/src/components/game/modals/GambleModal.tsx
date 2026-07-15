import React, { useEffect } from 'react';
import type { GameState, PlayerId } from '../../../types/game';

interface GambleModalProps {
  gameState: GameState;
  myPlayerId: PlayerId;
  onBet: (amount: number) => void;
  onResolve: () => void;
}

export const GambleModal: React.FC<GambleModalProps> = ({ gameState, myPlayerId, onBet, onResolve }) => {
  const gamble = gameState.gambleState;
  if (!gamble || !gamble.active) return null;

  const myPlayer = gameState.players.find(p => p.id === myPlayerId)!;
  const hasBet = gamble.bets[myPlayerId] !== undefined;

  // Max bet is 2, or whatever total tokens they have
  const maxBet = Math.min(2, myPlayer.wallet.red + myPlayer.wallet.blue);


  // Check if all players have bet
  useEffect(() => {
    if (gamble.phase === 'betting') {
       const allBet = gameState.players.every(p => gamble.bets[p.id] !== undefined);
       if (allBet && gameState.players[gameState.currentTurnIndex].id === myPlayerId) {
          // If it's my turn, trigger resolve
          onResolve();
       }
    }
  }, [gamble.bets, gamble.phase, gameState.players]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90">
      <div className="earth-panel p-8 rounded-xl w-[500px] border-2 border-yellow-700 shadow-[0_0_50px_rgba(184,134,11,0.5)] flex flex-col items-center">

        <h2 className="text-3xl font-black text-yellow-500 mb-6 drop-shadow-md">命运轮盘 - 地下赌局</h2>

        {gamble.phase === 'betting' && (
          <div className="w-full text-center">
             <div className="text-xl mb-4">总奖池: <span className="text-yellow-400 font-bold text-3xl">{gamble.pot}</span> 资源</div>

             <div className="space-y-2 mb-6 text-left">
               {gameState.players.map(p => (
                 <div key={p.id} className="flex justify-between items-center bg-black/50 p-2 rounded">
                    <span>{p.name}</span>
                    <span className={gamble.bets[p.id] !== undefined ? 'text-green-500' : 'text-gray-500'}>
                      {gamble.bets[p.id] !== undefined ? `已押注 ${gamble.bets[p.id]}` : '思考中...'}
                    </span>
                 </div>
               ))}
             </div>

             {!hasBet ? (
               <div className="flex flex-col gap-4">
                 <p className="text-sm text-gray-400">选择你要投入的资源数（最高2点）：</p>
                 <div className="flex justify-center gap-4">
                   {[0, 1, 2].map(amt => {
                     if (amt > maxBet) return null;
                     return (
                        <button
                          key={amt}
                          onClick={() => onBet(amt)}
                          className="bg-yellow-800 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded border border-yellow-500 transition-all"
                        >
                          押注 {amt}
                        </button>
                     );
                   })}
                 </div>
               </div>
             ) : (
                <div className="text-yellow-400 animate-pulse text-lg font-bold">等待其他指挥官下注...</div>
             )}
          </div>
        )}

        {gamble.phase === 'spinning' && (
           <div className="w-full flex flex-col items-center">
              <div className="relative w-64 h-64 border-4 border-yellow-600 rounded-full flex items-center justify-center bg-gray-900 overflow-hidden shadow-[0_0_30px_rgba(218,165,32,0.8)]">
                  <div className="absolute w-full h-full animate-[spin_0.5s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, #8B0000, #00008B, #006400, #DAA520, #8B0000)' }}></div>
                  <div className="absolute w-56 h-56 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-4xl animate-pulse">🎲</span>
                  </div>
              </div>
              <h3 className="text-2xl mt-8 animate-pulse text-yellow-500">命运之轮转动中...</h3>
           </div>
        )}

        {gamble.phase === 'resolved' && (
           <div className="w-full text-center">
              <h3 className="text-4xl text-yellow-400 font-black mb-4 animate-bounce">
                🎉 {gameState.players.find(p => p.id === gamble.winner)?.name} 独揽大奖！ 🎉
              </h3>
              <p className="text-2xl text-white">赢得了 <span className="text-yellow-500 font-bold">{gamble.pot}</span> 个资源！</p>
           </div>
        )}

      </div>
    </div>
  );
};