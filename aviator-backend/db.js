const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'aviator.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 1000.0
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
`);

module.exports = db;
