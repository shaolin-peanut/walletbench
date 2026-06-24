const { chromium } = require('playwright');
const fs = require('fs');

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
  // Wait a bit for CSS to apply
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-home.png', fullPage: false });
  console.log('saved fresh-home.png');
  
  await page.goto('http://127.0.0.1:4000/challenges', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-challenges.png', fullPage: false });
  console.log('saved fresh-challenges.png');
  
  await browser.close();
})();
