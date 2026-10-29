// Usage: node scripts/stills.mjs <outDir> <scale> <frame> [frame...]
// Bundles once, then renders the requested frames of SpeakerV2 as PNG stills (quick visual review).
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [out, scale, ...frames] = process.argv.slice(2);
const id = process.env.COMP || 'SpeakerV2';
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opts = {browserExecutable: '/opt/pw-browsers/chromium', chromiumOptions: {gl: 'swangle'}};
const comp = await selectComposition({serveUrl, id, ...opts});
for (const f of frames) {
  const t = Date.now();
  await renderStill({composition: comp, serveUrl, frame: Number(f), output: path.join(out, `f${String(f).padStart(4, '0')}.png`), scale: Number(scale), ...opts});
  console.log('frame', f, Date.now() - t, 'ms');
}
