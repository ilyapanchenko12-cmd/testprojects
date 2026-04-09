import { db } from './db.js';

function hasColumn(table, col) {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.some((r) => r.name === col);
}

export function runMigrations() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS channel_project_map (
      chat_id TEXT PRIMARY KEY,
      dashboard_key TEXT NOT NULL,
      label TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
    db.exec(`
    CREATE TABLE IF NOT EXISTS manual_fx_rates (
      code TEXT PRIMARY KEY,
      usd_rate REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

    if (!hasColumn('telegram_messages', 'update_kind')) {
        db.exec(`ALTER TABLE telegram_messages ADD COLUMN update_kind TEXT DEFAULT 'message'`);
    }
    if (!hasColumn('telegram_messages', 'chat_title')) {
        db.exec(`ALTER TABLE telegram_messages ADD COLUMN chat_title TEXT`);
    }
    if (!hasColumn('fin_report_extracts', 'chat_id')) {
        db.exec(`ALTER TABLE fin_report_extracts ADD COLUMN chat_id TEXT`);
    }
    db.exec(`
    CREATE TABLE IF NOT EXISTS daily_kpi_overrides (
      report_date TEXT NOT NULL,
      dashboard_key TEXT NOT NULL,
      processor_key TEXT NOT NULL DEFAULT 'all',
      metrics_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (report_date, dashboard_key, processor_key)
    );
  `);
    db.exec(`
    CREATE TABLE IF NOT EXISTS crm_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
    const seedEmail = String(process.env.CRM_SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const seedPassword = String(process.env.CRM_SEED_ADMIN_PASSWORD || '').trim();
    const seedName = String(process.env.CRM_SEED_ADMIN_NAME || 'Admin').trim();

    // Optional one-time bootstrap admin. Never overwrite existing users.
    if (seedEmail && seedPassword) {
        db.prepare(
            `INSERT INTO crm_users (email, password, role, name, created_at, updated_at)
             VALUES (?, ?, 'ADMIN', ?, datetime('now'), datetime('now'))
             ON CONFLICT(email) DO NOTHING`
        ).run(seedEmail, seedPassword, seedName || 'Admin');
    }
}
