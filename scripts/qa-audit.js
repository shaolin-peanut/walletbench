#!/usr/bin/env node
/**
 * QA Audit Script — WalletBench
 *
 * Visits every page, captures console errors, and takes full-page screenshots.
 * Requires Playwright: npx playwright install chromium
 *
 * Usage:
 *   BASE_URL=http://localhost:3939 node scripts/qa-audit.js
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3939";
const OUT_DIR = path.join(__dirname, "..", "qa-screenshots");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { name: "home", url: "/" },
  { name: "leaderboard", url: "/leaderboard" },
  { name: "challenges", url: "/challenges" },
  { name: "challenge-fund-yourself", url: "/challenges/fund-yourself" },
  { name: "run-detail", url: "/runs/run_001" },
  { name: "run-receipts", url: "/runs/run_001/receipts" },
  { name: "receipts", url: "/receipts" },
  { name: "trace", url: "/trace" },
  { name: "demo", url: "/demo" },
  // Error cases
  { name: "404-runs-index", url: "/runs" },
  { name: "404-unknown", url: "/this-does-not-exist" },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const report = [];

  for (const page of PAGES) {
    const p = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    p.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    p.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const screenshotPath = path.join(OUT_DIR, `${page.name}.png`);
    let status = "ok";
    let httpStatus = null;

    try {
      const response = await p.goto(`${BASE_URL}${page.url}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      httpStatus = response ? response.status() : null;

      // Wait a bit for client-side hydration and animations
      await p.waitForTimeout(2000);

      await p.screenshot({ path: screenshotPath, fullPage: true });
    } catch (err) {
      status = "error";
      pageErrors.push(err.message);
      // Try to screenshot anyway
      try {
        await p.screenshot({ path: screenshotPath, fullPage: true });
      } catch (_) {}
    }

    report.push({
      page: page.name,
      url: page.url,
      httpStatus,
      status,
      consoleErrors,
      pageErrors,
      screenshot: `qa-screenshots/${page.name}.png`,
    });

    await p.close();
  }

  // Mobile screenshot of home page
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(OUT_DIR, "home-mobile.png"),
    fullPage: true,
  });
  await mobilePage.goto(`${BASE_URL}/leaderboard`, {
    waitUntil: "networkidle",
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(OUT_DIR, "leaderboard-mobile.png"),
    fullPage: true,
  });
  await mobileContext.close();

  // Write JSON report
  const reportPath = path.join(OUT_DIR, "qa-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n=== QA Audit Summary ===\n");
  for (const r of report) {
    const icon = r.status === "ok" ? "✅" : "❌";
    console.log(`${icon} ${r.page} (${r.httpStatus}) → ${r.screenshot}`);
    if (r.consoleErrors.length > 0) {
      console.log(`   Console errors: ${r.consoleErrors.length}`);
      for (const e of r.consoleErrors) {
        console.log(`     • ${e}`);
      }
    }
    if (r.pageErrors.length > 0) {
      console.log(`   Page errors: ${r.pageErrors.length}`);
      for (const e of r.pageErrors) {
        console.log(`     • ${e}`);
      }
    }
  }

  await browser.close();
  console.log(`\nReport saved to ${reportPath}`);
  console.log(`Screenshots saved to ${OUT_DIR}/`);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
