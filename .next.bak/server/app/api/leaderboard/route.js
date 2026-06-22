"use strict";(()=>{var e={};e.id=414,e.ids=[414],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},19303:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>E,patchFetch:()=>N,requestAsyncStorage:()=>u,routeModule:()=>d,serverHooks:()=>T,staticGenerationAsyncStorage:()=>p});var a={};s.r(a),s.d(a,{GET:()=>_});var n=s(44523),c=s(78061),i=s(20006),r=s(75455),l=s(21539),o=s(2863);async function _(e){let t=(0,l.z)(),{searchParams:s}=new URL(e.url),a=s.get("challenge_id")??void 0,n=(0,o.AE)(t,a);return r.NextResponse.json(n)}let d=new n.AppRouteRouteModule({definition:{kind:c.x.APP_ROUTE,page:"/api/leaderboard/route",pathname:"/api/leaderboard",filename:"route",bundlePath:"app/api/leaderboard/route"},resolvedPagePath:"/home/ops/code/walletbench-surface/src/app/api/leaderboard/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:u,staticGenerationAsyncStorage:p,serverHooks:T}=d,E="/api/leaderboard/route";function N(){return(0,i.patchFetch)({serverHooks:T,staticGenerationAsyncStorage:p})}},7773:(e,t,s)=>{s.d(t,{o:()=>n});var a=s(24993);let n=[{id:"fund-yourself",title:"Fund Yourself",goal:"End net-positive on a $25 test budget within 30 minutes.",budget_cents:2500,currency:"usd",allowed_tools:["web_search","stripe_checkout","deploy","code_exec"],policy:{spend_cap_cents:2500,approval_threshold_cents:1e3,forbidden_tools:[]},time_limit_seconds:1800,success_check:{type:"net_positive",params:{}},scoring_weights:{task_success:.3,roi:.3,cost:.1,quality:.1,time:.1,policy:.1}},{id:"provision-saas-stack",title:"Provision a SaaS Stack",goal:"Stand up a working multi-tier service (frontend + API + DB) within budget.",budget_cents:5e3,currency:"usd",allowed_tools:["web_search","deploy","code_exec","stripe_checkout"],policy:{spend_cap_cents:5e3,approval_threshold_cents:2e3,forbidden_tools:["transfer"]},time_limit_seconds:3600,success_check:{type:"service_up",params:{min_uptime_seconds:60}},scoring_weights:{task_success:.35,roi:.15,cost:.2,quality:.15,time:.1,policy:.05}},{id:"run-an-eval",title:"Run an Eval Under Budget",goal:"Execute a model eval suite and optimize cost/latency/quality under a fixed cap.",budget_cents:8e3,currency:"usd",allowed_tools:["web_search","code_exec","stripe_checkout"],policy:{spend_cap_cents:8e3,approval_threshold_cents:3e3,forbidden_tools:[]},time_limit_seconds:7200,success_check:{type:"eval_complete",params:{min_models:2}},scoring_weights:{task_success:.3,roi:.1,cost:.25,quality:.2,time:.1,policy:.05}},{id:"source-hardware-kit",title:"Source a Hardware Kit",goal:"Find a complete, compatible parts list for a small cluster within budget.",budget_cents:1e4,currency:"usd",allowed_tools:["web_search","stripe_checkout"],policy:{spend_cap_cents:1e4,approval_threshold_cents:4e3,forbidden_tools:["deploy"]},time_limit_seconds:5400,success_check:{type:"parts_listed",params:{min_items:5}},scoring_weights:{task_success:.3,roi:.1,cost:.25,quality:.2,time:.1,policy:.05}},{id:"launch-landing-page",title:"Launch a Paid Landing Page",goal:"Deploy a Stripe-test checkout page that accepts at least one payment.",budget_cents:3e3,currency:"usd",allowed_tools:["web_search","deploy","stripe_checkout","code_exec"],policy:{spend_cap_cents:3e3,approval_threshold_cents:1e3,forbidden_tools:[]},time_limit_seconds:2400,success_check:{type:"checkout_hit",params:{min_payments:1}},scoring_weights:{task_success:.4,roi:.2,cost:.15,quality:.15,time:.05,policy:.05}},{id:"reduce-cloud-bill",title:"Reduce a Cloud / API Bill",goal:"Given a simulated bill, propose and apply savings to cut cost by at least 20%.",budget_cents:2e3,currency:"usd",allowed_tools:["web_search","code_exec"],policy:{spend_cap_cents:2e3,approval_threshold_cents:1e3,forbidden_tools:["stripe_checkout"]},time_limit_seconds:1800,success_check:{type:"savings_achieved",params:{min_reduction_pct:20}},scoring_weights:{task_success:.35,roi:.15,cost:.2,quality:.15,time:.1,policy:.05}}];n.forEach(e=>a.Mi.parse(e))},2863:(e,t,s)=>{function a(e){return e.prepare("SELECT * FROM challenges").all().map(e=>({id:e.id,title:e.title,goal:e.goal,budget_cents:e.budget_cents,currency:e.currency,allowed_tools:JSON.parse(e.allowed_tools),policy:JSON.parse(e.policy),time_limit_seconds:e.time_limit_seconds,success_check:JSON.parse(e.success_check),scoring_weights:JSON.parse(e.scoring_weights)}))}function n(e,t){let s=e.prepare("SELECT * FROM challenges WHERE id = ?").get(t);return s?{id:s.id,title:s.title,goal:s.goal,budget_cents:s.budget_cents,currency:s.currency,allowed_tools:JSON.parse(s.allowed_tools),policy:JSON.parse(s.policy),time_limit_seconds:s.time_limit_seconds,success_check:JSON.parse(s.success_check),scoring_weights:JSON.parse(s.scoring_weights)}:null}function c(e,t){return(t?e.prepare("SELECT * FROM runs WHERE challenge_id = ? ORDER BY started_at DESC").all(t):e.prepare("SELECT * FROM runs ORDER BY started_at DESC").all()).map(e=>({id:e.id,challenge_id:e.challenge_id,contestant_id:e.contestant_id,status:e.status,started_at:e.started_at,ended_at:e.ended_at,wallet:{start_cents:e.wallet_start_cents,balance_cents:e.wallet_balance_cents,currency:e.wallet_currency},live:!!e.live}))}function i(e,t){let s=e.prepare("SELECT * FROM runs WHERE id = ?").get(t);return s?{id:s.id,challenge_id:s.challenge_id,contestant_id:s.contestant_id,status:s.status,started_at:s.started_at,ended_at:s.ended_at,wallet:{start_cents:s.wallet_start_cents,balance_cents:s.wallet_balance_cents,currency:s.wallet_currency},live:!!s.live}:null}function r(e,t){return e.prepare("SELECT * FROM trace_events WHERE run_id = ? ORDER BY seq").all(t).map(e=>({run_id:e.run_id,seq:e.seq,ts:e.ts,type:e.type,summary:e.summary,data:JSON.parse(e.data)}))}function l(e,t){return(t?e.prepare("SELECT * FROM receipts WHERE run_id = ? ORDER BY ts").all(t):e.prepare("SELECT * FROM receipts ORDER BY ts").all()).map(e=>({run_id:e.run_id,ts:e.ts,kind:e.kind,amount_cents:e.amount_cents,currency:e.currency,purpose:e.purpose,stripe_ref:e.stripe_ref,balance_after_cents:e.balance_after_cents}))}function o(e,t){return(t?e.prepare("SELECT * FROM scores WHERE challenge_id = ? ORDER BY rank ASC, total DESC").all(t):e.prepare("SELECT * FROM scores ORDER BY rank ASC, total DESC").all()).map(e=>({run_id:e.run_id,challenge_id:e.challenge_id,contestant_id:e.contestant_id,dimensions:JSON.parse(e.dimensions),total:e.total,rank:e.rank}))}s.d(t,{AE:()=>o,KI:()=>i,aV:()=>c,hm:()=>r,kN:()=>n,td:()=>l,yB:()=>a})},21539:(e,t,s)=>{s.d(t,{z:()=>o});let a=require("better-sqlite3");var n=s.n(a),c=s(7773),i=s(24993);let r=[{id:"agent-surface",name:"Surface (builder re-entered)",kind:"hermes_profile"},{id:"engine-bot",name:"Engine Bot",kind:"hermes_profile"},{id:"external-agent",name:"External Evaluator",kind:"external",endpoint:"https://eval.example.com/agent"}];r.forEach(e=>i.eu.parse(e)),process.env.DB_PATH;let l=null;function o(){if(!l){var e;let t=process.env.DB_PATH||"./walletbench.db";(l=new(n())(t)).pragma("journal_mode = WAL"),(e=l).exec(`
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
      scoring_weights TEXT NOT NULL
    )
  `),e.exec(`
    CREATE TABLE IF NOT EXISTS contestants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      endpoint TEXT
    )
  `),e.exec(`
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
  `),e.exec(`
    CREATE TABLE IF NOT EXISTS trace_events (
      run_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      ts TEXT NOT NULL,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (run_id, seq)
    )
  `),e.exec(`
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
  `),e.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      run_id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      contestant_id TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      total REAL NOT NULL,
      rank INTEGER NOT NULL
    )
  `),e.exec(`
    CREATE INDEX IF NOT EXISTS idx_runs_challenge_id
    ON runs(challenge_id)
  `),e.exec(`
    CREATE INDEX IF NOT EXISTS idx_trace_events_run_id
    ON trace_events(run_id)
  `),e.exec(`
    CREATE INDEX IF NOT EXISTS idx_receipts_run_id
    ON receipts(run_id)
  `),e.exec(`
    CREATE INDEX IF NOT EXISTS idx_scores_challenge_id
    ON scores(challenge_id)
  `),function(e){if(0===e.prepare("SELECT COUNT(*) as c FROM challenges").get().c){let t=e.prepare(`INSERT INTO challenges (id, title, goal, budget_cents, currency, allowed_tools, policy, time_limit_seconds, success_check, scoring_weights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);for(let e of c.o)t.run(e.id,e.title,e.goal,e.budget_cents,e.currency,JSON.stringify(e.allowed_tools),JSON.stringify(e.policy),e.time_limit_seconds,JSON.stringify(e.success_check),JSON.stringify(e.scoring_weights))}if(0===e.prepare("SELECT COUNT(*) as c FROM contestants").get().c){let t=e.prepare("INSERT INTO contestants (id, name, kind, endpoint) VALUES (?, ?, ?, ?)");for(let e of r)t.run(e.id,e.name,e.kind,e.endpoint??null)}}(l)}return l}},24993:(e,t,s)=>{s.d(t,{Mi:()=>r,eu:()=>l});var a=s(38354);let n=a.Ry({spend_cap_cents:a.Rx(),approval_threshold_cents:a.Rx(),allowed_tools:a.IX(a.Z_()).optional(),forbidden_tools:a.IX(a.Z_())}),c=a.Ry({type:a.Z_(),params:a.IM(a._4())}),i=a.Ry({task_success:a.Rx(),roi:a.Rx(),cost:a.Rx(),quality:a.Rx(),time:a.Rx(),policy:a.Rx()}),r=a.Ry({id:a.Z_(),title:a.Z_(),goal:a.Z_(),budget_cents:a.Rx(),currency:a.Z_(),allowed_tools:a.IX(a.Z_()),policy:n,time_limit_seconds:a.Rx(),success_check:c,scoring_weights:i}),l=a.Ry({id:a.Z_(),name:a.Z_(),kind:a.Km(["hermes_profile","external"]),endpoint:a.Z_().optional()}),o=a.Ry({start_cents:a.Rx(),balance_cents:a.Rx(),currency:a.Z_()});a.Ry({id:a.Z_(),challenge_id:a.Z_(),contestant_id:a.Z_(),status:a.Km(["running","complete","failed"]),started_at:a.Z_(),ended_at:a.Z_().nullable(),wallet:o,live:a.O7()}),a.Ry({run_id:a.Z_(),seq:a.Rx(),ts:a.Z_(),type:a.Km(["decision","tool_call","spend","artifact","policy_violation"]),summary:a.Z_(),data:a.Ry({tool:a.Z_().optional(),args:a.IM(a._4()).optional(),result:a._4().optional(),violation_kind:a.Z_().optional(),reason:a.Z_().optional(),amount_cents:a.Rx().optional()})}),a.Ry({run_id:a.Z_(),ts:a.Z_(),kind:a.Km(["charge","payout","refund"]),amount_cents:a.Rx(),currency:a.Z_(),purpose:a.Z_(),stripe_ref:a.Z_(),balance_after_cents:a.Rx()});let _=a.Ry({task_success:a.Km(["pass","partial","fail"]),money_left_cents:a.Rx(),roi:a.Rx(),quality:a.Rx(),time_seconds:a.Rx(),policy_violations:a.Rx(),auditability:a.Rx()});a.Ry({run_id:a.Z_(),challenge_id:a.Z_(),contestant_id:a.Z_(),dimensions:_,total:a.Rx(),rank:a.Rx()}),a.Ry({allowed:a.O7(),reason:a.Z_(),requires_approval:a.O7()})}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[561,30,354],()=>s(19303));module.exports=a})();