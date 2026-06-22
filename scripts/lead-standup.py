#!/usr/bin/env python3
"""
WalletBench Lead Standup — runs every 5 hours via cron.
Reads board state, identifies blockers, creates unblocking tasks,
writes STATUS-REPORT.md to vault, and prints a summary that gets delivered to Telegram.
"""
import re
import subprocess
import json
import os
from datetime import datetime, timezone

REPORT_FILE = "/home/ops/code/lattice-nine-vault/projects/walletbench/STATUS-REPORT.md"

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    return result.stdout.strip()

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"[{ts}] {msg}")

def get_board_state():
    """Get current kanban state via --json flag."""
    output = run("hermes kanban list --json 2>/dev/null || echo '[]'")
    try:
        return json.loads(output)
    except Exception:
        return []

def read_task_log(task_id):
    """Read task log output."""
    return run(f"hermes kanban log {task_id} 2>/dev/null")

def classify_failure(task_id, error_msg, log_text):
    """
    Classify a provider/automation failure and return a recovery action.
    """
    lower_msg = error_msg.lower()
    lower_log = log_text.lower()

    if "401" in lower_msg or "token expired" in lower_msg or "authenticationerror" in lower_msg:
        return "PROVIDER AUTH FAILURE: token expired or incorrect", "Rotate provider or fix credentials/config — human action required"
    if "403" in lower_msg or "forbidden" in lower_msg:
        return "PROVIDER FORBIDDEN", "Check account access/model permissions or rotate provider"
    if "429" in lower_msg or "rate limit" in lower_msg:
        return "PROVIDER RATE LIMITED (429)", "Wait and retry, or rotate provider"
    if "404" in lower_msg or "not found" in lower_msg:
        return "PROVIDER ENDPOINT NOT FOUND (404)", "Check endpoint URL or model availability"

    if "protocol violation" in lower_msg or "repeated_crashes" in lower_msg:
        if "401" in lower_log or "token expired" in lower_log or "authenticationerror" in lower_log:
            return "PROVIDER AUTH CRASH: worker exited before complete/block", "Rotate provider or fix credentials/config — human action required"
        if "429" in lower_log or "rate limit" in lower_log:
            return "PROVIDER RATE LIMIT CRASH", "Wait or rotate provider; task likely needs reclaim/requeue"
        if "404" in lower_log or "not found" in lower_log:
            return "PROVIDER NOT FOUND CRASH", "Check endpoint/model; reclaim/requeue task"
        return "REPEATED CRASH / PROTOCOL VIOLATION", "Reclaim/requeue task — worker exited without calling kanban_complete or kanban_block"

    if "timeout" in lower_msg or "timed out" in lower_msg:
        return "PROVIDER TIMEOUT", "Retry or rotate provider; if persistent, investigate network/provider health"

    return "UNKNOWN FAILURE", f"Investigate logs manually with: hermes kanban log {task_id}"

def detect_provider_failures(tasks):
    """
    Detect provider-style failures across the board using diagnostics + per-task log inspection.
    Returns a list of dicts: {task_id, title, assignee, cause, action}
    """
    diag_output = run("hermes kanban diagnostics 2>/dev/null")
    if not diag_output:
        return []

    affected = []
    task_map = {t.get("id", ""): t for t in tasks}

    lines = diag_output.splitlines()
    idx = 0
    while idx < len(lines):
        stripped = lines[idx].strip()
        # Match task header lines: t_xxx status @assignee title...
        m = re.search(r"^(t_\w+)\s+\w+\s+@(\S+)\s+(.*)", stripped)
        if not m:
            m = re.search(r"^(t_\w+)\s+(.*)", stripped)
        if not m:
            idx += 1
            continue

        task_id = m.group(1)
        task = task_map.get(task_id, {})
        if m.re.pattern.startswith(r"^(t_\w+)\s+\w+\s+@(\S+)\s+(.*)"):
            title = task.get("title", m.group(3))[:60]
        else:
            title = task.get("title", m.group(2))[:60]
        assignee = task.get("assignee", "unknown")

        # Collect error lines following the task header until a blank line or new task
        error_lines = []
        idx += 1
        while idx < len(lines):
            next_stripped = lines[idx].strip()
            if not next_stripped:
                break
            if re.match(r"^(t_\w+)", next_stripped):
                idx -= 1  # back up so outer loop sees it
                break
            if lines[idx].startswith("    ") or lines[idx].startswith("       "):
                error_lines.append(next_stripped)
            idx += 1

        error_text = "\n".join(error_lines)
        log_text = read_task_log(task_id)
        cause, action = classify_failure(task_id, error_text, log_text)
        affected.append({
            "task_id": task_id,
            "title": title,
            "assignee": assignee,
            "cause": cause,
            "action": action,
        })

        idx += 1

    return affected

def get_problematic(tasks):
    """Identify blocked/failed tasks + running-too-long tasks, with UNBLOCK dedup."""
    problematic = []
    now = datetime.now(timezone.utc).timestamp()
    for t in tasks:
        status = t.get("status", "")
        if status == "blocked":
            # Skip self-referential UNBLOCK spawns so they cannot recurse.
            title = t.get("title", "")
            if title.startswith("UNBLOCK:"):
                continue
            problematic.append((t, "blocked"))
        # Check for stale running tasks (>2h)
        if status == "running" and t.get("started_at"):
            elapsed = now - t["started_at"]
            if elapsed > 7200:  # 2 hours
                problematic.append((t, f"running {elapsed/3600:.1f}h"))
    return problematic

def get_open_unblock_task(task_id):
    """Return an existing open UNBLOCK task id for the same blocked task, or None."""
    tasks = get_board_state()
    needle = f"Task {task_id} is blocked"
    for t in tasks:
        status = t.get("status", "")
        if status in {"todo", "ready", "running"}:
            body = (t.get("body") or "") + " " + (t.get("title") or "")
            if needle in body:
                return t.get("id")
    return None

def create_unblocking_task(blocked_task):
    """Create a follow-up task to unblock, with deduplication."""
    task_id = blocked_task["id"]
    title = blocked_task["title"]
    assignee = blocked_task.get("assignee", "wb-lead")

    new_title = f"UNBLOCK: {title[:40]}"
    body = f"Task {task_id} is blocked. Investigate logs with: hermes kanban log {task_id}"

    existing = get_open_unblock_task(task_id)
    if existing:
        log(f"Skipped creating duplicate unblock task for {task_id} (already exists: {existing})")
        return

    cmd = f"hermes kanban create '{new_title}' --assignee wb-lead --body '{body}' --workspace scratch"
    result = run(cmd)
    log(f"Created unblock task for {task_id}: {result}")

def generate_report(tasks, problematic, provider_failures):
    """Generate markdown status report."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    counts = {}
    for t in tasks:
        s = t.get("status", "unknown")
        counts[s] = counts.get(s, 0) + 1

    by_assignee = {}
    for t in tasks:
        a = t.get("assignee", "unassigned")
        s = t.get("status", "unknown")
        by_assignee.setdefault(a, {}).setdefault(s, 0)
        by_assignee[a][s] += 1

    done = counts.get("done", 0)
    total = len(tasks)
    pct = f"{done/total*100:.0f}%" if total else "0%"

    report = f"""# WalletBench Status Report — {now_str}

## Board Summary: {done}/{total} done ({pct})

| Status | Count |
|--------|-------|
"""
    for status in ["done", "running", "ready", "todo", "blocked"]:
        report += f"| {status.title()} | {counts.get(status, 0)} |\n"

    # Running tasks
    running = [t for t in tasks if t.get("status") == "running"]
    report += f"\n## ▶ In Progress ({len(running)})\n\n"
    if running:
        for t in sorted(running, key=lambda x: x.get("assignee", "")):
            report += f"- **{t['id']}** | `{t.get('assignee','?')}` | {t.get('title','?')[:60]}\n"
    else:
        report += "_No tasks running. Check dispatch._\n"

    # Blockers
    report += f"\n## 🚨 Needs Attention ({len(problematic)})\n\n"
    if problematic:
        for t, reason in problematic:
            report += f"- **{t['id']}** | `{t.get('assignee','?')}` | **{reason}** | {t.get('title','?')[:50]}\n"
            report += f"  - Investigate: `hermes kanban show {t['id']}`\n"
    else:
        report += "_No blockers. Pipeline flowing._\n"

    # Community-leverage lane
    report += "\n## 🌱 Community-Leverage Lane\n\n"
    report += "_Secondary to critical-path shipping and blocker recovery._\n\n"
    report += "Standup / strategy checklist:\n"
    report += "- Ask whether this pass produced a reusable Hermes/community artifact (skill, operator guide, helper script, checklist, postmortem, or workflow).\n"
    report += "- Only pursue it if it is grounded in real WalletBench evidence and bounded enough to finish during slack time.\n"
    report += "- If yes, record the smallest next packaging step and owner; if no, record `none this pass`.\n"

    # Recently completed (last 5)
    done_tasks = [t for t in tasks if t.get("status") == "done"]
    done_tasks.sort(key=lambda x: x.get("completed_at", 0), reverse=True)
    report += f"\n## ✅ Recently Completed\n\n"
    for t in done_tasks[:5]:
        report += f"- **{t['id']}** | `{t.get('assignee','?')}` | {t.get('title','?')[:60]}\n"

    # Per-profile breakdown
    report += "\n## Per-Profile Breakdown\n\n"
    for assignee in sorted(by_assignee.keys()):
        parts = [f"{k}:{v}" for k, v in sorted(by_assignee[assignee].items())]
        report += f"- **{assignee}**: {' | '.join(parts)}\n"

    # Provider Watchdog section
    report += """
## Provider Watchdog

"""
    if provider_failures:
        for f in provider_failures:
            report += f"- **{f['task_id']}** | @{f['assignee']} | {f['title']}\n"
            report += f"  - **Cause:** {f['cause']}\n"
            report += f"  - **Action:** {f['action']}\n"
    else:
        report += "_No provider failures detected._\n"

    # Provider Status
    report += """
## Provider Status

"""
    # Check ZAI status file
    if os.path.exists("/tmp/wb_zai_status.json"):
        with open("/tmp/wb_zai_status.json") as f:
            zai = json.load(f)
        report += f"- **ZAI**: {'✅ Available' if zai.get('available') else '❌ Rate Limited'}\n"
        report += f"- Last checked: {zai.get('last_check', 'unknown')}\n"
    else:
        report += "- **ZAI**: glm-5.2 primary (fallback chain: kimi-k2.6 → step-3.7-free)\n"

    report += """
## Next Actions

1. Run `hermes kanban dispatch` to spawn ready tasks
2. Review blockers above and create unblocking tasks if needed
3. Check token burn with `hermes kanban stats`
4. Address provider failures in the section above before dispatching new work

---
*Auto-generated by wb-lead standup cron (every 5h)*
"""

    return report

def main():
    log("Starting lead standup...")

    # 1. Get board state
    tasks = get_board_state()
    log(f"Board has {len(tasks)} tasks")

    if not tasks:
        log("WARNING: No tasks found — check kanban DB / board slug")

    # 2. Identify blockers
    problematic = get_problematic(tasks)
    if problematic:
        log(f"Found {len(problematic)} problematic tasks")
        for t, reason in problematic:
            log(f"  - {t['id']}: {t.get('title','?')[:40]} ({reason})")
            # Create unblock task for each
            create_unblocking_task(t)

    # 3. Provider watchdog sweep
    log("Running provider-watchdog sweep...")
    provider_failures = detect_provider_failures(tasks)
    if provider_failures:
        log(f"Detected {len(provider_failures)} provider failure(s):")
        for f in provider_failures:
            log(f"  - {f['task_id']}: {f['cause']} → {f['action']}")
    else:
        log("No provider failures detected.")

    # 4. Generate report
    report = generate_report(tasks, problematic, provider_failures)
    with open(REPORT_FILE, "w") as f:
        f.write(report)
    log(f"Report written to {REPORT_FILE}")

    # 5. Also append to vault
    vault_path = "/home/ops/code/lattice-nine-vault/projects/walletbench/STATUS-REPORT.md"
    with open(vault_path, "w") as f:
        f.write(report)
    log("Report synced to vault")

    # 6. Print the report as stdout (cron delivers this to Telegram)
    print()
    print(report)

    log("Standup complete.")

if __name__ == "__main__":
    main()
