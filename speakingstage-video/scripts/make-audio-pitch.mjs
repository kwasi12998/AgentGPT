// Music + SFX for the pitch video, synced to the audio-first timeline (src/timeline.ts + src/vo-pitch.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSynth, mtof} from './synth.mjs';
import {renderMusic} from './music.mjs';
import {buildTimeline} from '../src/timeline.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(here, p), 'utf8'));
const TL = buildTimeline(read('../src/voscript-pitch.json').scenes, read('../src/vo-pitch.json'));
const B = TL.byId;
const FPS = 30;
const DUR = TL.total / FPS;
const t = (f) => f / FPS;
const u = (id, frac) => B[id].v0 + frac * B[id].vFrames;
const S = createSynth(DUR);
const {track, tone, noise, kick, click, pop, bell, whoosh, boom, sparkle, writeWav} = S;
const pan = (i) => (i % 2 ? 0.35 : -0.35);
const sfx = track();

// same word timing as src/pitch/Pitch.tsx (share of characters across the spoken segment)
const wordTimes = (id, words) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const f = B[id].v0 + (acc / total) * B[id].vFrames * 0.94;
    acc += w.length + 1;
    return f;
  });
};

// ---- b1: hook
const hookWords = 'Als Frau musst du DOPPELT so gut sein, damit ein Mann anerkennt, dass du HALB so gut bist wie er.'.split(' ');
const hookAt = wordTimes('b1', hookWords);
boom(sfx, 0, 0.5);
hookWords.forEach((w, i) => {
  if (w === 'DOPPELT') {
    boom(sfx, t(hookAt[i]), 0.95);
    kick(sfx, t(hookAt[i]), 0.8);
    noise(sfx, t(hookAt[i]) - 0.25, 0.25, {gain: 0.2, lp0: 300, lp1: 8000, shape: 'rise'});
    sparkle(sfx, t(hookAt[i]) + 0.03, 0.12);
  } else if (w === 'HALB') {
    tone(sfx, t(hookAt[i]), 0.5, 520, {f1: 180, gain: 0.22, decay: 5});
  } else click(sfx, t(hookAt[i]), 0.1 + 0.03 * (i % 3), pan(i) * 0.5);
});
whoosh(sfx, t(B.b1.end - 14), 0.45, 0.2, true);

// ---- b2
wordTimes('b2', ['Viele', 'Frauen', 'kennen', 'diesen', 'Satz.']).forEach((f, i) => {
  pop(sfx, t(f), 420 + i * 40, 0.12);
});
bell(sfx, t(B.b2.v0 + 8), mtof(76), 0.16, 0, 1.6);

// ---- flights into the 3D scenes
['b3', 'b4', 'b5', 'b6', 'b7', 'b10', 'b11'].forEach((id, i) => {
  const a = B[id].start;
  const len = B[id].v0 - B[id].start;
  whoosh(sfx, t(a), t(len) + 0.2, 0.3, i % 2 === 0, i % 2 ? 0.4 : -0.4);
  tone(sfx, t(a), t(len), 70, {f1: 230, gain: 0.12, decay: 0.8, attack: 0.3, harmonics: [1, 2]});
});

// ---- b3: the crowd, one voice leaves
for (let r = 0; r < 4; r++) pop(sfx, t(B.b3.start + 8 + r * 7), 330 + r * 30, 0.1);
bell(sfx, t(u('b3', 0.5)), mtof(72), 0.22, 0, 2.0);
whoosh(sfx, t(u('b3', 0.62)), 0.8, 0.22, false, -0.5);
tone(sfx, t(u('b3', 0.66)), 1.2, 110, {f1: 55, gain: 0.25, decay: 2.2});

// ---- b4: all tools, no attitude
for (let i = 0; i < 4; i++) pop(sfx, t(u('b4', 0.04 + i * 0.1)), 380 + i * 25, 0.12);
bell(sfx, t(u('b4', 0.4)), mtof(67), 0.18, 0, 1.8);
tone(sfx, t(u('b4', 0.55)), 1.0, 220, {f1: 110, gain: 0.2, decay: 2.5});

// ---- b5: clichés swiped away, plain talk revealed
bell(sfx, t(u('b5', 0.1)), mtof(88), 0.2, 0, 1.8);
sparkle(sfx, t(u('b5', 0.1)) + 0.02, 0.1);
for (let i = 0; i < 3; i++) whoosh(sfx, t(u('b5', 0.5 + i * 0.1)), 0.38, 0.26, true, 0.6 - i * 0.2);

// ---- b6: the solution
whoosh(sfx, t(B.b6.start + 8), 0.6, 0.18, true);
pop(sfx, t(B.b6.start + 14), 480, 0.2);
[B.b6.v0 + 2, B.b6.v0 + 10].forEach((f, i) => {
  kick(sfx, t(f), 0.6);
  click(sfx, t(f), 0.3);
  bell(sfx, t(f) + 0.02, mtof(i ? 91 : 84), 0.12, pan(i), 1.2);
});
[20, 28].forEach((d, i) => pop(sfx, t(B.b6.v0 + d), 520 + i * 100, 0.18));
[0.42, 0.66].forEach((fr, i) => bell(sfx, t(u('b6', fr)), mtof(84 + i * 4), 0.16, pan(i), 1.4));

// ---- b7-b9: problem cards flip into keynotes
[0, 1, 2].forEach((i) => pop(sfx, t(B.b7.v0 - 6 + i * 6), 470 + i * 60, 0.14));
['b7', 'b8', 'b9'].forEach((id, i) => {
  const a = u(id, 0.12);
  whoosh(sfx, t(a), 0.42, 0.24, true, pan(i));
  kick(sfx, t(a + 13), 0.55);
  click(sfx, t(a + 13), 0.28);
  bell(sfx, t(a + 13), mtof(84 + i * 3), 0.2, pan(i), 1.6);
  sparkle(sfx, t(a + 14), 0.08);
});

// ---- b10: message
[0, 1, 2].forEach((i) => pop(sfx, t(B.b10.v0 + 4 + i * 8), 460 + i * 70, 0.14));
wordTimes('b10', 'Du musst nicht die Person bleiben, die andere in dir sehen.'.split(' ')).forEach((f, i) => click(sfx, t(f), 0.12, pan(i) * 0.5));
bell(sfx, t(B.b10.v0 + B.b10.vFrames - 4), mtof(91), 0.2, 0, 2.0);

// ---- b11: call to action
boom(sfx, t(B.b11.v0), 0.85);
[0, 10].forEach((d, i) => {
  if (i) kick(sfx, t(B.b11.v0 + d), 0.65);
  click(sfx, t(B.b11.v0 + d), 0.3);
  whoosh(sfx, t(B.b11.v0 + d) - 0.06, 0.28, 0.16, true);
});
[0, 1, 2, 3].forEach((i) => pop(sfx, t(B.b11.v0 + 22 + i * 7), 540 + i * 90, 0.2));
sparkle(sfx, t(B.b11.v0 + 34), 0.12);
pop(sfx, t(B.b11.v0 + 46), 700, 0.25);
bell(sfx, t(B.b11.v0 + 46) + 0.02, mtof(91), 0.18);
click(sfx, t(B.b11.v0 + 70), 0.2);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, t(B.b11.v0 + B.b11.vFrames + 4) + i * 0.09, mtof(m), 0.2, pan(i), 2.4));

// ---- music: sparse during the problem, groove once the solution starts
const music = renderMusic(S, DUR, {
  groove: [[t(B.b6.start), DUR - 1.2]],
  breakdown: [[0, t(B.b6.start)]],
  risers: ['b3', 'b4', 'b5', 'b6', 'b7', 'b10', 'b11'].map((id) => [t(B[id].start), t(B[id].v0)]),
  arpFrom: t(B.b3.start),
  hatsFrom: t(B.b7.start)
});

const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
writeWav(path.join(out, 'pitch-music.wav'), music, 0.8);
writeWav(path.join(out, 'pitch-sfx.wav'), sfx, 0.85);
