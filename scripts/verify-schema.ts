import Database from "better-sqlite3";
import { initDb } from "../src/lib/schema.js";

const db = new Database(":memory:");

try {
  initDb(db);
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    .all();
  const tableNames = tables.map((t: any) => t.name);
  console.log("Tables:", JSON.stringify(tableNames, null, 2));

  const indexes = db
    .prepare(
      "SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY name",
    )
    .all();
  console.log("Indexes:", JSON.stringify(indexes, null, 2));

  const expectedTables = [
    "challenges",
    "contestants",
    "runs",
    "trace_events",
    "receipts",
    "scores",
  ];
  for (const t of expectedTables) {
    if (!tableNames.includes(t)) {
      console.error(`Missing table: ${t}`);
      process.exit(1);
    }
  }
  console.log("SUCCESS: All tables and indexes present.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  db.close();
}
