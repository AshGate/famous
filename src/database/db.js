import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../data/directory.db');

const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

async function initializeDatabase() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Active le support des clés étrangères
  await db.exec('PRAGMA foreign_keys = ON');

  // Tables existantes
  await db.exec(`
    CREATE TABLE IF NOT EXISTS directory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      numero TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, numero)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      UNIQUE(guild_id, user_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      log_channel_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS theme (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#2b2d31',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS recruitment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      is_open INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tag TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      title TEXT DEFAULT 'Contactez notre entreprise',
      description TEXT DEFAULT 'Afin de prendre contact avec notre secrétariat, utilisez l''onglet ci-dessous 📩',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_buttons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      label TEXT NOT NULL,
      emoji TEXT,
      style TEXT DEFAULT 'Primary',
      position INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      ticket_number INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      appointment_date TIMESTAMP NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointment_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      reminder_time TIMESTAMP NOT NULL,
      sent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      company_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      payment_method TEXT DEFAULT 'Carte bancaire',
      comments TEXT,
      blocked_funds DECIMAL(10,2) DEFAULT 0,
      total_ht DECIMAL(10,2) NOT NULL,
      total_ttc DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT '€',
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);
}

// Initialise la base de données
await initializeDatabase();

export default db;