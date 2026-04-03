const db = require('./db');
const { updateUserBalance } = require('./auth');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.multiplier = 1.0;
    this.status = 'WAITING'; // WAITING, RUNNING, CRASHED, STOPPED
    this.crashPoint = 1.0;
    this.bets = []; // { userId, username, amount, multiplier, status }
    this.history = [];
    this.waitTime = 5; // seconds
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
      this.multiplier = this.crashPoint; // Trigger immediate crash in the loop
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
    this.bets = [];
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
      this.multiplier += 0.01 * (this.multiplier / 2); // Accelerate slightly
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

    this.bets.forEach(bet => {
      if (bet.status === 'pending') {
        bet.status = 'lost';
        db.prepare('INSERT INTO bets (userId, amount, multiplier, payout, status) VALUES (?, ?, ?, ?, ?)')
          .run(bet.userId, bet.amount, this.multiplier, 0, 'lost');
      }
    });

    this.broadcastState();

    setTimeout(() => {
      this.prepareNewRound();
    }, 3000);
  }

  generateCrashPoint() {
    const random = Math.random();
    if (random < 0.03) return 1.0; // 3% instant crash
    return 0.99 / (1 - random);
  }

  placeBet(userId, username, amount, slotId = 1) {
    if (this.status !== 'WAITING') throw new Error('Round already started or game stopped');
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    if (user.balance < amount) throw new Error('Insufficient balance');

    // Check if slot already has a bet
    if (this.bets.some(b => b.userId === userId && b.slotId === slotId)) {
        throw new Error('Already placed a bet in this slot');
    }

    updateUserBalance(userId, -amount, 'bet', `Placed bet in slot ${slotId}`);
    const bet = { userId, username, amount, multiplier: 0, status: 'pending', slotId };
    this.bets.push(bet);
    this.broadcastState();
    return bet;
  }

  cashout(userId, slotId = 1) {
    if (this.status !== 'RUNNING') throw new Error('Game not running');
    const bet = this.bets.find(b => b.userId === userId && b.slotId === slotId && b.status === 'pending');
    if (!bet) throw new Error('No active bet in this slot');

    const payout = bet.amount * this.multiplier;
    bet.multiplier = this.multiplier;
    bet.status = 'cashed_out';
    updateUserBalance(userId, payout, 'cashout', `Cashed out at ${this.multiplier.toFixed(2)}x`);

    db.prepare('INSERT INTO bets (userId, amount, multiplier, payout, status) VALUES (?, ?, ?, ?, ?)')
      .run(userId, bet.amount, bet.multiplier, payout, 'cashed_out');

    this.broadcastState();
    return { multiplier: bet.multiplier, payout };
  }

  broadcastState() {
    this.io.emit('gameUpdate', {
      status: this.status,
      multiplier: this.multiplier.toFixed(2),
      timer: this.timer.toFixed(1),
      bets: this.bets,
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
      history: this.history,
      adminStopped: this.adminStopped
    };
  }
}

module.exports = GameEngine;
