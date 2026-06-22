import Database from "better-sqlite3";
import { initDb } from "./schema";
import { seedDb } from "./seed";

const DB_PATH = process.env.DB_PATH || "./walletbench.db";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const path = process.env.DB_PATH || "./walletbench.db";
    db = new Database(path);
    db.pragma("journal_mode = WAL");
    initDb(db);
    seedDb(db);
  }
  return db;
}

export function resetDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
