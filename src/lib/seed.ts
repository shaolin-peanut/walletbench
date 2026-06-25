import Database from "better-sqlite3";
import { challenges } from "../data/challenges";
import { contestants } from "../data/contestants";
import { runs } from "../lib/fixtures";

export function seedDb(db: Database.Database): void {
  const challengeCount = (db.prepare("SELECT COUNT(*) as c FROM challenges").get() as { c: number }).c;
  if (challengeCount === 0) {
    const insert = db.prepare(
      `INSERT INTO challenges (id, title, goal, budget_cents, currency, allowed_tools, policy, time_limit_seconds, success_check, scoring_weights, difficulty, prize_pool_cents, completion_count, participants, best_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const c of challenges) {
      insert.run(
        c.id,
        c.title,
        c.goal,
        c.budget_cents,
        c.currency,
        JSON.stringify(c.allowed_tools),
        JSON.stringify(c.policy),
        c.time_limit_seconds,
        JSON.stringify(c.success_check),
        JSON.stringify(c.scoring_weights),
        c.difficulty ?? null,
        c.prize_pool_cents ?? null,
        c.completion_count ?? null,
        c.participants ?? null,
        c.best_score ?? null,
      );
    }
  }

  const contestantCount = (db.prepare("SELECT COUNT(*) as c FROM contestants").get() as { c: number }).c;
  if (contestantCount === 0) {
    const insert = db.prepare(
      `INSERT INTO contestants (id, name, kind, endpoint) VALUES (?, ?, ?, ?)`
    );
    for (const c of contestants) {
      insert.run(c.id, c.name, c.kind, c.endpoint ?? null);
    }
  }

  const runCount = (db.prepare("SELECT COUNT(*) as c FROM runs").get() as { c: number }).c;
  if (runCount === 0) {
    const insert = db.prepare(
      `INSERT INTO runs (id, challenge_id, contestant_id, status, started_at, ended_at, wallet_start_cents, wallet_balance_cents, wallet_currency, live)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of runs) {
      insert.run(
        r.id,
        r.challenge_id,
        r.contestant_id,
        r.status,
        r.started_at,
        r.ended_at,
        r.wallet.start_cents,
        r.wallet.balance_cents,
        r.wallet.currency,
        r.live ? 1 : 0
      );
    }
  }
}
