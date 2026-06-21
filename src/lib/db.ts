import Database from "better-sqlite3";
import { initDb } from "./schema";

const DB_PATH = process.env.DB_PATH || "./walletbench.db";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
