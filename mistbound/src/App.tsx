import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { GameScreen } from './components/GameScreen';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { createRoom, joinRoom, addBot, startGame } from './services/room';
import { executePlayerAction, updatePlayerPing, checkAndKickDisconnectedPlayers } from './engine/executor';
import type { GameState, Room } from './types/game';

function App() {
  const [user, setUser] = useState<any>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Firestore Real-time Listener
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Room;
        setGameState(data.gameState);
      }
    });

    return () => unsub();
  }, [roomId]);

  // Ping heartbeat (every 10s)
  useEffect(() => {
    if (!roomId || !gameState || !user) return;
    const interval = setInterval(() => {
       updatePlayerPing(roomId, gameState, user.uid);
    }, 10000);
    return () => clearInterval(interval);
  }, [roomId, gameState, user]);

  // Disconnect checker (Host only, every 15s)
  useEffect(() => {
    if (!roomId || !gameState || !user) return;
    if (gameState.hostId !== user.uid) return; // Only host checks

    const interval = setInterval(() => {
       checkAndKickDisconnectedPlayers(roomId, gameState, user.uid);
    }, 15000);
    return () => clearInterval(interval);
  }, [roomId, gameState, user]);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // Pre-Game Lobby
  if (!roomId || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen earth-bg text-[#E8E0D5] font-mono relative overflow-hidden">
         {/* Title Area */}
         <div className="flex flex-col items-center justify-center z-10 w-1/2 p-8">
             <h1 className="text-6xl font-black text-yellow-600 mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(218,165,32,0.8)]">雾境占拓</h1>

             <div className="earth-panel p-8 rounded-lg w-full max-w-md flex flex-col gap-6">
                <button
                  onClick={async () => {
                    const id = await createRoom(user);
                    setRoomId(id);
                  }}
                  className="bg-red-800 hover:bg-red-700 text-white font-bold py-4 px-4 rounded shadow-[0_0_15px_rgba(139,0,0,0.8)] border border-red-600 transition-all text-xl"
                >
                  建立战局 (CREATE ROOM)
                </button>

                <div className="text-center text-[#5C4033] text-sm">-- 或 --</div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                    placeholder="输入战局识别码"
                    className="flex-1 bg-[#1A1814] border border-[#5C4033] text-yellow-500 rounded px-4 py-3 outline-none uppercase text-lg text-center tracking-widest font-bold"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await joinRoom(inputRoomId, user);
                        setRoomId(inputRoomId);
                      } catch(e: any) {
                        alert(e.message);
                      }
                    }}
                    className="bg-[#5C4033] hover:bg-[#8B5A2B] text-white font-bold py-3 px-6 rounded transition-all"
                  >
                    加入战局
                  </button>
                </div>
             </div>
         </div>

         {/* Rules Area */}
         <div className="w-1/2 h-screen border-l-2 border-[#5C4033] p-10 overflow-y-auto bg-black/40 z-10 scrollbar-thin scrollbar-thumb-[#5C4033]">
            <h2 className="text-3xl font-black text-yellow-500 mb-6 border-b border-[#5C4033] pb-2">作战守则</h2>

            <div className="space-y-6 text-gray-300 leading-relaxed">
               <section>
                  <h3 className="text-xl font-bold text-white mb-2">1. 战役目标</h3>
                  <p>在此绝密战区，你的目标是建立一条从【大本营(起)】到【敌军之冠(终)】的连续防线连通图。率先贯通战线者即可夺取最终胜利。</p>
               </section>

               <section>
                  <h3 className="text-xl font-bold text-white mb-2">2. 军备补给（红晶与蓝晶）</h3>
                  <p>回合内，若不执行攻占，可呼叫一次“后勤补给”。你将从两套随机物资中任选其一。红蓝晶矿的隐秘市价随战局波动，切勿让敌军洞悉你的底牌。</p>
               </section>

               <section>
                  <h3 className="text-xl font-bold text-white mb-2">3. 攻占与掠夺防线</h3>
                  <p>在地图点击目标节点并发起“攻占”。若投入的红蓝晶隐性总价值大于等于当前防线强度，攻占成功。此时防线强度翻倍！</p>
                  <p className="text-red-400 mt-1">注意：你可以强行掠夺他人防线。一旦掠夺成功，原防线驻军将获得【全额撤退补偿】（退回原先投入的晶矿）。但同一防线最多易手3次，第3次后将陷入永久封锁（不可掠夺）。</p>
               </section>

               <section>
                  <h3 className="text-xl font-bold text-yellow-500 mb-2">4. 战争风暴（突发事件）</h3>
                  <p>每经历 4 轮交火，必发全局事件：</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li><span className="text-red-400 font-bold">通货膨胀：</span>所有无主之地防御强度 +2</li>
                    <li><span className="text-green-400 font-bold">经济萧条：</span>所有无主之地防御强度 -2</li>
                    <li><span className="text-purple-400 font-bold">地下赌局：</span>全员强行下注，命运之轮独揽奖池！</li>
                    <li><span className="text-yellow-600 font-bold">防线崩溃：</span>所有已占领防线的翻倍溢价被抹除，恢复初始底价！</li>
                  </ul>
               </section>
            </div>
         </div>
      </div>
    );
  }

  // Lobby Waiting State
  if (gameState.status === 'waiting') {
    const isHost = gameState.hostId === user.uid;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen earth-bg text-[#E8E0D5] font-mono">
         <h1 className="text-3xl font-bold text-yellow-600 mb-2">战局识别码</h1>
         <div className="text-5xl font-black text-white tracking-[0.2em] mb-8 bg-black/50 px-6 py-2 rounded border border-[#5C4033] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {roomId}
         </div>

         <div className="earth-panel p-6 rounded-lg w-[400px]">
            <h2 className="text-gray-400 border-b border-[#5C4033] pb-2 mb-4 font-bold flex justify-between">
              <span>已连线指挥官</span>
              <span>{gameState.players.length}/4</span>
            </h2>
            <ul className="space-y-3 mb-8">
              {gameState.players.map(p => (
                <li key={p.id} className="flex justify-between items-center bg-[#1A1814] border border-[#5C4033] p-3 rounded shadow-inner">
                  <span className="font-bold">{p.name} {p.id === gameState.hostId && <span className="text-yellow-500 text-xs ml-2">[战局主官]</span>}</span>
                  <span className={p.isBot ? "text-blue-500 text-xs font-bold border border-blue-800 px-2 py-1 rounded" : "text-green-500 text-xs font-bold border border-green-800 px-2 py-1 rounded"}>
                    {p.isBot ? 'AI 僚机就绪' : '信号稳定'}
                  </span>
                </li>
              ))}
            </ul>

            {isHost && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => addBot(roomId, user.uid)}
                  disabled={gameState.players.length >= 4}
                  className="border-2 border-blue-900 hover:bg-blue-900/50 text-blue-400 py-3 rounded disabled:opacity-50 font-bold transition-all"
                >
                  分配 AI 僚机
                </button>

                <button
                  onClick={() => startGame(roomId, user.uid)}
                  disabled={gameState.players.length < 2}
                  className="bg-red-800 hover:bg-red-700 text-white py-4 rounded font-bold disabled:opacity-50 shadow-[0_0_15px_rgba(139,0,0,0.5)] transition-all text-lg"
                >
                  发动进攻 (START)
                </button>
              </div>
            )}

            {!isHost && (
               <div className="text-center text-yellow-500 font-bold animate-pulse mt-4 bg-black/40 py-3 rounded">等待主官下达作战指令...</div>
            )}
         </div>
      </div>
    );
  }

  // Active Game State
  return (
    <GameScreen
      roomId={roomId} gameState={gameState}
      currentUser={user}
      onActionComplete={async (actionType: any, bidParams?: any) => {
         await executePlayerAction(roomId, gameState, actionType, bidParams);
      }}
    />
  );
}

export default App;