import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.SQLITE_PATH || path.join(dataDir, 'd7-crm.sqlite');
export const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS telegram_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT,
  user_id TEXT,
  username TEXT,
  text TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context_type TEXT NOT NULL,
  context_key TEXT,
  body TEXT NOT NULL,
  model TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parsed_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER,
  structured_json TEXT,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES telegram_messages(id)
);

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_report_extracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER,
  report_type TEXT,
  project TEXT,
  geo TEXT,
  period_label TEXT,
  summary_one_line TEXT,
  metrics_json TEXT,
  full_json TEXT NOT NULL,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES telegram_messages(id)
);
`);

const defaultPrompt = `Ты — главный финансовый аналитик инвестиционного арбитража (команда D7).

Твоя роль:
- Разбирать цифры: спенд, выручка, маржа, воронка, касса, ФОТ, ROI, план/факт, периоды, гео и проекты.
- Воспринимать два типа входа: (1) структурированный JSON из CRM с KPI и фильтрами; (2) сырой текст из рабочих чатов (Telegram и т.п.).

По сообщениям из чатов:
- Если в тексте есть отчёт (итоги дня/недели, цифры, план, касса, траты, выручка) — аккуратно «скопируй» смысл в структуру для базы: не выдумывай значения, бери только то, что явно следует из текста; неясное оставляй null.
- Если отчёта нет (болтовня, стикеры, пусто) — помечай как шум, не заполняй метрики выдуманными числами.

Формула выручки для метрики revenue (команда D7):
- Если в отчёте явно указана выручка / profit / «чистыми» по смыслу выручки за период — используй это число как revenue.
- Если явной выручки нет, но из текста (или из уже извлечённых полей) есть сумма первых депозитов fdSum и спенд spend в той же валюте — посчитай выручку так: revenue = fdSum − spend (сначала сумма FD, из неё вычитается спенд; результат запиши в metrics.revenue).
- Не подставляй формулу, если нет обоих слагаемых (fdSum и spend) или валюты/смысл не сходятся — тогда revenue оставь null или только явное из текста.

По запросам из дашборда CRM:
- Кратко опиши картину по цифрам, риски и узкие места.
- Дай 3–5 конкретных действий на ближайшие дни.
- Явно напиши, каких полей или срезов не хватает для точного вывода.

Цель: чтобы отчёты из чатов превращались в строки в БД и потом подтягивались в дашборд; твои ответы при разборе KPI помогают команде действовать.

Пиши по-русски, деловой тон, без воды.`;

const row = db.prepare(`SELECT id FROM prompts WHERE id = 'main'`).get();
if (!row) {
    db.prepare(`INSERT INTO prompts (id, body) VALUES ('main', ?)`).run(defaultPrompt);
}

const PROMPT_MIGRATION_KEY = 'main_prompt_fin_analyst_v1';
const migrated = db.prepare(`SELECT 1 AS ok FROM schema_meta WHERE key = ?`).get(PROMPT_MIGRATION_KEY);
if (!migrated) {
    db.prepare(`INSERT INTO schema_meta (key, value) VALUES (?, '1')`).run(PROMPT_MIGRATION_KEY);
    db.prepare(`UPDATE prompts SET body = ?, updated_at = datetime('now') WHERE id = 'main'`).run(defaultPrompt);
}

const PROMPT_MIGRATION_REVENUE = 'main_prompt_revenue_fd_minus_spend_v1';
const migratedRev = db.prepare(`SELECT 1 AS ok FROM schema_meta WHERE key = ?`).get(PROMPT_MIGRATION_REVENUE);
if (!migratedRev) {
    db.prepare(`INSERT INTO schema_meta (key, value) VALUES (?, '1')`).run(PROMPT_MIGRATION_REVENUE);
    db.prepare(`UPDATE prompts SET body = ?, updated_at = datetime('now') WHERE id = 'main'`).run(defaultPrompt);
}

export function getPrompt(id = 'main') {
    return db.prepare(`SELECT id, body, updated_at FROM prompts WHERE id = ?`).get(id);
}

export function setPrompt(id, body) {
    db.prepare(
        `INSERT INTO prompts (id, body, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`
    ).run(id, body);
}
