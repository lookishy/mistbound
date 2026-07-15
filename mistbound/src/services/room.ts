import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Room, GameState, Player } from '../types/game';

// Helper to generate a random 6-character room code
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Default Map Generation (Static Topology as per rules)
const generateInitialMap = () => {
  // Rough example of 15-20 nodes.
  // In a real scenario, connections (edges) would also be defined here or in a separate constant.
  const nodes = [
    { id: 'start', baseValue: 8 },
    { id: 'path1_a', baseValue: 10 },
    { id: 'path1_b', baseValue: 12 },
    { id: 'path2_a', baseValue: 10 },
    { id: 'hub_mid', baseValue: 20 },
    { id: 'path3_a', baseValue: 15 },
    { id: 'path3_b', baseValue: 15 },
    { id: 'hub_central', baseValue: 25 },
    { id: 'path4_a', baseValue: 12 },
    { id: 'path5_a', baseValue: 10 },
    { id: 'path5_b', baseValue: 12 },
    { id: 'path6_a', baseValue: 10 },
    { id: 'hub_late', baseValue: 20 },
    { id: 'end', baseValue: 8 }
  ];

  const territories: Record<string, any> = {};
  nodes.forEach(node => {
    territories[node.id] = {
      id: node.id,
      baseValue: node.baseValue,
      currentPrice: node.baseValue,
      ownerId: null,
      stolenCount: 0,
      locked: false,
      lastPaid: null
    };
  });

  return territories;
};

export const createRoom = async (hostUser: any): Promise<string> => {
  const roomId = generateRoomId();
  const roomRef = doc(db, 'rooms', roomId);

  // Generate hidden variables x and y (1 to 5)
  const x = Math.floor(Math.random() * 5) + 1;
  const y = Math.floor(Math.random() * 5) + 1;

  const hostPlayer: Player = {
    id: hostUser.uid,
    name: hostUser.displayName || 'Player 1',
    email: hostUser.email,
    avatarUrl: hostUser.photoURL || '',
    isBot: false,
    wallet: { red: 0, blue: 0 },
    connected: true
  };

  const initialGameState: GameState = {
    status: 'waiting',
    winner: null,
    hostId: hostUser.uid,
    players: [hostPlayer],
    currentTurnIndex: 0,
    secretValues: { x, y },
    territories: generateInitialMap(),
    currentEvent: null,
    roundCount: 0,
    logs: [
      {
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: `房间创建成功。等待其他玩家加入... / Room created. Waiting for players...`
      }
    ]
  };

  const roomData: Room = {
    id: roomId,
    createdAt: Date.now(),
    gameState: initialGameState
  };

  await setDoc(roomRef, roomData);
  return roomId;
};

export const joinRoom = async (roomId: string, user: any): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('房间不存在 / Room does not exist');
  }

  const roomData = roomSnap.data() as Room;

  if (roomData.gameState.status !== 'waiting') {
    throw new Error('游戏已开始 / Game has already started');
  }

  if (roomData.gameState.players.length >= 4) {
    throw new Error('房间已满 / Room is full');
  }

  // Check if user is already in the room
  if (roomData.gameState.players.find(p => p.id === user.uid)) {
    return; // Already joined
  }

  const newPlayer: Player = {
    id: user.uid,
    name: user.displayName || `Player ${roomData.gameState.players.length + 1}`,
    email: user.email,
    avatarUrl: user.photoURL || '',
    isBot: false,
    wallet: { red: 0, blue: 0 },
    connected: true
  };

  await updateDoc(roomRef, {
    'gameState.players': arrayUnion(newPlayer),
    'gameState.logs': arrayUnion({
      id: Date.now().toString(),
      timestamp: Date.now(),
      message: `${newPlayer.name} 加入了房间。`
    })
  });
};

export const addBot = async (roomId: string, hostId: string): Promise<void> => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as Room;

    if (roomData.gameState.hostId !== hostId) {
        throw new Error('只有房主可以添加人机 / Only host can add bots');
    }

    if (roomData.gameState.players.length >= 4) {
        throw new Error('房间已满 / Room is full');
    }

    const botCount = roomData.gameState.players.filter(p => p.isBot).length;
    const botPlayer: Player = {
        id: `bot_${Date.now()}`,
        name: `AI 代理 ${botCount + 1}`,
        email: 'bot@system.local',
        avatarUrl: '',
        isBot: true,
        wallet: { red: 0, blue: 0 },
        connected: true
    };

    await updateDoc(roomRef, {
        'gameState.players': arrayUnion(botPlayer),
        'gameState.logs': arrayUnion({
          id: Date.now().toString(),
          timestamp: Date.now(),
          message: `${botPlayer.name} 已被添加。`
        })
    });
};

export const startGame = async (roomId: string, hostId: string): Promise<void> => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as Room;

    if (roomData.gameState.hostId !== hostId) {
        throw new Error('只有房主可以开始游戏 / Only host can start game');
    }

    await updateDoc(roomRef, {
        'gameState.status': 'playing',
        'gameState.logs': arrayUnion({
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: `游戏开始！隐藏资源已生成。 / Game Started!`
        })
    });
}