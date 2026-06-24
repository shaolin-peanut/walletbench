const { firefox } = require('playwright');
(async()=>{
  const b = await firefox.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:3939', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(await p.title());
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
