const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const outDir = path.join(__dirname, 'qa-screenshots');
    fs.mkdirSync(outDir, { recursive: true });
    const routes = [
      ['/', 'home'],
      ['/leaderboard', 'leaderboard'],
      ['/challenges', 'challenges'],
      ['/challenges/fund-yourself', 'challenge-fund-yourself'],
      ['/runs/run_001', 'run-detail'],
      ['/runs/run_001/receipts', 'run-receipts'],
      ['/receipts', 'receipts'],
      ['/trace', 'trace'],
      ['/demo', 'demo'],
      ['/this-does-not-exist', '404-unknown'],
    ];
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const results = [];
    for (const [pathname, name] of routes) {
      const url = 'http://localhost:3939' + pathname;
      let status = 0;
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        status = res ? res.status() : 0;
      } catch (e) {
        results.push({ page: name, url: pathname, httpStatus: 0, status: 'error', pageErrors: [e.message], screenshot: `qa-screenshots/${name}.png` });
        continue;
      }
      await page.screenshot({ path: path.join(outDir, `${name}.png`) });
      const isOk = status === 200 || status === 404;
      results.push({ page: name, url: pathname, httpStatus: status, status: isOk ? 'ok' : 'check', screenshot: `qa-screenshots/${name}.png` });
    }
    await browser.close();
    fs.writeFileSync(path.join(outDir, 'qa-report.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
