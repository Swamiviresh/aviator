import { create } from 'zustand';

export type GameStatus = 'WAITING' | 'RUNNING' | 'CRASHED' | 'STOPPED';

interface Bet {
  userId: number;
  username: string;
  amount: number;
  multiplier: number;
  status: 'pending' | 'cashed_out' | 'lost';
  slotId: number;
  queued?: boolean;
  payout?: number;
}

interface GameState {
  status: GameStatus;
  multiplier: number;
  timer: number;
  crashPoint: number;
  bets: Bet[];
  queuedBets: Bet[];
  history: string[];
  adminStopped: boolean;
  lastCashout: { multiplier: number; payout: number } | null;
  error: string | null;
}

interface GameActions {
  setGameState: (data: Partial<GameState>) => void;
  setLastCashout: (data: { multiplier: number; payout: number } | null) => void;
  setError: (msg: string | null) => void;
  getMyBets: (userId: number) => Bet[];
  getMyQueuedBets: (userId: number) => Bet[];
  reset: () => void;
}

const initialState: GameState = {
  status: 'WAITING',
  multiplier: 1.0,
  timer: 0,
  crashPoint: 1.0,
  bets: [],
  queuedBets: [],
  history: [],
  adminStopped: false,
  lastCashout: null,
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setGameState: (data) => set(data),

  setLastCashout: (data) => set({ lastCashout: data }),

  setError: (msg) => set({ error: msg }),

  getMyBets: (userId) => get().bets.filter((b) => b.userId === userId),

  getMyQueuedBets: (userId) => get().queuedBets.filter((b) => b.userId === userId),

  reset: () => set(initialState),
}));