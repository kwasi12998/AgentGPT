// Music + SFX for SpeakerV2, synced to src/timing2.json (and the camera flights in src/V2.tsx).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSynth, mtof, SR} from './synth.mjs';

import {buildWarp} from '../src/warp.ts';

// `--vo` renders the soundtrack for the voice-over cut: every event is mapped through the same time warp as the picture.
const here = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(here, '../src/timing2.json'), 'utf8'));
const VO = process.argv.includes('--vo');
const W = VO
  ? buildWarp(T.total, JSON.parse(fs.readFileSync(path.join(here, '../src/voscript.json'), 'utf8')).scenes, JSON.parse(fs.readFileSync(path.join(here, '../src/vo.json'), 'utf8')))
  : {total: T.total, out: (l) => l};
const DUR = W.total / T.fps;
const f2t = (f) => W.out(f) / T.fps;
const span = (a, b) => (W.out(b) - W.out(a)) / T.fps;
const S = createSynth(DUR);
const {track, tone, noise, kick, click, pop, bell, whoosh, boom, sparkle, writeWav, N, rnd} = S;

// ---------------- SFX ----------------
const sfx = track();
const pan = (i) => (i % 2 ? 0.35 : -0.35);

// intro
whoosh(sfx, 0.15, 1.2, 0.22, true);
boom(sfx, f2t(T.s0.hit), 0.5);
sparkle(sfx, f2t(T.s0.hit + 2), 0.14);
whoosh(sfx, f2t(T.s0.wordmark - 4), 0.6, 0.16, true);
bell(sfx, f2t(T.s0.wordmark + 8), mtof(88), 0.12);

// flight intro -> phone
whoosh(sfx, f2t(96), 1.05, 0.3, true);
tone(sfx, f2t(98), 1.0, 70, {f1: 200, gain: 0.16, decay: 0.6, attack: 0.3, harmonics: [1, 2]});
pop(sfx, f2t(T.s1.start + 8), 500, 0.2);

// phone search typing: recording local frames 18 + 2i, 53 characters
for (let i = 0; i < 53; i++) click(sfx, f2t(T.s1.rec + 18 + i * 2), 0.18 + 0.05 * Math.abs(rnd()), 0.1);
T.s1.chips.forEach((f, i) => {
  pop(sfx, f2t(f), 520 + i * 110, 0.2);
  bell(sfx, f2t(f) + 0.02, mtof(84 + i * 2), 0.1, pan(i), 0.9);
});

// dive into the screen -> flash cut
noise(sfx, f2t(254), span(254, 289), {gain: 0.28, lp0: 300, lp1: 9000, shape: 'rise'});
tone(sfx, f2t(256), 1.1, 110, {f1: 880, gain: 0.14, decay: 0.2, attack: 0.5, harmonics: [1, 2, 3]});
boom(sfx, f2t(289), 0.85);
sparkle(sfx, f2t(290), 0.16);

// corridor slalom: pop when a card appears, whoosh-by when the camera passes it, counter ticks
T.s2.cards.forEach((f, i) => {
  pop(sfx, f2t(f), 480 + (i % 5) * 90, 0.17);
  whoosh(sfx, f2t(f + 52), 0.38, 0.17, i % 2 === 0, i % 2 ? 0.7 : -0.7);
});
for (let i = 0; i < 24; i++) click(sfx, f2t(330 + i * 3), 0.12, 0.2);
bell(sfx, f2t(T.s2.gap), mtof(76), 0.2);
bell(sfx, f2t(T.s2.gap) + 0.1, mtof(83), 0.14);
whoosh(sfx, f2t(T.s2.gap - 20), 0.7, 0.14, true);

// profile form typing (recording local frames, 2 frames per character)
[[40, 15], [76, 23], [126, 15], [160, 17], [198, 20]].forEach(([from, n]) => {
  for (let i = 0; i < n; i++) click(sfx, f2t(T.s3.rec + from + i * 2), 0.16 + 0.05 * Math.abs(rnd()), -0.1);
});
T.s2.gap && [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((i) => pop(sfx, f2t(T.s2.gap + 4 + i * 5), 420 + i * 40, 0.1));

// card flies out and snaps into the roster wall
whoosh(sfx, f2t(T.s3.launch - 2), span(T.s3.launch - 2, T.s3.snap), 0.22, true);
sparkle(sfx, f2t(T.s3.launch + 4), 0.08);
boom(sfx, f2t(T.s3.snap), 0.8);
sparkle(sfx, f2t(T.s3.snap + 1), 0.18);
[79, 83, 86, 91].forEach((m, i) => bell(sfx, f2t(T.s3.snap) + i * 0.05, mtof(m), 0.16, pan(i), 1.8));
whoosh(sfx, f2t(T.s3.snap + 6), 0.7, 0.18, false);
kick(sfx, f2t(T.s3.stamp), 0.9);
noise(sfx, f2t(T.s3.stamp), 0.25, {gain: 0.22, lp0: 2800, lp1: 300, shape: 'fall'});
bell(sfx, f2t(T.s3.stamp), mtof(67), 0.2, 0, 2.2);

// flight to the map
whoosh(sfx, f2t(762), 1.0, 0.3, false);
whoosh(sfx, f2t(776), 0.9, 0.22, true);

// map: pings, towers and light flights
const penta = [84, 86, 88, 91, 93, 96];
T.s4.cities.forEach((c, i) => {
  bell(sfx, f2t(c.at), mtof(penta[i]), 0.2, pan(i));
  sparkle(sfx, f2t(c.at) + 0.02, 0.05);
  tone(sfx, f2t(c.at), 0.25, 140, {f1: 70, gain: 0.3, decay: 10});
  if (i > 0) whoosh(sfx, f2t(T.s4.cities[i - 1].at) + 0.03, span(T.s4.cities[i - 1].at, c.at) - 0.03, 0.12, true, pan(i));
});
bell(sfx, f2t(T.s4.steps.pruefung), mtof(79), 0.12);
bell(sfx, f2t(T.s4.steps.live), mtof(83), 0.14);
bell(sfx, f2t(T.s4.steps.anfrage), mtof(88), 0.14);

// flight to the stage, light lands, spotlight, applause + notification
whoosh(sfx, f2t(902), 1.0, 0.3, true);
noise(sfx, f2t(914), 0.8, {gain: 0.14, lp0: 300, lp1: 7000, shape: 'rise'});
boom(sfx, f2t(T.s5.landing), 0.7);
sparkle(sfx, f2t(T.s5.landing + 2), 0.14);
tone(sfx, f2t(T.s5.landing + 4), 1.4, 110, {f1: 220, gain: 0.2, decay: 1.2, attack: 0.5, harmonics: [1, 2, 3]});
for (let i = 0; i < 300; i++) {
  const t0 = f2t(T.s5.notify) + 0.1 + Math.abs(rnd()) * 1.8;
  const env = Math.sin(Math.PI * Math.min(1, (t0 - f2t(T.s5.notify)) / 2));
  noise(sfx, t0, 0.02, {gain: 0.12 * Math.max(0.1, env), lp0: 6000, hp: 1500, shape: 'fall', pan: rnd() * 0.8});
}
[91, 95, 100].forEach((m, i) => bell(sfx, f2t(T.s5.notify) + i * 0.1, mtof(m), 0.2, i - 1 > 0 ? 0.3 : -0.3, 1.2));

// flight to the claim, impact, lines
noise(sfx, f2t(1022), span(1022, 1046), {gain: 0.26, lp0: 300, lp1: 9000, shape: 'rise'});
boom(sfx, f2t(1046), 0.95);
T.s6.lines.forEach((f, i) => {
  if (i > 0) kick(sfx, f2t(f), 0.7);
  click(sfx, f2t(f), 0.3);
  whoosh(sfx, f2t(f) - 0.06, 0.28, 0.16, true);
});
T.s6.chips.forEach((f, i) => pop(sfx, f2t(f), 560 + i * 120, 0.22));
sparkle(sfx, f2t(T.s6.wordmark), 0.12);
pop(sfx, f2t(T.s6.button), 700, 0.25);
bell(sfx, f2t(T.s6.button) + 0.02, mtof(91), 0.18);
click(sfx, f2t(T.s6.url), 0.2);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, f2t(T.s6.chime) + i * 0.09, mtof(m), 0.2, pan(i), 2.4));

// ---------------- Music (120 bpm, C – G – Am – F) ----------------
const music = track();
const BAR = 2;
const chords = [
  {root: 36, pad: [48, 55, 64], arp: [60, 64, 67]},
  {root: 43, pad: [47, 55, 62], arp: [59, 62, 67]},
  {root: 45, pad: [45, 52, 60], arp: [57, 60, 64]},
  {root: 41, pad: [41, 53, 57], arp: [57, 60, 65]}
];
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const sec = (f) => f / T.fps;
// sections (seconds): kick/bass groove on in A and C, breakdown in B
const grooveA = (t) => t >= sec(290) && t < sec(920);
const breakdown = (t) => t >= sec(920) && t < sec(1040);
const grooveC = (t) => t >= sec(1046) && t < DUR - 1.2;

for (let bar = 0; bar < DUR / BAR; bar++) {
  const t0 = bar * BAR;
  const ch = chords[bar % 4];
  // pad
  ch.pad.forEach((m, vi) => {
    [-0.004, 0.004].forEach((dt) => {
      const f = mtof(m) * (1 + dt);
      const n = Math.floor((BAR + 0.4) * SR);
      let ph = 0;
      for (let k = 0; k < n; k++) {
        const t = k / SR;
        ph += (2 * Math.PI * f) / SR;
        const env = Math.min(1, t / 0.6) * Math.min(1, (BAR + 0.4 - t) / 0.8);
        const s = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph) + 0.12 * Math.sin(4 * ph);
        const g = 0.045 * env * ramp(t0 + t, 0, 2) * (1 - ramp(t0 + t, DUR - 2.5, DUR));
        S.add(music, Math.floor(t0 * SR) + k, s * g, vi === 1 ? 0.2 : vi === 2 ? -0.2 : 0);
      }
    });
  });
  // arp from the first flight on
  if (t0 >= 3.5 && t0 < DUR - 1) {
    [0, 1, 2, 1, 2, 1, 2, 1].forEach((pi, step) => {
      const t = t0 + step * 0.25;
      if (breakdown(t) && step % 2) return;
      const m = ch.arp[pi] + (step % 4 === 2 ? 12 : 0) + 12;
      tone(music, t, 0.45, mtof(m), {gain: 0.1, decay: 7, harmonics: [1, 2, 3], wave: 'saw', pan: step % 2 ? 0.3 : -0.3});
    });
  }
  for (let beat = 0; beat < 4; beat++) {
    const t = t0 + beat * 0.5;
    const gA = grooveA(t);
    const gC = grooveC(t);
    if (t >= 6 && t < sec(290) && beat % 2 === 0) kick(music, t, 0.25); // build-up pulse
    if (gA || gC) {
      kick(music, t, gC ? 0.55 : 0.42);
      tone(music, t, 0.5, mtof(ch.root), {gain: 0.2, decay: 4, attack: 0.01});
      noise(music, t + 0.25, 0.05, {gain: 0.07, lp0: 9000, hp: 6000, shape: 'fall', pan: 0.3});
    }
    if ((gA && t >= sec(530)) || gC) if (beat % 2 === 1) noise(music, t, 0.13, {gain: 0.13, lp0: 7000, hp: 1800, shape: 'fall'});
  }
}
// risers before each flight
[[sec(254), sec(289)], [sec(1022), sec(1046)], [sec(902), sec(936)]].forEach(([a, b]) => noise(music, a, b - a, {gain: 0.1, lp0: 400, lp1: 8000, shape: 'rise'}));
// final ring
[60, 64, 67, 72].forEach((m) => tone(music, DUR - 1.1, 0.9, mtof(m), {gain: 0.05, decay: 3, harmonics: [1, 2]}));

// ping-pong echo on the music (dotted eighth)
const d = Math.floor(0.375 * SR);
for (let i = d; i < N; i++) {
  music.L[i] += 0.28 * music.R[i - d];
  music.R[i] += 0.28 * music.L[i - d];
}

const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
const suffix = VO ? 'vo' : '';
writeWav(path.join(out, `music2${suffix}.wav`), music, 0.8);
writeWav(path.join(out, `sfx2${suffix}.wav`), sfx, 0.85);
