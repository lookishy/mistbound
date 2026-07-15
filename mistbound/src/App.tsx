import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { GameScreen } from './components/GameScreen';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { createRoom, joinRoom, addBot, startGame } from './services/room';
import { executePlayerAction } from './engine/executor';
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

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // Pre-Game Lobby
  if (!roomId || !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-mono">
         <h1 className="text-4xl font-bold text-blue-400 mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]">雾境占拓 - LOBBY</h1>

         <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-96 flex flex-col gap-6">
            <button
              onClick={async () => {
                const id = await createRoom(user);
                setRoomId(id);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded"
            >
              创建房间 (CREATE ROOM)
            </button>

            <div className="text-center text-gray-500 text-sm">-- OR --</div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                placeholder="ROOM ID"
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 outline-none uppercase"
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
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
              >
                加入 (JOIN)
              </button>
            </div>
         </div>
      </div>
    );
  }

  // Lobby Waiting State
  if (gameState.status === 'waiting') {
    const isHost = gameState.hostId === user.uid;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-mono">
         <h1 className="text-3xl font-bold text-blue-400 mb-4">ROOM: {roomId}</h1>

         <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-96">
            <h2 className="text-gray-400 border-b border-gray-700 pb-2 mb-4">PLAYERS ({gameState.players.length}/4)</h2>
            <ul className="space-y-2 mb-6">
              {gameState.players.map(p => (
                <li key={p.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                  <span>{p.name} {p.id === gameState.hostId && '(HOST)'}</span>
                  <span className={p.isBot ? "text-yellow-400 text-xs" : "text-green-400 text-xs"}>
                    {p.isBot ? 'BOT' : 'READY'}
                  </span>
                </li>
              ))}
            </ul>

            {isHost && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => addBot(roomId, user.uid)}
                  disabled={gameState.players.length >= 4}
                  className="border border-yellow-600 hover:bg-yellow-900/50 text-yellow-500 py-2 rounded disabled:opacity-50"
                >
                  添加人机 (ADD AI BOT)
                </button>

                <button
                  onClick={() => startGame(roomId, user.uid)}
                  disabled={gameState.players.length < 2} // need at least 2
                  className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold disabled:opacity-50 mt-4"
                >
                  开始游戏 (START GAME)
                </button>
              </div>
            )}

            {!isHost && (
               <div className="text-center text-gray-400 animate-pulse mt-4">等待房主开始游戏...</div>
            )}
         </div>
      </div>
    );
  }

  // Active Game State
  return (
    <GameScreen
      gameState={gameState}
      currentUser={user}
      onActionComplete={async (actionType: any, bidParams?: any) => {
         await executePlayerAction(roomId, gameState, actionType, bidParams);
      }}
    />
  );
}

export default App;