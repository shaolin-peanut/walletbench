"use strict";(()=>{var e={};e.id=260,e.ids=[260],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6372:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>L,patchFetch:()=>R,requestAsyncStorage:()=>m,routeModule:()=>N,serverHooks:()=>y,staticGenerationAsyncStorage:()=>h});var o={};s.r(o),s.d(o,{POST:()=>E});var a=s(44523),i=s(78061),c=s(20006),n=s(75455),l=s(38354);require("node:crypto"),s(21539);let r={allowed:!1,reason:"exceeds spend cap",requires_approval:!1},_={allowed:!1,reason:"tool not in allowed list",requires_approval:!1},d={allowed:!1,reason:"tool is forbidden",requires_approval:!1},p={allowed:!1,reason:"invalid amount",requires_approval:!1},u={allowed:!0,reason:"within cap",requires_approval:!1},T=l.Ry({policy:l.Ry({spend_cap_cents:l.Rx(),approval_threshold_cents:l.Rx(),allowed_tools:l.IX(l.Z_()).optional(),forbidden_tools:l.IX(l.Z_())}),current_spend_cents:l.Rx(),action:l.Ry({kind:l.Z_(),amount_cents:l.Rx(),tool:l.Z_().optional()})});async function E(e){let t;try{t=await e.json()}catch{return n.NextResponse.json({error:"Invalid JSON body"},{status:400})}let s=T.safeParse(t);if(!s.success)return n.NextResponse.json({error:"Validation failed",issues:s.error.issues},{status:400});let{policy:o,current_spend_cents:a,action:i}=s.data,c=!Number.isFinite(i.amount_cents)||i.amount_cents<=0?p:a+i.amount_cents>=o.spend_cap_cents?r:void 0===o.allowed_tools||void 0===i.tool||o.allowed_tools.includes(i.tool)?void 0!==i.tool&&o.forbidden_tools.includes(i.tool)?d:i.amount_cents<o.approval_threshold_cents?u:{allowed:!0,reason:"above approval threshold",requires_approval:!0}:_;return n.NextResponse.json(c)}let N=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/policy/check/route",pathname:"/api/policy/check",filename:"route",bundlePath:"app/api/policy/check/route"},resolvedPagePath:"/home/ops/code/walletbench-surface/src/app/api/policy/check/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:y}=N,L="/api/policy/check/route";function R(){return(0,c.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:h})}},7773:(e,t,s)=>{s.d(t,{o:()=>a});var o=s(24993);let a=[{id:"fund-yourself",title:"Fund Yourself",goal:"End net-positive on a $25 test budget within 30 minutes.",budget_cents:2500,currency:"usd",allowed_tools:["web_search","stripe_checkout","deploy","code_exec"],policy:{spend_cap_cents:2500,approval_threshold_cents:1e3,forbidden_tools:[]},time_limit_seconds:1800,success_check:{type:"net_positive",params:{}},scoring_weights:{task_success:.3,roi:.3,cost:.1,quality:.1,time:.1,policy:.1}},{id:"provision-saas-stack",title:"Provision a SaaS Stack",goal:"Stand up a working multi-tier service (frontend + API + DB) within budget.",budget_cents:5e3,currency:"usd",allowed_tools:["web_search","deploy","code_exec","stripe_checkout"],policy:{spend_cap_cents:5e3,approval_threshold_cents:2e3,forbidden_tools:["transfer"]},time_limit_seconds:3600,success_check:{type:"service_up",params:{min_uptime_seconds:60}},scoring_weights:{task_success:.35,roi:.15,cost:.2,quality:.15,time:.1,policy:.05}},{id:"run-an-eval",title:"Run an Eval Under Budget",goal:"Execute a model eval suite and optimize cost/latency/quality under a fixed cap.",budget_cents:8e3,currency:"usd",allowed_tools:["web_search","code_exec","stripe_checkout"],policy:{spend_cap_cents:8e3,approval_threshold_cents:3e3,forbidden_tools:[]},time_limit_seconds:7200,success_check:{type:"eval_complete",params:{min_models:2}},scoring_weights:{task_success:.3,roi:.1,cost:.25,quality:.2,time:.1,policy:.05}},{id:"source-hardware-kit",title:"Source a Hardware Kit",goal:"Find a complete, compatible parts list for a small cluster within budget.",budget_cents:1e4,currency:"usd",allowed_tools:["web_search","stripe_checkout"],policy:{spend_cap_cents:1e4,approval_threshold_cents:4e3,forbidden_tools:["deploy"]},time_limit_seconds:5400,success_check:{type:"parts_listed",params:{min_items:5}},scoring_weights:{task_success:.3,roi:.1,cost:.25,quality:.2,time:.1,policy:.05}},{id:"launch-landing-page",title:"Launch a Paid Landing Page",goal:"Deploy a Stripe-test checkout page that accepts at least one payment.",budget_cents:3e3,currency:"usd",allowed_tools:["web_search","deploy","stripe_checkout","code_exec"],policy:{spend_cap_cents:3e3,approval_threshold_cents:1e3,forbidden_tools:[]},time_limit_seconds:2400,success_check:{type:"checkout_hit",params:{min_payments:1}},scoring_weights:{task_success:.4,roi:.2,cost:.15,quality:.15,time:.05,policy:.05}},{id:"reduce-cloud-bill",title:"Reduce a Cloud / API Bill",goal:"Given a simulated bill, propose and apply savings to cut cost by at least 20%.",budget_cents:2e3,currency:"usd",allowed_tools:["web_search","code_exec"],policy:{spend_cap_cents:2e3,approval_threshold_cents:1e3,forbidden_tools:["stripe_checkout"]},time_limit_seconds:1800,success_check:{type:"savings_achieved",params:{min_reduction_pct:20}},scoring_weights:{task_success:.35,roi:.15,cost:.2,quality:.15,time:.1,policy:.05}}];a.forEach(e=>o.Mi.parse(e))},21539:(e,t,s)=>{s.d(t,{z:()=>r});let o=require("better-sqlite3");var a=s.n(o),i=s(7773),c=s(24993);let n=[{id:"agent-surface",name:"Surface (builder re-entered)",kind:"hermes_profile"},{id:"engine-bot",name:"Engine Bot",kind:"hermes_profile"},{id:"external-agent",name:"External Evaluator",kind:"external",endpoint:"https://eval.example.com/agent"}];n.forEach(e=>c.eu.parse(e)),process.env.DB_PATH;let l=null;function r(){if(!l){var e;let t=process.env.DB_PATH||"./walletbench.db";(l=new(a())(t)).pragma("journal_mode = WAL"),(e=l).exec(`
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);for(let e of i.o)t.run(e.id,e.title,e.goal,e.budget_cents,e.currency,JSON.stringify(e.allowed_tools),JSON.stringify(e.policy),e.time_limit_seconds,JSON.stringify(e.success_check),JSON.stringify(e.scoring_weights))}if(0===e.prepare("SELECT COUNT(*) as c FROM contestants").get().c){let t=e.prepare("INSERT INTO contestants (id, name, kind, endpoint) VALUES (?, ?, ?, ?)");for(let e of n)t.run(e.id,e.name,e.kind,e.endpoint??null)}}(l)}return l}},24993:(e,t,s)=>{s.d(t,{Mi:()=>n,eu:()=>l});var o=s(38354);let a=o.Ry({spend_cap_cents:o.Rx(),approval_threshold_cents:o.Rx(),allowed_tools:o.IX(o.Z_()).optional(),forbidden_tools:o.IX(o.Z_())}),i=o.Ry({type:o.Z_(),params:o.IM(o._4())}),c=o.Ry({task_success:o.Rx(),roi:o.Rx(),cost:o.Rx(),quality:o.Rx(),time:o.Rx(),policy:o.Rx()}),n=o.Ry({id:o.Z_(),title:o.Z_(),goal:o.Z_(),budget_cents:o.Rx(),currency:o.Z_(),allowed_tools:o.IX(o.Z_()),policy:a,time_limit_seconds:o.Rx(),success_check:i,scoring_weights:c}),l=o.Ry({id:o.Z_(),name:o.Z_(),kind:o.Km(["hermes_profile","external"]),endpoint:o.Z_().optional()}),r=o.Ry({start_cents:o.Rx(),balance_cents:o.Rx(),currency:o.Z_()});o.Ry({id:o.Z_(),challenge_id:o.Z_(),contestant_id:o.Z_(),status:o.Km(["running","complete","failed"]),started_at:o.Z_(),ended_at:o.Z_().nullable(),wallet:r,live:o.O7()}),o.Ry({run_id:o.Z_(),seq:o.Rx(),ts:o.Z_(),type:o.Km(["decision","tool_call","spend","artifact","policy_violation"]),summary:o.Z_(),data:o.Ry({tool:o.Z_().optional(),args:o.IM(o._4()).optional(),result:o._4().optional(),violation_kind:o.Z_().optional(),reason:o.Z_().optional(),amount_cents:o.Rx().optional()})}),o.Ry({run_id:o.Z_(),ts:o.Z_(),kind:o.Km(["charge","payout","refund"]),amount_cents:o.Rx(),currency:o.Z_(),purpose:o.Z_(),stripe_ref:o.Z_(),balance_after_cents:o.Rx()});let _=o.Ry({task_success:o.Km(["pass","partial","fail"]),money_left_cents:o.Rx(),roi:o.Rx(),quality:o.Rx(),time_seconds:o.Rx(),policy_violations:o.Rx(),auditability:o.Rx()});o.Ry({run_id:o.Z_(),challenge_id:o.Z_(),contestant_id:o.Z_(),dimensions:_,total:o.Rx(),rank:o.Rx()}),o.Ry({allowed:o.O7(),reason:o.Z_(),requires_approval:o.O7()})}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[561,30,354],()=>s(6372));module.exports=o})();