#!/usr/bin/env node
/**
 * Surface Visual Gate Check — WalletBench
 *
 * Validates that a Surface task's evidence package meets the 5-point gate:
 * 1) 2+ screenshots
 * 2) exact route URLs
 * 3) build result (pass/fail + no fatal errors when fail)
 * 4) console/runtime errors list
 * 5) styling verification statement
 *
 * Usage:
 *   node scripts/surface-gate-check.js /path/to/SURFACE_GATE_MANIFEST.json
 *
 * Exit codes:
 *   0 — gate passed
 *   1 — gate failed
 */

const fs = require("fs");
const path = require("path");

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
  return false;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
  return true;
}

function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    fail("Missing manifest path. Usage: node scripts/surface-gate-check.js <manifest.json>");
    process.exit(1);
  }

  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    fail(`Manifest is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const basedir = path.dirname(manifestPath);
  let passed = true;

  // 1) 2+ screenshots
  const screenshots = Array.isArray(data.screenshots) ? data.screenshots : [];
  if (screenshots.length < 2) {
    passed = fail(`Need 2+ screenshots, got ${screenshots.length}`) && passed;
  } else {
    passed = ok(`Screenshots count: ${screenshots.length}`) && passed;
    for (const rel of screenshots) {
      const abs = path.join(basedir, rel);
      if (!fs.existsSync(abs)) {
        passed = fail(`Screenshot missing: ${rel}`) && passed;
      }
    }
  }

  // 2) exact route URLs
  const routes = Array.isArray(data.changed_routes) ? data.changed_routes : [];
  if (routes.length < 2) {
    passed = fail(`Need 2+ changed_routes, got ${routes.length}`) && passed;
  } else {
    passed = ok(`Changed routes count: ${routes.length}`) && passed;
    for (const r of routes) {
      if (typeof r !== "string" || r.length === 0) {
        passed = fail(`Empty or invalid route URL: ${r}`) && passed;
      }
    }
  }

  // 3) build result
  const build = data.build_result || {};
  const cmd = typeof build.command === "string" ? build.command : null;
  if (!cmd) {
    passed = fail("Missing build_result.command") && passed;
  } else {
    passed = ok(`Build command present: ${cmd}`) && passed;
    const es = build.exit_status;
    if (es !== "pass" && es !== "fail") {
      passed = fail("build_result.exit_status must be 'pass' or 'fail'") && passed;
    } else {
      passed = ok(`Build exit status: ${es}`) && passed;
      if (es === "fail") {
        const errs = Array.isArray(build.errors) ? build.errors : [];
        if (errs.length === 0) {
          passed = fail("Build failed but build_result.errors is empty") && passed;
        } else {
          passed = ok(`Build errors listed: ${errs.length}`) && passed;
        }
      }
    }
  }

  // 4) console/runtime errors
  const consoleErrors = Array.isArray(data.console_errors) ? data.console_errors : [];
  const runtimeErrors = Array.isArray(data.runtime_errors) ? data.runtime_errors : [];
  if (!Array.isArray(data.console_errors)) {
    passed = fail("console_errors must be an array") && passed;
  }
  if (!Array.isArray(data.runtime_errors)) {
    passed = fail("runtime_errors must be an array") && passed;
  }
  passed = ok(`Console errors: ${consoleErrors.length}, Runtime errors: ${runtimeErrors.length}`) && passed;

  // 5) styling verification statement
  const styling = typeof data.styling_verification === "string" ? data.styling_verification.trim() : "";
  if (styling.length === 0) {
    passed = fail("Missing styling_verification statement") && passed;
  } else {
    const looksGenuine = /genuine/i.test(styling) || /degraded/i.test(styling);
    if (!looksGenuine) {
      passed = fail("styling_verification must state whether styling is genuine or degraded") && passed;
    } else {
      passed = ok("Styling verification statement present and explicit") && passed;
    }
  }

  if (passed) {
    console.log("\nSurface visual gate: PASSED");
  } else {
    console.log("\nSurface visual gate: FAILED");
  }
  process.exit(passed ? 0 : 1);
}

main();
