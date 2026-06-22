const { spawn } = require('child_process');
const http = require('http');

const PORT = 3456;
const DB_PATH = `./walletbench-api-test-${Date.now()}.db`;
const BASE = `http://localhost:${PORT}`;

let failed = false;

function log(label, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${label}${detail ? ': ' + detail : ''}`);
  if (!ok) failed = true;
}

function assert(label, condition, detail) {
  log(label, condition, detail);
}

async function fetchJson(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function runTests() {
  // 1. Health
  const health = await fetchJson('/api/health');
  assert('GET /api/health', health.status === 200 && health.json?.status === 'ok', health.status);

  // 2. Challenges list
  const challenges = await fetchJson('/api/challenges');
  assert('GET /api/challenges', challenges.status === 200 && Array.isArray(challenges.json) && challenges.json.length === 6, `status=${challenges.status} count=${challenges.json?.length}`);

  // 3. Challenge by id
  const challenge = await fetchJson('/api/challenges/fund-yourself');
  assert('GET /api/challenges/[id]', challenge.status === 200 && challenge.json?.id === 'fund-yourself', challenge.status);

  // 4. Challenge 404
  const challenge404 = await fetchJson('/api/challenges/nonexistent');
  assert('GET /api/challenges/[id] 404', challenge404.status === 404, challenge404.status);

  // 5. Runs list (empty)
  const runsEmpty = await fetchJson('/api/runs');
  assert('GET /api/runs empty', runsEmpty.status === 200 && Array.isArray(runsEmpty.json) && runsEmpty.json.length === 0, `status=${runsEmpty.status}`);

  // 6. Create run
  const createRun = await fetchJson('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: 'fund-yourself', contestant_id: 'engine-bot', live: false }),
  });
  assert('POST /api/runs', createRun.status === 201 && createRun.json?.challenge_id === 'fund-yourself', createRun.status);
  const runId = createRun.json?.id;

  // 7. Runs list (has one)
  const runsList = await fetchJson('/api/runs');
  assert('GET /api/runs with data', runsList.status === 200 && Array.isArray(runsList.json) && runsList.json.length === 1, `count=${runsList.json?.length}`);

  // 8. Runs filtered by challenge_id
  const runsFiltered = await fetchJson('/api/runs?challenge_id=fund-yourself');
  assert('GET /api/runs?challenge_id', runsFiltered.status === 200 && runsFiltered.json?.length === 1, runsFiltered.json?.length);

  // 9. Get run by id
  const runById = await fetchJson(`/api/runs/${runId}`);
  assert('GET /api/runs/[id]', runById.status === 200 && runById.json?.id === runId && runById.json?.wallet?.balance_cents !== undefined, runById.status);

  // 10. Run 404
  const run404 = await fetchJson('/api/runs/run_nonexistent');
  assert('GET /api/runs/[id] 404', run404.status === 404, run404.status);

  // 11. Trace events
  const trace = await fetchJson(`/api/runs/${runId}/trace`);
  assert('GET /api/runs/[id]/trace', trace.status === 200 && Array.isArray(trace.json), trace.status);

  // 12. Run receipts
  const runReceipts = await fetchJson(`/api/runs/${runId}/receipts`);
  assert('GET /api/runs/[id]/receipts', runReceipts.status === 200 && Array.isArray(runReceipts.json), runReceipts.status);

  // 13. Receipts filtered
  const receiptsFiltered = await fetchJson(`/api/receipts?run_id=${runId}`);
  assert('GET /api/receipts?run_id', receiptsFiltered.status === 200 && Array.isArray(receiptsFiltered.json), receiptsFiltered.status);

  // 14. Leaderboard (empty because no scores yet)
  const leaderboard = await fetchJson('/api/leaderboard?challenge_id=fund-yourself');
  assert('GET /api/leaderboard', leaderboard.status === 200 && Array.isArray(leaderboard.json), leaderboard.status);

  // 15. Policy check - allowed
  const policyOk = await fetchJson('/api/policy/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policy: { spend_cap_cents: 2500, approval_threshold_cents: 1000, forbidden_tools: [] },
      current_spend_cents: 500,
      action: { kind: 'charge', amount_cents: 200, tool: 'stripe_checkout' },
    }),
  });
  assert('POST /api/policy/check allowed', policyOk.status === 200 && policyOk.json?.allowed === true, policyOk.status);

  // 16. Policy check - rejected over cap
  const policyReject = await fetchJson('/api/policy/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policy: { spend_cap_cents: 2500, approval_threshold_cents: 1000, forbidden_tools: [] },
      current_spend_cents: 2400,
      action: { kind: 'charge', amount_cents: 200, tool: 'stripe_checkout' },
    }),
  });
  assert('POST /api/policy/check rejected', policyReject.status === 200 && policyReject.json?.allowed === false, policyReject.status);

  // 17. Policy check - invalid body
  const policyInvalid = await fetchJson('/api/policy/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bad: true }),
  });
  assert('POST /api/policy/check invalid', policyInvalid.status === 400, policyInvalid.status);

  // 18. Create run - invalid body
  const createInvalid = await fetchJson('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert('POST /api/runs invalid', createInvalid.status === 400, createInvalid.status);
}

async function main() {
  console.log(`Starting dev server on port ${PORT} with DB ${DB_PATH}...`);
  const proc = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, PORT: String(PORT), DB_PATH },
    stdio: 'pipe',
  });

  proc.stdout.on('data', (d) => process.stdout.write(d));
  proc.stderr.on('data', (d) => process.stderr.write(d));

  const ready = await waitForServer();
  if (!ready) {
    console.error('Server did not start in time');
    proc.kill();
    process.exit(1);
  }

  console.log('Server ready, running tests...\n');
  await runTests();

  console.log('\nCleaning up...');
  proc.kill();
  try {
    require('fs').unlinkSync(DB_PATH);
  } catch {}

  if (failed) {
    console.error('\nSome tests failed.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
