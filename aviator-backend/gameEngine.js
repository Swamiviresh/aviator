const { db } = require('./db');
const { updateUserBalance } = require('./auth');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.multiplier = 1.0;
    this.status = 'WAITING';
    this.crashPoint = 1.0;
    this.bets = [];
    this.queuedBets = []; // bets placed during a live round, for next round
    this.history = [];
    this.waitTime = 9;
    this.timer = 0;
    this.adminStopped = false;
    this.start();
  }

  start() {
    this.prepareNewRound();
  }

  setAdminControl(stopped) {
    this.adminStopped = stopped;
    if (stopped && this.status === 'WAITING') {
      this.status = 'STOPPED';
      this.broadcastState();
    } else if (!stopped && (this.status === 'STOPPED' || this.status === 'CRASHED')) {
      this.prepareNewRound();
    }
  }

  forceCrash() {
    if (this.status === 'RUNNING') {
      this.multiplier = this.crashPoint;
      return true;
    }
    return false;
  }

  prepareNewRound() {
    if (this.adminStopped) {
      this.status = 'STOPPED';
      this.broadcastState();
      return;
    }

    this.status = 'WAITING';
    this.multiplier = 1.0;
    this.crashPoint = this.generateCrashPoint();

    // Move queued bets into this round's bets (balance already deducted)
    this.bets = [...this.queuedBets];
    this.queuedBets = [];

    this.timer = this.waitTime;

    const interval = setInterval(() => {
      this.timer -= 0.1;
      this.broadcastState();
      if (this.timer <= 0) {
        clearInterval(interval);
        if (this.adminStopped) {
          this.status = 'STOPPED';
          this.broadcastState();
        } else {
          this.runRound();
        }
      }
    }, 100);
  }

  runRound() {
    this.status = 'RUNNING';
    const interval = setInterval(() => {
      this.multiplier += 0.01 * (this.multiplier / 2);
      this.broadcastState();

      if (this.multiplier >= this.crashPoint) {
        clearInterval(interval);
        this.crash();
      }
    }, 100);
  }

  crash() {
    this.status = 'CRASHED';
    this.history.unshift(this.multiplier.toFixed(2));
    if (this.history.length > 20) this.history.pop();

    const lostBets = this.bets.filter(bet => bet.status === 'pending');
    lostBets.forEach(bet => { bet.status = 'lost'; });
    this._saveLostBets(lostBets).catch(err => console.error('Error saving lost bets:', err));

    this.broadcastState();

    setTimeout(() => {
      this.prepareNewRound();
    }, 3000);
  }

  async _saveLostBets(bets) {
    for (const bet of bets) {
      await db.execute({
        sql: 'INSERT INTO bets (userId, amount, multiplier, payout, status) VALUES (?, ?, ?, ?, ?)',
        args: [bet.userId, bet.amount, this.multiplier, 0, 'lost']
      });
    }
  }

  generateCrashPoint() {
    const random = Math.random();
    if (random < 0.03) return 1.0;
    return 0.99 / (1 - random);
  }

  async placeBet(userId, username, amount, slotId = 1) {
    if (this.status === 'STOPPED') throw new Error('Game is stopped by admin');

    // If round is live, queue the bet for next round
    if (this.status === 'RUNNING' || this.status === 'CRASHED') {
      // Check not already queued for this slot
      if (this.queuedBets.some(b => b.userId === userId && b.slotId === slotId)) {
        throw new Error('You already have a queued bet for next round in this slot');
      }

      const result = await db.execute({ sql: 'SELECT balance FROM users WHERE id = ?', args: [userId] });
      const user = result.rows[0];
      if (!user || user.balance < amount) throw new Error('Insufficient balance');

      // Deduct balance immediately so it's reserved
      await updateUserBalance(userId, -amount, 'bet', `Queued bet for next round in slot ${slotId}`);

      const bet = { userId, username, amount, multiplier: 0, status: 'pending', slotId, queued: true };
      this.queuedBets.push(bet);
      this.broadcastState();
      return { ...bet, message: 'Bet queued for next round' };
    }

    // Normal bet during WAITING phase
    if (this.status !== 'WAITING') throw new Error('Cannot place bet right now');

    const result = await db.execute({ sql: 'SELECT balance FROM users WHERE id = ?', args: [userId] });
    const user = result.rows[0];
    if (!user || user.balance < amount) throw new Error('Insufficient balance');

    if (this.bets.some(b => b.userId === userId && b.slotId === slotId)) {
      throw new Error('Already placed a bet in this slot');
    }

    await updateUserBalance(userId, -amount, 'bet', `Placed bet in slot ${slotId}`);
    const bet = { userId, username, amount, multiplier: 0, status: 'pending', slotId };
    this.bets.push(bet);
    this.broadcastState();
    return bet;
  }

  async cancelBet(userId, slotId = 1) {
    // Can only cancel during WAITING phase or if queued
    const betInQueue = this.queuedBets.find(b => b.userId === userId && b.slotId === slotId);
    const betInWaiting = this.status === 'WAITING'
      ? this.bets.find(b => b.userId === userId && b.slotId === slotId && b.status === 'pending')
      : null;

    const bet = betInQueue || betInWaiting;
    if (!bet) throw new Error('No cancellable bet found');

    // Refund the amount
    await updateUserBalance(userId, bet.amount, 'credit', `Cancelled bet in slot ${slotId}`);

    // Remove from the appropriate array
    if (betInQueue) {
      this.queuedBets = this.queuedBets.filter(b => !(b.userId === userId && b.slotId === slotId));
    } else {
      this.bets = this.bets.filter(b => !(b.userId === userId && b.slotId === slotId));
    }

    this.broadcastState();
    return { refunded: bet.amount };
  }

  async cashout(userId, slotId = 1) {
    if (this.status !== 'RUNNING') throw new Error('Game not running');
    const bet = this.bets.find(b => b.userId === userId && b.slotId === slotId && b.status === 'pending');
    if (!bet) throw new Error('No active bet in this slot');

    const payout = bet.amount * this.multiplier;
    bet.multiplier = this.multiplier;
    bet.status = 'cashed_out';

    await updateUserBalance(userId, payout, 'cashout', `Cashed out at ${this.multiplier.toFixed(2)}x`);

    await db.execute({
      sql: 'INSERT INTO bets (userId, amount, multiplier, payout, status) VALUES (?, ?, ?, ?, ?)',
      args: [userId, bet.amount, bet.multiplier, payout, 'cashed_out']
    });

    this.broadcastState();
    return { multiplier: bet.multiplier, payout };
  }

  broadcastState() {
    this.io.emit('gameUpdate', {
      status: this.status,
      multiplier: this.multiplier.toFixed(2),
      timer: this.timer.toFixed(1),
      bets: this.bets,
      queuedBets: this.queuedBets,
      history: this.history,
      adminStopped: this.adminStopped
    });
  }

  getState() {
    return {
      status: this.status,
      multiplier: this.multiplier.toFixed(2),
      timer: this.timer.toFixed(1),
      bets: this.bets,
      queuedBets: this.queuedBets,
      history: this.history,
      adminStopped: this.adminStopped
    };
  }
}

module.exports = GameEngine;
