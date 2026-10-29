// Reads the live profile pages of the chosen speakers (name, claim, tags, photo).
const {chromium} = require('playwright');
const fs = require('fs');
const slugs = ['oliver-kahn','jochen-schweizer','miriam-meckel','sandra-navidi','anders-indset','hannes-jaenicke','nina-ruge','urs-meier','dani-arnold','michael-gross'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 2});
  const out = [];
  fs.mkdirSync('../public/speakers', {recursive: true});
  for (const slug of slugs) {
    const p = await ctx.newPage();
    const r = await p.goto('https://speakingstage.com/speaker/' + slug, {waitUntil: 'networkidle'});
    const data = await p.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const text = document.body.innerText;
      const known = (text.match(/Bekannt aus:[^\n]*/) || [''])[0];
      const loc = (text.match(/\n([A-ZÄÖÜ][\wäöüß\- ]+)\s*\n•/)||[])[1];
      const img = [...document.querySelectorAll('img')].map(i => ({src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt})).filter(i => i.w > 300);
      const tags = [...document.querySelectorAll('a,span,div')].filter(e => e.children.length === 0 && /rounded-full/.test(e.className || '') ).map(e => e.textContent.trim()).filter(t => t && t.length < 30).slice(0, 6);
      return {h1, known, img: img.slice(0, 2), tags};
    });
    console.log(slug, r.status(), JSON.stringify(data));
    out.push({slug, status: r.status(), ...data});
    await p.close();
  }
  fs.writeFileSync('speakers.json', JSON.stringify(out, null, 2));
  await b.close();
})();
