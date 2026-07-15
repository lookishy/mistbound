export type NodeId = string;
export type PlayerId = string;

// The types of system events
export type SpecialEvent = '通货膨胀' | '经济萧条' | '地下赌局' | '地产泡沫破裂' | null;

export interface Player {
  id: PlayerId;
  name: string;
  email: string; // Used for domain verification
  avatarUrl: string;
  isBot: boolean;
  wallet: {
    red: number;
    blue: number;
  };
  connected: boolean;
}

export interface Territory {
  id: NodeId;
  baseValue: number; // Initially set, e.g., 8-25
  currentPrice: number; // Doubles upon each purchase
  ownerId: PlayerId | null; // null if unowned
  stolenCount: number; // Max 3, lock after that
  locked: boolean; // Cannot be stolen anymore
  // Record the original cost to refund the previous owner if stolen
  lastPaid: {
    red: number;
    blue: number;
  } | null;
}

// Global action log for the "left feed"
export interface ActionLog {
  id: string;
  timestamp: number;
  message: string;
}

// Overall Game State
export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerId | null;
  hostId: PlayerId;

  // Players array, max 4
  players: Player[];

  // Whose turn is it right now? (Index of `players` array)
  currentTurnIndex: number;

  // The secret values (1 to 5)
  secretValues: {
    x: number; // Red value
    y: number; // Blue value
  };

  // Territory state
  territories: Record<NodeId, Territory>;

  // Current active event, if any
  currentEvent: SpecialEvent;

  // Track rounds for special events (every 4 rounds)
  roundCount: number;

  // Action feed
  logs: ActionLog[];
}

export interface Room {
  id: string;
  createdAt: number;
  gameState: GameState;
}