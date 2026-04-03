const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'aviator.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 1000.0,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount REAL,
    multiplier REAL,
    payout REAL,
    status TEXT, -- 'pending', 'cashed_out', 'lost'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount REAL,
    type TEXT, -- 'credit', 'debit'
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Handle migration for existing users table
try {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
} catch (error) {
  // Ignore error if column already exists
}

module.exports = db;
