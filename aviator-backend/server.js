require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { db, initDB } = require('./db');
const {
  register,
  login,
  getUserById,
  getAllUsers,
  adminUpdateBalance,
  changePassword,
  deleteUser,
  ensureAdmin,
  SECRET_KEY
} = require('./auth');
const GameEngine = require('./gameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await register(req.body.username, req.body.password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await login(req.body.username, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    await changePassword(req.user.id, req.body.newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Game Routes
app.get('/api/state', (req, res) => {
  res.json(gameEngine.getState());
});

app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bet', authenticateToken, async (req, res) => {
  try {
    const { amount, slotId } = req.body;
    const bet = await gameEngine.placeBet(req.user.id, req.user.username, amount, slotId);
    res.json(bet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/cashout', authenticateToken, async (req, res) => {
  try {
    const { slotId } = req.body;
    const result = await gameEngine.cashout(req.user.id, slotId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/add-balance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const result = await adminUpdateBalance(userId, parseFloat(amount), 'credit', 'Admin added balance');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/deduct-balance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const result = await adminUpdateBalance(userId, -parseFloat(amount), 'debit', 'Admin deducted balance');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/game-control', authenticateToken, isAdmin, (req, res) => {
  try {
    const { action } = req.body;
    if (action === 'crash') {
      const success = gameEngine.forceCrash();
      return res.json({ message: success ? 'Game crashed by admin' : 'Game not running', success });
    }
    gameEngine.setAdminControl(action === 'stop');
    res.json({ message: `Game ${action === 'stop' ? 'stopped' : 'started'} by admin` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/admin/transactions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT t.*, u.username
      FROM transactions t
      JOIN users u ON t.userId = u.id
      ORDER BY t.timestamp DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize DB, ensure admin exists, then start server
let gameEngine;
const start = async () => {
  await initDB();
  await ensureAdmin();

  gameEngine = new GameEngine(io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
