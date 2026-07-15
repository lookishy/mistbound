import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Room, GameState, Player, Territory } from '../types/game';

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Default Map Generation (Static Topology with Chinese Names)
const generateInitialMap = () => {
  const nodes = [
    { id: 'start', name: '大本营(起)', baseValue: 0 }, // no price
    { id: 'path1_a', name: '蛮荒之地', baseValue: 10 },
    { id: 'path1_b', name: '绿野仙踪', baseValue: 12 },
    { id: 'path2_a', name: '风暴峭壁', baseValue: 10 },
    { id: 'hub_mid', name: '中立要塞', baseValue: 20 },
    { id: 'path3_a', name: '烈焰峡谷', baseValue: 15 },
    { id: 'path3_b', name: '迷雾旷野', baseValue: 15 },
    { id: 'hub_central', name: '中央枢纽', baseValue: 25 },
    { id: 'path4_a', name: '冰封雪域', baseValue: 12 },
    { id: 'path5_a', name: '幽暗密林', baseValue: 10 },
    { id: 'path5_b', name: '死亡沼泽', baseValue: 12 },
    { id: 'path6_a', name: '哀嚎深渊', baseValue: 10 },
    { id: 'hub_late', name: '决战高地', baseValue: 20 },
    { id: 'end', name: '敌军之冠(终)', baseValue: 0 } // no price
  ];

  const territories: Record<string, Territory> = {};
  nodes.forEach(node => {
    territories[node.id] = {
      id: node.id,
      name: node.name,
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

  const x = Math.floor(Math.random() * 5) + 1;
  const y = Math.floor(Math.random() * 5) + 1;

  const hostPlayer: Player = {
    id: hostUser.uid,
    name: hostUser.displayName || '玩家 1',
    email: hostUser.email,
    avatarUrl: hostUser.photoURL || '',
    isBot: false,
    wallet: { red: 0, blue: 0 },
    connected: true,
    lastPing: Date.now()
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
    pendingEvent: null,
    pendingDrawCards: null,
    gambleState: null,
    roundCount: 0,
    logs: [
      {
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: `战局创建完毕，等待其他指挥官加入...`
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
    throw new Error('未找到该战局');
  }

  const roomData = roomSnap.data() as Room;

  if (roomData.gameState.status !== 'waiting') {
    throw new Error('战斗已打响，无法加入');
  }

  if (roomData.gameState.players.length >= 4) {
    throw new Error('战局已满员');
  }

  if (roomData.gameState.players.find(p => p.id === user.uid)) {
    return;
  }

  const newPlayer: Player = {
    id: user.uid,
    name: user.displayName || `玩家 ${roomData.gameState.players.length + 1}`,
    email: user.email,
    avatarUrl: user.photoURL || '',
    isBot: false,
    wallet: { red: 0, blue: 0 },
    connected: true,
    lastPing: Date.now()
  };

  await updateDoc(roomRef, {
    'gameState.players': arrayUnion(newPlayer),
    'gameState.logs': arrayUnion({
      id: Date.now().toString(),
      timestamp: Date.now(),
      message: `${newPlayer.name} 已连线并加入战局。`
    })
  });
};

export const addBot = async (roomId: string, hostId: string): Promise<void> => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as Room;

    if (roomData.gameState.hostId !== hostId) {
        throw new Error('指挥权限不足（仅限房主）');
    }

    if (roomData.gameState.players.length >= 4) {
        throw new Error('战局已满员');
    }

    const botCount = roomData.gameState.players.filter(p => p.isBot).length;
    const botPlayer: Player = {
        id: `bot_${Date.now()}`,
        name: `AI 僚机 ${botCount + 1}`,
        email: 'bot@system.local',
        avatarUrl: '',
        isBot: true,
        wallet: { red: 0, blue: 0 },
        connected: true,
    lastPing: Date.now()
    };

    await updateDoc(roomRef, {
        'gameState.players': arrayUnion(botPlayer),
        'gameState.logs': arrayUnion({
          id: Date.now().toString(),
          timestamp: Date.now(),
          message: `${botPlayer.name} 已激活。`
        })
    });
};

export const startGame = async (roomId: string, hostId: string): Promise<void> => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as Room;

    if (roomData.gameState.hostId !== hostId) {
        throw new Error('指挥权限不足');
    }

    await updateDoc(roomRef, {
        'gameState.status': 'playing',
        'gameState.logs': arrayUnion({
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: `【系统提示】战斗正式打响！黑箱数据已生成。`
        })
    });
}