export type NodeId = string;
export type PlayerId = string;

// The types of system events
export type SpecialEvent = '通货膨胀' | '经济萧条' | '地下赌局' | '地产泡沫破裂' | null;

export interface TokenCombo {
  red: number;
  blue: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  email: string;
  avatarUrl: string;
  isBot: boolean;
  wallet: TokenCombo;
  connected: boolean;
}

export interface Territory {
  id: NodeId;
  name: string; // 中文名
  baseValue: number;
  currentPrice: number;
  ownerId: PlayerId | null;
  stolenCount: number;
  locked: boolean;
  lastPaid: TokenCombo | null;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  message: string;
}

export interface GambleState {
  active: boolean;
  bets: Record<PlayerId, number>; // How many total tokens bet (max 2)
  pot: number;
  winner: PlayerId | null;
  phase: 'betting' | 'spinning' | 'resolved';
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerId | null;
  hostId: PlayerId;

  players: Player[];
  currentTurnIndex: number;

  secretValues: {
    x: number;
    y: number;
  };

  territories: Record<NodeId, Territory>;

  currentEvent: SpecialEvent;

  // For the "Choose 1 of 2 cards" mechanic
  pendingDrawCards: [TokenCombo, TokenCombo] | null;

  // For gambling event
  gambleState: GambleState | null;

  roundCount: number;
  logs: ActionLog[];
}

export interface Room {
  id: string;
  createdAt: number;
  gameState: GameState;
}