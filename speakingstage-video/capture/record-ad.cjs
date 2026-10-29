// Desktop screen recordings of the live site for the ad (1280x800 viewport, DPR 1.5 => 1920x1200).
// Deterministic, frame by frame. Nothing is submitted: the search text is only typed, forms stay untouched.
const {chromium} = require('playwright');
const fs = require('fs');
const {execSync} = require('child_process');
const FPS = 30;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const only = process.argv[2];

async function clip(page, name, frames, step, after) {
  if (only && only !== name) return;
  const meta = [];
  const dir = `/tmp/claude-0/frames-${name}`;
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  for (let f = 0; f < frames; f++) {
    await step(f);
    if (after) meta.push(await after());
    await page.screenshot({path: `${dir}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90});
  }
  if (after) fs.writeFileSync(`../public/rec-${name}.json`, JSON.stringify(meta));
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libvpx-vp9 -crf 30 -b:v 0 -pix_fmt yuv420p ../public/rec-${name}.webm`);
  console.log('clip', name, frames + ' frames');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, deviceScaleFactor: 1.5, locale: 'de-DE'});
  const page = await ctx.newPage();
  const open = async (url) => {
    await page.goto(url, {waitUntil: 'networkidle'});
    const c = page.getByRole('button', {name: /Nur notwendige/});
    if (await c.count()) { await c.click(); await page.waitForTimeout(500); }
  };

  // A: AI search - focus the field and type the query (not submitted)
  await open('https://speakingstage.com/');
  const ta = page.locator('#ki-search-input');
  const query = 'Keynote zu KI und Change für 150 Führungskräfte in München';
  await clip(page, 'adki', 110, async (f) => {
    if (f === 10) await ta.click();
    const n = Math.min(query.length, Math.max(0, f - 18));
    if ((await ta.inputValue()).length !== n) await ta.fill(query.slice(0, n));
  });

  // B: speaker profile - scroll from the hero to the fit check and the request card
  await open('https://speakingstage.com/speaker/chris-aike-spring');
  await clip(page, 'adprof', 150, async (f) => {
    const y = ease(Math.min(1, Math.max(0, (f - 20) / 100))) * 1010;
    await page.evaluate((y) => window.scrollTo({top: y, behavior: 'instant'}), y);
  }, () =>
    page.evaluate(() => {
      const box = (el) => (el ? (({x, y, width, height}) => [x, y, width, height].map((v) => Math.round(v * 10) / 10))(el.getBoundingClientRect()) : null);
      const smallest = (t) => [...document.querySelectorAll('button,a,div,span,h1,h2,p')].filter((e) => e.innerText && e.innerText.includes(t)).sort((a, b) => a.innerText.length - b.innerText.length)[0];
      let thumb = smallest('Moderation');
      for (let i = 0; i < 4 && thumb && thumb.getBoundingClientRect().width < 110; i++) thumb = thumb.parentElement;
      return {thumb: box(thumb), chips: box(smallest('Positive Psychologie')?.parentElement), keynotes: box(smallest('Wer bin ich, wenn niemand')?.parentElement?.parentElement), fit: box(smallest('Passt Chris-Aike Spring zu Ihrem Event?')?.parentElement?.parentElement), req: box(smallest('Speaker unverbindlich anfragen'))};
    }));

  await b.close();
})();
