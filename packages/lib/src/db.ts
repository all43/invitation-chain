import Database from 'better-sqlite3';
import { CREATE_TABLE, CREATE_INDEX_INVITED_BY, CREATE_INDEX_INVITED_AT } from './queries.js';

export function openDatabase(dbPath: string = ':memory:'): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(CREATE_TABLE);
  db.exec(CREATE_INDEX_INVITED_BY);
  db.exec(CREATE_INDEX_INVITED_AT);
}
