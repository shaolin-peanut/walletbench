const { firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'qa-screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const PAGES = [
    { name: 'challenges-enhance', url: '/challenges' },
    { name: 'challenge-fund-yourself-enhance', url: '/challenges/fund-yourself' },
  ];

  const consoleErrors = [];
  const pageErrors = [];

  for (const page of PAGES) {
    const p = await context.newPage();
    p.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    p.on('pageerror', (err) => pageErrors.push(err.message));

    const screenshotPath = path.join(OUT_DIR, `${page.name}.png`);
    try {
      const response = await p.goto(`${BASE_URL}${page.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await p.waitForTimeout(2000);
      await p.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ ${page.name} (${response.status()}) → ${screenshotPath}`);
    } catch (err) {
      console.error(`❌ ${page.name}: ${err.message}`);
      try {
        await p.screenshot({ path: screenshotPath, fullPage: true });
      } catch (_) {}
    }
    await p.close();
  }

  // Write a small report
  const report = {
    page: 'qa-report',
    consoleErrors,
    pageErrors,
    screenshotDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'enhance-report.json'), JSON.stringify(report, null, 2));
  console.log('Report saved.');

  await browser.close();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
