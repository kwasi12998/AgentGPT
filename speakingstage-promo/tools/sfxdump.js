const {chromium}=require('playwright');
(async()=>{const br=await chromium.launch();const pg=await br.newPage();await pg.goto('http://localhost:8766/speakingstage-promo/'+(process.argv[3]||'promo.html')+'?render=1');await pg.waitForFunction('window.__ready');
require('fs').writeFileSync(process.argv[2],JSON.stringify(await pg.evaluate(()=>window.SFX)));await br.close()})();
