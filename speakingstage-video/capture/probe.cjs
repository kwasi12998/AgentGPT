const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 1});
  const p = await ctx.newPage();
  for (const url of ['https://speakingstage.com/', 'https://speakingstage.com/speaker-werden']) {
    await p.goto(url, {waitUntil: 'networkidle'});
    const cookie = p.getByRole('button', {name: /Nur notwendige/});
    if (await cookie.count()) await cookie.click();
    await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({
      inputs: [...document.querySelectorAll('input,textarea,select,button[type=submit]')].map(e => ({tag: e.tagName, type: e.type, name: e.name, id: e.id, ph: e.placeholder, label: e.labels?.[0]?.textContent?.trim()?.slice(0, 40)})).slice(0, 30),
      h2: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()).slice(0, 12),
      height: document.documentElement.scrollHeight
    }));
    console.log(url, JSON.stringify(info, null, 1));
  }
  await b.close();
})();
