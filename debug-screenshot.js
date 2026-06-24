const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: '/home/ops/.cache/ms-playwright/firefox-1532/firefox'
    }
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => errors.push(`console ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', exc => errors.push(`pageerror: ${exc}`));
  
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));
  if (errors.length === 0) console.log('No errors');
  
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/debug-home.png' });
  console.log('saved debug-home.png');
  await browser.close();
})();
