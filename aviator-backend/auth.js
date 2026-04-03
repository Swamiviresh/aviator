const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const register = (username, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hashedPassword);
    return { id: result.lastInsertRowid, username, balance: 1000.0 };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists');
    }
    throw error;
  }
};

const login = (username, password) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
  return { token, user: { id: user.id, username: user.username, balance: user.balance } };
};

const getUserById = (id) => {
  return db.prepare('SELECT id, username, balance FROM users WHERE id = ?').get(id);
};

const updateUserBalance = (id, amount) => {
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, id);
};

module.exports = { register, login, getUserById, updateUserBalance, SECRET_KEY };
