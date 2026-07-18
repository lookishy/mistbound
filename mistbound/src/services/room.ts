import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Room, GameState, Player, Territory } from '../types/game';

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();


// Expanded Map Generation (18 nodes + start + end)
const generateInitialMap = () => {
  const nodes = [
    { id: 'start', name: '大本营(起)', baseValue: 0 },

    // Front Line
    { id: 'node_f1', name: '破晓营地', baseValue: 8 },
    { id: 'node_f2', name: '迷雾裂谷', baseValue: 10 },
    { id: 'node_f3', name: '前哨堡垒', baseValue: 8 },
    { id: 'node_f4', name: '风暴之眼', baseValue: 12 },

    // Mid Line 1
    { id: 'node_m1', name: '铁血长廊', baseValue: 15 },
    { id: 'node_m2', name: '暗影沼泽', baseValue: 12 },
    { id: 'node_m3', name: '中枢要塞', baseValue: 20 },
    { id: 'node_m4', name: '烈焰深渊', baseValue: 15 },
    { id: 'node_m5', name: '荆棘岭', baseValue: 10 },

    // Mid Line 2
    { id: 'node_m6', name: '龙骨荒野', baseValue: 18 },
    { id: 'node_m7', name: '水晶矿脉', baseValue: 15 },
    { id: 'node_m8', name: '静默之地', baseValue: 12 },
    { id: 'node_m9', name: '雷霆巅峰', baseValue: 18 },

    // Back Line
    { id: 'node_b1', name: '血月祭坛', baseValue: 22 },
    { id: 'node_b2', name: '绝对防线', baseValue: 25 },
    { id: 'node_b3', name: '永冻冰川', baseValue: 20 },
    { id: 'node_b4', name: '虚空裂隙', baseValue: 22 },
    { id: 'node_b5', name: '末日守望', baseValue: 18 },

    { id: 'end', name: '敌军之冠(终)', baseValue: 0 }
  ];

  const territories: Record<string, Territory> = {};
  nodes.forEach(node => {
    const scaledBaseValue = Math.ceil(node.baseValue * 1.5);
    territories[node.id] = {
      id: node.id,
      name: node.name,
      baseValue: scaledBaseValue,
      currentPrice: scaledBaseValue,
      ownerId: null,
      stolenCount: 0,
      ownerHistory: [],
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
  const z = Math.floor(Math.random() * 5) + 1;

  const hostPlayer: Player = {
    id: hostUser.uid,
    name: hostUser.displayName || '玩家 1',
    email: hostUser.email,
    avatarUrl: hostUser.photoURL || '',
    isBot: false,
    wallet: { red: 0, blue: 0, green: 0 },
    connected: true,

  };

  const initialGameState: GameState = {
    status: 'waiting',
    winner: null,
    hostId: hostUser.uid,
    players: [hostPlayer],
    currentTurnIndex: 0,
    secretValues: { x, y, z },
    spyUsed: false,
    territories: generateInitialMap(),
    currentEvent: null,
    pendingEvent: null,
    pendingDrawCards: null,
    gambleState: null,
    roundCount: 0,
    turnStartTime: Date.now(),
    turnExtension: 'none',
    turnExtensionTime: 0,
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

  if (roomData.gameState.players.length >= 8) {
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
    wallet: { red: 0, blue: 0, green: 0 },
    connected: true,

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

    if (roomData.gameState.players.length >= 8) {
        throw new Error('战局已满员');
    }

    const botCount = roomData.gameState.players.filter(p => p.isBot).length;
    const botPlayer: Player = {
        id: `bot_${Date.now()}`,
        name: `AI 僚机 ${botCount + 1}`,
        email: 'bot@system.local',
        avatarUrl: '',
        isBot: true,
        wallet: { red: 0, blue: 0, green: 0 },
        connected: true,

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