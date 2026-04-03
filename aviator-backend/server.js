require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const {
  register,
  login,
  getUserById,
  getAllUsers,
  adminUpdateBalance,
  changePassword,
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

const gameEngine = new GameEngine(io);

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

app.post('/api/auth/register', (req, res) => {
  try {
    const user = register(req.body.username, req.body.password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const result = login(req.body.username, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  try {
    changePassword(req.user.id, req.body.newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/state', (req, res) => {
  res.json(gameEngine.getState());
});

app.get('/api/user/me', authenticateToken, (req, res) => {
  const user = getUserById(req.user.id);
  res.json(user);
});

app.post('/api/bet', authenticateToken, (req, res) => {
  try {
    const bet = gameEngine.placeBet(req.user.id, req.user.username, req.body.amount);
    res.json(bet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/cashout', authenticateToken, (req, res) => {
  try {
    const result = gameEngine.cashout(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/add-balance', authenticateToken, isAdmin, (req, res) => {
  try {
    const { userId, amount } = req.body;
    const result = adminUpdateBalance(userId, parseFloat(amount), 'credit', 'Admin added balance');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/deduct-balance', authenticateToken, isAdmin, (req, res) => {
  try {
    const { userId, amount } = req.body;
    const result = adminUpdateBalance(userId, -parseFloat(amount), 'debit', 'Admin deducted balance');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/game-control', authenticateToken, isAdmin, (req, res) => {
  try {
    const { action } = req.body; // 'start', 'stop'
    gameEngine.setAdminControl(action === 'stop');
    res.json({ message: `Game ${action === 'stop' ? 'stopped' : 'started'} by admin` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
