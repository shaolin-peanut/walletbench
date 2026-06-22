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
  
  const badStatus = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('_next/') && res.status() !== 200) {
      const text = await res.text().catch(() => '<binary or failed>');
      badStatus.push(`${url} => ${res.status()} :: ${text.slice(0, 200)}`);
    }
  });
  
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('=== BAD STATUS ===');
  badStatus.forEach(f => console.log(f));
  if (badStatus.length === 0) console.log('No bad status responses');
  
  await page.screenshot({ path: '/home/ops/code/walletbench-surface/demo-assets/debug-home.png' });
  console.log('saved debug-home.png');
  await browser.close();
})();
