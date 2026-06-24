const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-home.png', fullPage: false });
  console.log('saved fresh-home.png');
  
  await page.goto('http://127.0.0.1:4000/challenges', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/fresh-challenges.png', fullPage: false });
  console.log('saved fresh-challenges.png');
  
  await browser.close();
})();
