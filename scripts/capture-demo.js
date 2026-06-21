const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function captureDemo() {
  const outDir = path.join(__dirname, "..", "demo-assets");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  // Screenshot for thumbnail
  await page.screenshot({ path: path.join(outDir, "landing.png"), fullPage: true });

  // TODO: navigate to leaderboard, inject mock data, animate

  await context.close();
  await browser.close();
  console.log("Demo captured to", outDir);
}

if (require.main === module) {
  captureDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { captureDemo };
