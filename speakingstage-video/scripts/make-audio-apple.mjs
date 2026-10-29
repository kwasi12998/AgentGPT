// Music + SFX for the Apple-style video, synced to the audio-first timeline (src/timeline.ts + src/vo-apple.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSynth, mtof} from './synth.mjs';
import {renderMusic} from './music.mjs';
import {buildTimeline} from '../src/timeline.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(here, p), 'utf8'));
const TL = buildTimeline(read('../src/voscript-apple.json').scenes, read('../src/vo-apple.json'));
const B = TL.byId;
const FPS = 30;
const DUR = TL.total / FPS;
const t = (f) => f / FPS;
const S = createSynth(DUR);
const {track, tone, noise, click, pop, bell, whoosh, boom, sparkle, writeWav} = S;
const sfx = track();

// ---- a1: dark room, low air and one soft tick on the key word
noise(sfx, 0, t(B.a1.v0 + 20), {gain: 0.07, lp0: 200, lp1: 900, shape: 'rise'});
tone(sfx, 0, 3.0, 55, {gain: 0.18, decay: 0.7, attack: 1.2, harmonics: [1, 2]});
click(sfx, t(B.a1.v0 + Math.round(B.a1.vFrames * 0.7)), 0.12);

// ---- a2: chair dissolves into light, mic forms
const a2 = B.a2.start;
whoosh(sfx, t(a2 + 6), 0.9, 0.2, true);
sparkle(sfx, t(a2 + 14), 0.12);
noise(sfx, t(a2 + 14), 1.6, {gain: 0.1, lp0: 600, lp1: 6000, shape: 'rise'});
[84, 88, 91].forEach((m, i) => bell(sfx, t(B.a2.v0 + 20 + i * 14), mtof(m), 0.1, i - 1 > 0 ? 0.3 : -0.3, 2.0));
tone(sfx, t(B.a2.end - 34), 1.4, 110, {f1: 220, gain: 0.2, decay: 2.0, attack: 0.5, harmonics: [1, 2]});

// ---- a3: light wipe and reveal
const a3 = B.a3.start;
noise(sfx, t(a3 - 22), 0.9, {gain: 0.16, lp0: 500, lp1: 9000, shape: 'rise'});
boom(sfx, t(a3 + 8), 0.55);
[72, 76, 79, 84].forEach((m, i) => bell(sfx, t(a3 + 10) + i * 0.1, mtof(m), 0.12, i % 2 ? 0.3 : -0.3, 2.6));
[0, 1, 2].forEach((i) => pop(sfx, t(B.a3.v0 + 10 + i * 12), 460 + i * 60, 0.1));
whoosh(sfx, t(a3 + 30), 0.7, 0.14, true);

// ---- a4: one soft low hit per word
['a4a', 'a4b', 'a4c'].forEach((id, i) => {
  const f = B[id].v0;
  tone(sfx, t(f), 0.7, 82 + i * 12, {f1: 55, gain: 0.3, decay: 4});
  click(sfx, t(f), 0.2);
  bell(sfx, t(f) + 0.02, mtof(79 + i * 4), 0.12, i - 1 > 0 ? 0.3 : -0.3, 1.6);
  whoosh(sfx, t(f) - 0.12, 0.3, 0.1, true, i - 1);
});

// ---- a5: call to action
boom(sfx, t(B.a5.v0), 0.55);
[0, 1, 2].forEach((i) => pop(sfx, t(B.a5.v0 + 24 + i * 8), 540 + i * 90, 0.14));
sparkle(sfx, t(B.a5.v0 + 40), 0.1);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, t(B.a5.v0 + B.a5.vFrames + 4) + i * 0.09, mtof(m), 0.16, i % 2 ? 0.3 : -0.3, 2.8));

// ---- music: warm pad only, a light pulse from the reveal on, no drop
const music = renderMusic(S, DUR, {
  breakdown: [[0, DUR]],
  arpFrom: 1e9,
  risers: [],
  pulse: [t(a3 + 20), DUR - 2.5]
});

const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
writeWav(path.join(out, 'apple-music.wav'), music, 0.7);
writeWav(path.join(out, 'apple-sfx.wav'), sfx, 0.85);
