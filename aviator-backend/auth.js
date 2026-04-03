const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const register = (username, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    // First user is admin for demo purposes
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const role = userCount === 0 ? 'admin' : 'user';

    const result = stmt.run(username, hashedPassword, role);
    return { id: result.lastInsertRowid, username, balance: 1000.0, role };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists');
    }
    throw error;
  }
};

const ensureAdmin = () => {
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
    console.log('Default admin user created: admin/admin123');
  }
};

const login = (username, password) => {
  ensureAdmin();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
  return { token, user: { id: user.id, username: user.username, balance: user.balance, role: user.role } };
};

const getUserById = (id) => {
  const user = db.prepare('SELECT id, username, balance, role FROM users WHERE id = ?').get(id);
  if (user) {
    const totalBets = db.prepare('SELECT COUNT(*) as count FROM bets WHERE userId = ?').get(id).count;
    user.totalBets = totalBets;
  }
  return user;
};

const getAllUsers = () => {
  const users = db.prepare('SELECT id, username, balance, role FROM users').all();
  return users.map(u => {
    const totalBets = db.prepare('SELECT COUNT(*) as count FROM bets WHERE userId = ?').get(u.id).count;
    return { ...u, totalBets };
  });
};

const updateUserBalance = (userId, amount, type = 'game', description = 'Game transaction') => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const newBalance = user.balance + amount;

  const updateStmt = db.prepare('UPDATE users SET balance = ? WHERE id = ?');
  const transStmt = db.prepare('INSERT INTO transactions (userId, amount, type, description) VALUES (?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    updateStmt.run(newBalance, userId);
    // For type, we can use 'credit' or 'debit' based on amount if not provided,
    // but the prompt asked for types like credit/debit/bet/cashout
    let finalType = type;
    if (type === 'game') {
      finalType = amount < 0 ? 'bet' : 'cashout';
    }
    transStmt.run(userId, Math.abs(amount), finalType, description);
  });

  transaction();
};

const adminUpdateBalance = (userId, amount, type, description) => {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const newBalance = user.balance + amount;
  if (newBalance < 0) throw new Error('Insufficient balance for deduction');

  const updateStmt = db.prepare('UPDATE users SET balance = ? WHERE id = ?');
  const transStmt = db.prepare('INSERT INTO transactions (userId, amount, type, description) VALUES (?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    updateStmt.run(newBalance, userId);
    transStmt.run(userId, Math.abs(amount), type, description);
  });

  transaction();
  return { userId, newBalance };
};

const changePassword = (userId, newPassword) => {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
};

const deleteUser = (id) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

module.exports = {
  register,
  login,
  getUserById,
  getAllUsers,
  updateUserBalance,
  adminUpdateBalance,
  changePassword,
  deleteUser,
  ensureAdmin,
  SECRET_KEY
};
