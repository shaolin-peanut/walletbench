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
  
  const failed = [];
  page.on('requestfailed', req => {
    failed.push(`${req.url()} => ${req.failure()?.errorText}`);
  });
  
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('=== FAILED REQUESTS ===');
  failed.forEach(f => console.log(f));
  if (failed.length === 0) console.log('No failed requests');
  
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/debug-home.png' });
  console.log('saved debug-home.png');
  await browser.close();
})();
