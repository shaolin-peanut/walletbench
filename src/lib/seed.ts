import Database from "better-sqlite3";
import { challenges } from "../data/challenges";
import { contestants } from "../data/contestants";

export function seedDb(db: Database.Database): void {
  const challengeCount = (db.prepare("SELECT COUNT(*) as c FROM challenges").get() as { c: number }).c;
  if (challengeCount === 0) {
    const insert = db.prepare(
      `INSERT INTO challenges (id, title, goal, budget_cents, currency, allowed_tools, policy, time_limit_seconds, success_check, scoring_weights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        JSON.stringify(c.scoring_weights)
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
}
