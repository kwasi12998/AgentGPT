// Dumps the text, images and embeds of one speaker profile (read-only).
const {chromium} = require('playwright');
const fs = require('fs');
const slug = process.argv[2];
const out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 2, locale: 'de-DE'});
  const p = await ctx.newPage();
  const r = await p.goto('https://speakingstage.com/speaker/' + slug, {waitUntil: 'networkidle'});
  const c = p.getByRole('button', {name: /Nur notwendige/});
  if (await c.count()) { await c.click(); await p.waitForTimeout(400); }
  // open all accordions so their text is in the DOM
  for (const el of await p.locator('[aria-expanded=false]').all()) { try { await el.click({timeout: 800}); } catch {} }
  await p.waitForTimeout(600);
  const data = await p.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim(),
    text: document.body.innerText,
    imgs: [...document.querySelectorAll('img')].map((i) => ({src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt})).filter((i) => i.w > 120),
    iframes: [...document.querySelectorAll('iframe')].map((i) => i.src),
    videos: [...document.querySelectorAll('video,source')].map((v) => v.src),
    links: [...document.querySelectorAll('a')].map((a) => a.href).filter((h) => /youtube|vimeo|linkedin|instagram|\.mp4/.test(h)),
    height: document.documentElement.scrollHeight
  }));
  console.log('status', r.status());
  fs.writeFileSync(out + '/profile.json', JSON.stringify(data, null, 2));
  console.log(data.title, '| h1:', data.h1, '| height', data.height);
  console.log('imgs', data.imgs.length, 'iframes', data.iframes, 'videos', data.videos, 'links', data.links);
  await b.close();
})();
