const { firefox } = require('playwright');

(async () => {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:4000/leaderboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-leaderboard.png', fullPage: false });
  console.log('saved fresh-leaderboard.png');
  await browser.close();
})();
