const { firefox } = require("playwright");
const fs = require("fs");
const path = require("path");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureDemo() {
  const outPath = path.join(__dirname, "..", "docs", "demo-dry-run.mp4");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const videoDir = path.join(__dirname, "..", "tmp-video");
  fs.rmSync(videoDir, { recursive: true, force: true });
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await firefox.launch({
    headless: true,
    executablePath:
      "/home/ops/.cache/ms-playwright/firefox-1532/firefox/firefox",
  });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // Collect console/network errors
  const consoleErrors = [];
  const apiErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 500) apiErrors.push(`${res.status()} ${res.url()}`);
  });

  try {
    // Step 1: leaderboard for Fund Yourself
    await page.goto("http://localhost:3000/leaderboard?challenge_id=fund-yourself");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("table tbody tr", { timeout: 15000 });
    await delay(2000);
    const rowCount = await page.locator("table tbody tr").count();
    if (rowCount < 3) throw new Error(`Expected >=3 contestants, got ${rowCount}`);
    const totals = await page.locator("table tbody tr td").allTextContents();
    console.log("Leaderboard totals:", totals.slice(0, 6));
    const totalFirst = parseFloat(totals[5]);
    const totalSecond = parseFloat(totals[11]);
    if (totalFirst === totalSecond) {
      throw new Error(`Varied scores check failed: ${totalFirst} == ${totalSecond}`);
    }

    // Step 2: navigate to challenges -> show all 6
    await page.goto("http://localhost:3000/challenges");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1", { timeout: 15000 });
    const challengeCards = await page.locator("a[href^='/challenges/']").count();
    console.log("Challenge cards:", challengeCards);
    if (challengeCards < 6) throw new Error(`Expected >=6 challenges, got ${challengeCards}`);
    if (challengeCards > 0) {
      await page.locator("a[href='/challenges/fund-yourself']").first().click();
      await page.waitForLoadState("networkidle");
      await delay(1000);
    }

    // Step 3: open a replay run
    const runId = "a39f55e9-a9f7-4e0b-9f5a-a4a0acd04607";
    await page.goto(`http://localhost:3000/runs/${runId}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector("h1", { timeout: 15000 });
    await delay(2000);
    const eventCount = await page.locator(".group.rounded-2xl").count();
    console.log("Trace events on page:", eventCount);
    if (eventCount === 0) throw new Error("No trace events rendered on run page");

    // Step 4: receipts
    await page.goto(`http://localhost:3000/runs/${runId}/receipts`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1", { timeout: 15000 });
    await delay(1500);
    const receiptRows = await page.locator("table tbody tr").count();
    console.log("Receipt rows:", receiptRows);
    if (receiptRows === 0) throw new Error("No receipt rows rendered on receipts page");
    const hasBurnChart = await page.locator("text=Burn Chart").count();
    if (!hasBurnChart) throw new Error("Burn chart section missing");

    // Step 5: back to leaderboard, sort by different columns
    await page.goto("http://localhost:3000/leaderboard?challenge_id=fund-yourself");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("button, th", { timeout: 15000 });
    await delay(1000);

    // Try toggling sort by clicking headers or buttons
    const sortSelectors = [
      'button:has-text("Rank")',
      'th:has-text("Rank")',
      'button:has-text("ROI")',
      'th:has-text("ROI")',
      'button:has-text("Money")',
      'th:has-text("Money")',
      'button:has-text("Violations")',
      'th:has-text("Violations")',
    ];
    for (const sel of sortSelectors) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.click();
        await delay(800);
      }
    }

    // Verify meta beat: contestant name visible on leaderboard
    const hasMeta = await page
      .locator("text=hermes-build-team")
      .count();
    if (hasMeta === 0) throw new Error("Meta beat contestant 'hermes-build-team' not visible");

    // Final leaderboard frame
    await page.screenshot({ path: path.join(__dirname, "..", "docs", "demo-leaderboard-final.png"), fullPage: true });

    if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(", ")}`);
    if (apiErrors.length) throw new Error(`API 5xx: ${apiErrors.join(", ")}`);
  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, "..", "docs", "demo-dry-run-error.png"), fullPage: true });
    throw err;
  } finally {
    await context.close();
    await browser.close();
  }

  const files = fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const webm = path.join(videoDir, files[0]);
    const { execSync } = require("child_process");
    execSync(
      `ffmpeg -y -i "${webm}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outPath}"`,
      { stdio: "inherit" }
    );
  } else {
    console.warn("No webm video found in", videoDir);
  }

  fs.rmSync(videoDir, { recursive: true, force: true });
  console.log("Demo recorded to", outPath);
}

if (require.main === module) {
  captureDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { captureDemo };
