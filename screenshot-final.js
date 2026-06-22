const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: '/home/ops/.cache/ms-playwright/firefox-1532/firefox'
    }
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-home.png' });
  console.log('saved fresh-home.png');
  
  await page.goto('http://127.0.0.1:4000/challenges', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-challenges.png' });
  console.log('saved fresh-challenges.png');
  
  await page.goto('http://127.0.0.1:4000/leaderboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-leaderboard.png' });
  console.log('saved fresh-leaderboard.png');
  
  await browser.close();
})();
