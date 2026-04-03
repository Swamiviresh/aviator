const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const ensureAdmin = async () => {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: ['admin'] });
  const admin = result.rows[0];
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.execute({
      sql: 'INSERT INTO users (username, password, balance, role) VALUES (?, ?, ?, ?)',
      args: ['admin', hashedPassword, 0, 'admin']
    });
    console.log('Default admin user created: admin / admin123');
  }
};

const register = async (username, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const countResult = await db.execute('SELECT COUNT(*) as count FROM users');
    const userCount = Number(countResult.rows[0].count);
    const role = userCount === 0 ? 'admin' : 'user';

    const result = await db.execute({
      sql: 'INSERT INTO users (username, password, balance, role) VALUES (?, ?, ?, ?)',
      args: [username, hashedPassword, 0, role]
    });
    return { id: Number(result.lastInsertRowid), username, balance: 0, role };
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error('Username already exists');
    }
    throw error;
  }
};

const login = async (username, password) => {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign(
    { id: Number(user.id), username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  return {
    token,
    user: { id: Number(user.id), username: user.username, balance: user.balance, role: user.role }
  };
};

const getUserById = async (id) => {
  const result = await db.execute({ sql: 'SELECT id, username, balance, role FROM users WHERE id = ?', args: [id] });
  const user = result.rows[0];
  if (user) {
    const betsResult = await db.execute({ sql: 'SELECT COUNT(*) as count FROM bets WHERE userId = ?', args: [id] });
    return { ...user, id: Number(user.id), totalBets: Number(betsResult.rows[0].count) };
  }
  return null;
};

const getAllUsers = async () => {
  const result = await db.execute('SELECT id, username, balance, role FROM users');
  return Promise.all(result.rows.map(async (u) => {
    const betsResult = await db.execute({ sql: 'SELECT COUNT(*) as count FROM bets WHERE userId = ?', args: [u.id] });
    return { ...u, id: Number(u.id), totalBets: Number(betsResult.rows[0].count) };
  }));
};

const updateUserBalance = async (userId, amount, type = 'game', description = 'Game transaction') => {
  const userResult = await db.execute({ sql: 'SELECT balance FROM users WHERE id = ?', args: [userId] });
  const user = userResult.rows[0];
  if (!user) return;

  const newBalance = user.balance + amount;
  let finalType = type;
  if (type === 'game') {
    finalType = amount < 0 ? 'bet' : 'cashout';
  }

  await db.batch([
    { sql: 'UPDATE users SET balance = ? WHERE id = ?', args: [newBalance, userId] },
    {
      sql: 'INSERT INTO transactions (userId, amount, type, description) VALUES (?, ?, ?, ?)',
      args: [userId, Math.abs(amount), finalType, description]
    },
  ], 'write');
};

const adminUpdateBalance = async (userId, amount, type, description) => {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const newBalance = user.balance + amount;
  if (newBalance < 0) throw new Error('Insufficient balance for deduction');

  await db.batch([
    { sql: 'UPDATE users SET balance = ? WHERE id = ?', args: [newBalance, userId] },
    {
      sql: 'INSERT INTO transactions (userId, amount, type, description) VALUES (?, ?, ?, ?)',
      args: [userId, Math.abs(amount), type, description]
    },
  ], 'write');

  return { userId, newBalance };
};

const changePassword = async (userId, newPassword) => {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await db.execute({ sql: 'UPDATE users SET password = ? WHERE id = ?', args: [hashedPassword, userId] });
};

const deleteUser = async (id) => {
  // Clean up related records first to avoid constraint issues
  await db.batch([
    { sql: 'DELETE FROM transactions WHERE userId = ?', args: [id] },
    { sql: 'DELETE FROM bets WHERE userId = ?', args: [id] },
    { sql: 'DELETE FROM users WHERE id = ?', args: [id] },
  ], 'write');
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
