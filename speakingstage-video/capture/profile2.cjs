const {chromium} = require('playwright');
const fs = require('fs');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 2, locale: 'de-DE'});
  const p = await ctx.newPage();
  await p.goto('https://speakingstage.com/speaker/chris-aike-spring', {waitUntil: 'networkidle'});
  const c = p.getByRole('button', {name: /Nur notwendige/});
  if (await c.count()) { await c.click(); await p.waitForTimeout(400); }
  const res = {};
  const clickText = async (re) => { const l = p.getByText(re).first(); if (await l.count()) { await l.scrollIntoViewIfNeeded(); await l.click({timeout: 3000}).catch(() => {}); await p.waitForTimeout(700); return true; } return false; };
  // keynotes: click each title in "Formate & Inhalte"
  const titles = ['Wer bin ich, wenn niemand mehr entscheidet, wer ich sein soll?', 'Führungshaltung vervielfacht Verhalten', 'Als Frau musst du doppelt so gut sein', 'Ehrlichkeit als Diagnoseinstrument', 'Im nächsten Leben wäre ich gerne ein Mann'];
  res.keynotes = {};
  for (const t of titles) {
    const btn = p.locator('button', {hasText: t}).last();
    if (await btn.count()) {
      await btn.scrollIntoViewIfNeeded(); await btn.click().catch(() => {}); await p.waitForTimeout(500);
      const panel = await btn.evaluate((el) => { const n = el.closest('div'); return (el.parentElement?.parentElement?.innerText || '').slice(0, 1500); });
      res.keynotes[t] = panel;
    }
  }
  await clickText(/Mehr über Chris-Aike lesen/);
  res.about = await p.evaluate(() => { const h = [...document.querySelectorAll('h2,h3')].find((x) => /Über Chris/.test(x.textContent)); return h ? h.parentElement.innerText : ''; });
  await clickText(/ansehen/);
  res.afterClick = await p.evaluate(() => document.body.innerText.slice(0, 200));
  res.modal = await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText.slice(0, 1500) : null; });
  res.iframes = await p.evaluate(() => [...document.querySelectorAll('iframe')].map((i) => i.src));
  fs.writeFileSync(out + '/profile2.json', JSON.stringify(res, null, 2));
  await b.close();
})();
