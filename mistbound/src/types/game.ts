export type NodeId = string;
export type PlayerId = string;

export type SpecialEvent = '通货膨胀' | '经济萧条' | '地下赌局' | '地产泡沫破裂' | null;

export interface TokenCombo {
  red: number;
  blue: number;
  green: number;
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
  name: string;
  baseValue: number;
  currentPrice: number;
  ownerId: PlayerId | null;
  stolenCount: number;
  ownerHistory: PlayerId[];
  locked: boolean;
  lastPaid: TokenCombo | null;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  message: string;
  isBid?: boolean;
  buyerId?: string;
  cost?: TokenCombo;
  targetName?: string;
  privateTo?: string;
}

export interface GambleState {
  active: boolean;
  bets: Record<PlayerId, number>;
  pot: number;
  winner: PlayerId | null;
  phase: 'betting' | 'spinning' | 'resolved';
}

export interface GameState {
  status: 'waiting' | 'playing' | 'event' | 'finished'; // Added 'event' for freezing game flow during overlay
  winner: PlayerId | null;
  hostId: PlayerId;

  players: Player[];
  currentTurnIndex: number;

  secretValues: {
    x: number;
    y: number;
    z: number;
  };

  spyUsed: boolean;

  territories: Record<NodeId, Territory>;

  currentEvent: SpecialEvent;
  pendingEvent: SpecialEvent; // The event about to be resolved

  pendingDrawCards: [TokenCombo, TokenCombo] | null;
  gambleState: GambleState | null;

  roundCount: number;
  logs: ActionLog[];

  turnStartTime: number;
  turnExtension: 'none' | 'pending' | 'granted';
  turnExtensionTime: number;
}

export interface Room {
  id: string;
  createdAt: number;
  gameState: GameState;
}