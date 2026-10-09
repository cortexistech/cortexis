import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

export const DATA_DIR = process.env.DATA_DIR || './data';
export const MEDIA_DIR = `${DATA_DIR}/media`;
mkdirSync(MEDIA_DIR, { recursive: true });

export const db = new DatabaseSync(`${DATA_DIR}/agent.db`);
db.exec(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  media TEXT NOT NULL,
  instruction TEXT,
  caption TEXT,
  llm TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  ig_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
