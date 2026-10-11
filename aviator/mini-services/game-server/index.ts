import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasources: { db: { url: `file:/home/z/my-project/db/custom.db` } },
});

// ── Types ────────────────────────────────────────────────────────
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
  status: 'WAITING' | 'RUNNING' | 'CRASHED' | 'STOPPED';
  multiplier: number;
  timer: number;
  crashPoint: number;
  bets: Bet[];
  queuedBets: Bet[];
  history: string[];
  adminStopped: boolean;
}

// ── Game Engine ─────────────────────────────────────────────────
const WAIT_TIME = 9;
const TICK_INTERVAL = 100; // ms

const state: GameState = {
  status: 'WAITING',
  multiplier: 1.0,
  timer: 0,
  crashPoint: 1.0,
  bets: [],
  queuedBets: [],
  history: [],
  adminStopped: false,
};

let broadcastInterval: ReturnType<typeof setInterval> | null = null;

function generateCrashPoint(): number {
  const random = Math.random();
  if (random < 0.03) return 1.0;
  return Math.round((0.99 / (1 - random)) * 100) / 100;
}

function broadcastState(io: Server) {
  io.emit('gameUpdate', {
    status: state.status,
    multiplier: state.multiplier.toFixed(2),
    timer: state.timer.toFixed(1),
    bets: state.bets,
    queuedBets: state.queuedBets,
    history: state.history,
    adminStopped: state.adminStopped,
  });
}

async function updateBalance(userId: number, amount: number, type: string, description: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newBalance = user.balance + amount;
  await db.user.update({ where: { id: userId }, data: { balance: newBalance } });

  const txType = type === 'game' ? (amount < 0 ? 'bet' : 'cashout') : type;

  await db.transaction.create({
    data: {
      userId,
      amount: Math.abs(amount),
      type: txType,
      description,
    },
  });

  // Notify user of balance change
  io.to(`user-${userId}`).emit('balanceUpdate', { balance: newBalance });
}

async function saveLostBets(bets: Bet[]) {
  for (const bet of bets) {
    await db.bet.create({
      data: {
        userId: bet.userId,
        amount: bet.amount,
        multiplier: state.multiplier,
        payout: 0,
        status: 'lost',
        slotId: bet.slotId,
      },
    });
  }
}

// ── Round Lifecycle ─────────────────────────────────────────────
function prepareNewRound(io: Server) {
  if (state.adminStopped) {
    state.status = 'STOPPED';
    broadcastState(io);
    return;
  }

  state.status = 'WAITING';
  state.multiplier = 1.0;
  state.crashPoint = generateCrashPoint();

  // Move queued bets into current round
  state.bets = [...state.queuedBets];
  state.queuedBets = [];

  state.timer = WAIT_TIME;
  broadcastState(io);

  if (broadcastInterval) clearInterval(broadcastInterval);

  broadcastInterval = setInterval(() => {
    state.timer -= 0.1;
    if (state.timer < 0) state.timer = 0;
    broadcastState(io);

    if (state.timer <= 0) {
      if (broadcastInterval) clearInterval(broadcastInterval);
      if (state.adminStopped) {
        state.status = 'STOPPED';
        broadcastState(io);
      } else {
        runRound(io);
      }
    }
  }, TICK_INTERVAL);
}

function runRound(io: Server) {
  state.status = 'RUNNING';
  broadcastState(io);

  if (broadcastInterval) clearInterval(broadcastInterval);

  broadcastInterval = setInterval(() => {
    state.multiplier += 0.01 * (state.multiplier / 2);
    state.multiplier = Math.round(state.multiplier * 100) / 100;
    broadcastState(io);

    if (state.multiplier >= state.crashPoint) {
      if (broadcastInterval) clearInterval(broadcastInterval);
      crash(io);
    }
  }, TICK_INTERVAL);
}

async function crash(io: Server) {
  state.status = 'CRASHED';
  state.multiplier = state.crashPoint;
  state.history.unshift(state.crashPoint.toFixed(2));
  if (state.history.length > 20) state.history.pop();

  const lostBets = state.bets.filter((b) => b.status === 'pending');
  lostBets.forEach((b) => { b.status = 'lost'; });

  broadcastState(io);

  // Save lost bets to DB in background
  saveLostBets(lostBets).catch((err) => console.error('Error saving lost bets:', err));

  setTimeout(() => {
    prepareNewRound(io);
  }, 3000);
}

// ── Socket Server ───────────────────────────────────────────────
const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send current state immediately
  socket.emit('gameUpdate', {
    status: state.status,
    multiplier: state.multiplier.toFixed(2),
    timer: state.timer.toFixed(1),
    bets: state.bets,
    queuedBets: state.queuedBets,
    history: state.history,
    adminStopped: state.adminStopped,
  });

  // Authenticate socket
  socket.on('authenticate', (data: { userId: number; token: string }) => {
    socket.join(`user-${data.userId}`);
    console.log(`Socket ${socket.id} authenticated as user ${data.userId}`);
  });

  // Place bet
  socket.on('placeBet', async (data: { userId: number; username: string; amount: number; slotId: number }) => {
    try {
      const { userId, username, amount, slotId } = data;

      if (state.status === 'STOPPED') {
        socket.emit('betError', { message: 'Game is stopped by admin' });
        return;
      }

      // If round is live, queue the bet
      if (state.status === 'RUNNING' || state.status === 'CRASHED') {
        if (state.queuedBets.some((b) => b.userId === userId && b.slotId === slotId)) {
          socket.emit('betError', { message: 'You already have a queued bet for this slot' });
          return;
        }

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user || user.balance < amount) {
          socket.emit('betError', { message: 'Insufficient balance' });
          return;
        }

        await updateBalance(userId, -amount, 'bet', `Queued bet for slot ${slotId}`);
        const bet: Bet = { userId, username, amount, multiplier: 0, status: 'pending', slotId, queued: true };
        state.queuedBets.push(bet);
        broadcastState(io);
        socket.emit('betPlaced', { ...bet, message: 'Bet queued for next round' });
        return;
      }

      if (state.status !== 'WAITING') {
        socket.emit('betError', { message: 'Cannot place bet right now' });
        return;
      }

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < amount) {
        socket.emit('betError', { message: 'Insufficient balance' });
        return;
      }

      if (state.bets.some((b) => b.userId === userId && b.slotId === slotId)) {
        socket.emit('betError', { message: 'Already placed a bet in this slot' });
        return;
      }

      await updateBalance(userId, -amount, 'bet', `Placed bet in slot ${slotId}`);
      const bet: Bet = { userId, username, amount, multiplier: 0, status: 'pending', slotId };
      state.bets.push(bet);
      broadcastState(io);
      socket.emit('betPlaced', bet);
    } catch (error) {
      console.error('Place bet error:', error);
      socket.emit('betError', { message: 'Failed to place bet' });
    }
  });

  // Cashout
  socket.on('cashout', async (data: { userId: number; slotId: number }) => {
    try {
      const { userId, slotId } = data;

      if (state.status !== 'RUNNING') {
        socket.emit('cashoutError', { message: 'Game is not running' });
        return;
      }

      const bet = state.bets.find((b) => b.userId === userId && b.slotId === slotId && b.status === 'pending');
      if (!bet) {
        socket.emit('cashoutError', { message: 'No active bet in this slot' });
        return;
      }

      const payout = Math.round(bet.amount * state.multiplier * 100) / 100;
      bet.multiplier = state.multiplier;
      bet.status = 'cashed_out';
      bet.payout = payout;

      await updateBalance(userId, payout, 'cashout', `Cashed out at ${state.multiplier.toFixed(2)}x`);

      await db.bet.create({
        data: {
          userId: bet.userId,
          amount: bet.amount,
          multiplier: bet.multiplier,
          payout,
          status: 'cashed_out',
          slotId: bet.slotId,
        },
      });

      broadcastState(io);
      socket.emit('cashoutSuccess', { multiplier: bet.multiplier, payout });
    } catch (error) {
      console.error('Cashout error:', error);
      socket.emit('cashoutError', { message: 'Failed to cash out' });
    }
  });

  // Cancel bet
  socket.on('cancelBet', async (data: { userId: number; slotId: number }) => {
    try {
      const { userId, slotId } = data;

      const betInQueue = state.queuedBets.find((b) => b.userId === userId && b.slotId === slotId);
      const betInWaiting =
        state.status === 'WAITING'
          ? state.bets.find((b) => b.userId === userId && b.slotId === slotId && b.status === 'pending')
          : null;

      const bet = betInQueue || betInWaiting;
      if (!bet) {
        socket.emit('cancelError', { message: 'No cancellable bet found' });
        return;
      }

      await updateBalance(userId, bet.amount, 'credit', `Cancelled bet in slot ${slotId}`);

      if (betInQueue) {
        state.queuedBets = state.queuedBets.filter((b) => !(b.userId === userId && b.slotId === slotId));
      } else {
        state.bets = state.bets.filter((b) => !(b.userId === userId && b.slotId === slotId));
      }

      broadcastState(io);
      socket.emit('cancelSuccess', { refunded: bet.amount });
    } catch (error) {
      console.error('Cancel bet error:', error);
      socket.emit('cancelError', { message: 'Failed to cancel bet' });
    }
  });

  // Admin controls
  socket.on('adminControl', (data: { userId: number; action: 'start' | 'stop' | 'crash' }) => {
    // In production, verify admin role here
    const { action } = data;

    if (action === 'crash' && state.status === 'RUNNING') {
      state.multiplier = state.crashPoint;
      if (broadcastInterval) clearInterval(broadcastInterval);
      crash(io);
      socket.emit('adminResult', { message: 'Game crashed by admin', success: true });
      return;
    }

    if (action === 'stop') {
      state.adminStopped = true;
      if (state.status === 'WAITING') {
        state.status = 'STOPPED';
      }
      broadcastState(io);
      socket.emit('adminResult', { message: 'Game stopped by admin', success: true });
      return;
    }

    if (action === 'start') {
      state.adminStopped = false;
      if (state.status === 'STOPPED' || state.status === 'CRASHED') {
        prepareNewRound(io);
      }
      broadcastState(io);
      socket.emit('adminResult', { message: 'Game started by admin', success: true });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`Aviator game server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down game server...');
  httpServer.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('Shutting down game server...');
  httpServer.close(() => process.exit(0));
});