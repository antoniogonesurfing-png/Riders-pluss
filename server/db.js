// SQLite database (better-sqlite3).
// Default file: ./data/riders-plus.db. Override with DATA_DIR, DB_PATH, or DB_FILE.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { dbFile } = require('./paths');

fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  birthdate TEXT,
  sports TEXT NOT NULL DEFAULT '[]',
  level TEXT,
  island TEXT,
  town TEXT,
  bio TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_bot INTEGER NOT NULL DEFAULT 0,
  bot_key TEXT,
  avatar_color TEXT,
  tier TEXT NOT NULL DEFAULT 'basic', -- basic | plus
  photos TEXT NOT NULL DEFAULT '[]',
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  terms_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  start_time TEXT,
  month TEXT,
  schedule TEXT,
  place TEXT,
  island TEXT,
  is_free INTEGER NOT NULL DEFAULT 0,
  price_status TEXT NOT NULL DEFAULT 'unknown', -- free | paid | unknown
  price_eur REAL,
  description TEXT,
  source_url TEXT,
  date_status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | tbc | recurring
  origin TEXT NOT NULL DEFAULT 'curated', -- curated | user
  status TEXT NOT NULL DEFAULT 'approved', -- awaiting_payment | pending | approved | rejected
  featured INTEGER NOT NULL DEFAULT 0,
  featured_boost INTEGER NOT NULL DEFAULT 0,
  listing_fee_eur REAL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, user_id)
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL, -- event_listing | grom_sponsorship
  ref_id INTEGER,
  description TEXT,
  line_items TEXT NOT NULL DEFAULT '[]',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'requires_payment', -- requires_payment | paid
  provider TEXT NOT NULL DEFAULT 'test', -- test | stripe
  provider_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  tagline TEXT,
  location TEXT,
  about TEXT,
  website TEXT,
  email TEXT,
  image TEXT
);
CREATE TABLE IF NOT EXISTS retreats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT,
  summary TEXT,
  description TEXT,
  facts TEXT NOT NULL DEFAULT '[]',
  price_text TEXT,
  prices TEXT NOT NULL DEFAULT '[]',
  dates TEXT NOT NULL DEFAULT '[]',
  dates_note TEXT,
  includes TEXT NOT NULL DEFAULT '[]',
  not_included TEXT NOT NULL DEFAULT '[]',
  image TEXT,
  image_alt TEXT,
  source_url TEXT,
  status_label TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS retreat_enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retreat_id INTEGER NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_dates TEXT,
  guests INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS swipes (
  from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (from_id, to_id)
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  b_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (a_id, b_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS grom_nominations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  guardian_name TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_phone TEXT,
  relationship TEXT NOT NULL,
  grom_first_name TEXT NOT NULL,
  grom_age INTEGER NOT NULL,
  island TEXT,
  sport TEXT,
  story TEXT,
  needs TEXT,
  guardian_consent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS grom_sponsorships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount_eur REAL NOT NULL,
  message TEXT,
  payment_id INTEGER REFERENCES payments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL, -- bug | feature | other
  page TEXT,
  message TEXT NOT NULL,
  email TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS plus_waitlist (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_month ON events(month);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
`);

module.exports = db;
