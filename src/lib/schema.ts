import Database from "better-sqlite3";

export function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      budget_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      allowed_tools TEXT NOT NULL,
      policy TEXT NOT NULL,
      time_limit_seconds INTEGER NOT NULL,
      success_check TEXT NOT NULL,
      scoring_weights TEXT NOT NULL,
      difficulty TEXT,
      prize_pool_cents INTEGER,
      completion_count INTEGER,
      participants INTEGER,
      best_score REAL
    )
  `);

  // Migration: add columns if they don't exist (for existing DBs)
  const challengeColumns = (db.prepare("PRAGMA table_info(challenges)").all() as any[]).map(c => c.name);
  const challengeMigrations: string[] = [];
  if (!challengeColumns.includes("difficulty")) challengeMigrations.push("ALTER TABLE challenges ADD COLUMN difficulty TEXT");
  if (!challengeColumns.includes("prize_pool_cents")) challengeMigrations.push("ALTER TABLE challenges ADD COLUMN prize_pool_cents INTEGER");
  if (!challengeColumns.includes("completion_count")) challengeMigrations.push("ALTER TABLE challenges ADD COLUMN completion_count INTEGER");
  if (!challengeColumns.includes("participants")) challengeMigrations.push("ALTER TABLE challenges ADD COLUMN participants INTEGER");
  if (!challengeColumns.includes("best_score")) challengeMigrations.push("ALTER TABLE challenges ADD COLUMN best_score REAL");
  for (const migration of challengeMigrations) {
    db.exec(migration);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS contestants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      endpoint TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      contestant_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      wallet_start_cents INTEGER NOT NULL,
      wallet_balance_cents INTEGER NOT NULL,
      wallet_currency TEXT NOT NULL,
      live INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS trace_events (
      run_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      ts TEXT NOT NULL,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (run_id, seq)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      purpose TEXT NOT NULL,
      stripe_ref TEXT NOT NULL,
      balance_after_cents INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      run_id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      contestant_id TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      total REAL NOT NULL,
      rank INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_runs_challenge_id
    ON runs(challenge_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trace_events_run_id
    ON trace_events(run_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_receipts_run_id
    ON receipts(run_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scores_challenge_id
    ON scores(challenge_id)
  `);
}
