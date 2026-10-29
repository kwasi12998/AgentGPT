// Deterministic, frame-by-frame screen recordings of the live site (mobile viewport, DPR 2 => 860x1864).
// The speaker form is filled with demo data and is NEVER submitted.
const {chromium} = require('playwright');
const fs = require('fs');
const {execSync} = require('child_process');
const FPS = 30;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const only = process.argv[2];

async function clip(page, name, frames, step) {
  if (only && only !== name) return;
  const dir = `/tmp/claude-0/frames-${name}`;
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  for (let f = 0; f < frames; f++) {
    await step(f);
    await page.screenshot({path: `${dir}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92});
  }
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart ../public/rec-${name}.mp4`);
  console.log('clip', name, frames + ' frames');
}
const scrollTo = (page, y) => page.evaluate((y) => window.scrollTo({top: y, behavior: 'instant'}), y);
const type = async (loc, text, f, from, every) => {
  const n = Math.min(text.length, Math.max(0, Math.floor((f - from) / every)));
  const cur = await loc.inputValue();
  if (cur.length !== n) await loc.fill(text.slice(0, n));
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 430, height: 932}, deviceScaleFactor: 2, locale: 'de-DE'});
  const page = await ctx.newPage();
  const open = async (url) => {
    await page.goto(url, {waitUntil: 'networkidle'});
    const c = page.getByRole('button', {name: /Nur notwendige/});
    if (await c.count()) { await c.click(); await page.waitForTimeout(400); }
  };

  // A: AI search – type the query (not submitted, to avoid hitting their AI backend)
  await open('https://speakingstage.com/');
  const ta = page.locator('#ki-search-input');
  await clip(page, 'search', 150, async (f) => {
    if (f === 12) await ta.click();
    await type(ta, 'Keynote KI & Change für 150 Führungskräfte in München', f, 18, 2);
  });

  // B: recommended speakers – scroll
  await open('https://speakingstage.com/');
  const y0 = await page.evaluate(() => document.querySelector('h2').getBoundingClientRect().top + window.scrollY - 90);
  await clip(page, 'speakers', 180, async (f) => {
    await scrollTo(page, y0 + ease(Math.min(1, f / 150)) * 1500);
  });

  // C: speaker profile – scroll
  await open('https://speakingstage.com/speaker/oliver-kahn');
  await clip(page, 'profile', 150, async (f) => {
    await scrollTo(page, ease(Math.min(1, f / 130)) * 1300);
  });

  // D: become a speaker – fill the form (demo data, no submit)
  await open('https://speakingstage.com/speaker-werden');
  const nm = page.locator('input[name=name]');
  const em = page.locator('input[name=email]');
  const ph = page.locator('input[name=phone]');
  const co = page.locator('input[name=company]');
  const ad = page.locator('input[name=addressLabel]');
  const fy = await page.evaluate(() => document.querySelector('input[name=name]').getBoundingClientRect().top + window.scrollY - 330);
  await clip(page, 'form', 240, async (f) => {
    await scrollTo(page, f < 30 ? ease(f / 30) * fy : fy);
    await type(nm, 'Dr. Anna Berger', f, 40, 2);
    await type(em, 'anna.berger@example.com', f, 76, 2);
    await type(ph, '+49 170 1234567', f, 126, 2);
    await type(co, 'Berger Consulting', f, 160, 2);
    await type(ad, 'München, Deutschland', f, 198, 2);
  });
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
