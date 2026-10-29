// Frame-by-frame screen recording of one speaker profile (mobile viewport, DPR 2 => 860x1864), read-only.
//   node record-profile.cjs chris-aike-spring chris
const {chromium} = require('playwright');
const fs = require('fs');
const {execSync} = require('child_process');
const [slug, name] = process.argv.slice(2);
const FRAMES = 270;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 2, locale: 'de-DE'});
  const page = await ctx.newPage();
  await page.goto('https://speakingstage.com/speaker/' + slug, {waitUntil: 'networkidle'});
  const c = page.getByRole('button', {name: /Nur notwendige/});
  if (await c.count()) { await c.click(); await page.waitForTimeout(400); }
  const y = (sel) => page.evaluate((s) => { const e = [...document.querySelectorAll('h2,h3')].find((x) => x.textContent.includes(s)); return e ? e.getBoundingClientRect().top + window.scrollY - 70 : 0; }, sel);
  const yFormats = await y('Formate');
  const yAbout = await y('Über');
  const titles = ['Führungshaltung vervielfacht Verhalten', 'Als Frau musst du doppelt so gut sein', 'Ehrlichkeit als Diagnoseinstrument'];
  const dir = `/tmp/claude-0/frames-${name}`;
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  let scroll = 0;
  const scrollTo = (v) => page.evaluate((v) => window.scrollTo({top: v, behavior: 'instant'}), v);
  for (let f = 0; f < FRAMES; f++) {
    // 0-24 hold on the hero, 24-84 scroll to the keynotes, then open three keynotes, finally drift towards the biography
    if (f < 24) scroll = 0;
    else if (f < 84) scroll = ease((f - 24) / 60) * yFormats;
    else if (f >= 200) scroll = yFormats + ease(Math.min(1, (f - 200) / 70)) * Math.min(420, yAbout - yFormats);
    else scroll = yFormats + ((f - 84) / 116) * 120;
    await scrollTo(scroll);
    for (const [i, at] of [96, 140, 184].entries()) {
      if (f === at) {
        const btn = page.locator('button', {hasText: titles[i]}).last();
        if (await btn.count()) await btn.click({timeout: 2000}).catch(() => {});
        await page.waitForTimeout(250);
      }
    }
    await page.screenshot({path: `${dir}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92});
  }
  execSync(`ffmpeg -v error -y -framerate 30 -i ${dir}/%04d.jpg -c:v libvpx-vp9 -crf 28 -b:v 0 -pix_fmt yuv420p -row-mt 1 -deadline good -cpu-used 2 ../public/rec-${name}.webm`);
  console.log('recorded', name, FRAMES, 'frames');
  await b.close();
})();
