// Music + SFX for the speaker showreel (src/timing3.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSynth, mtof} from './synth.mjs';
import {renderMusic} from './music.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(here, '../src/timing3.json'), 'utf8'));
const DUR = T.total / T.fps;
const t = (f) => f / T.fps;
const S = createSynth(DUR);
const {track, tone, noise, kick, click, pop, bell, whoosh, boom, sparkle, writeWav} = S;
const pan = (i) => (i % 2 ? 0.35 : -0.35);
const sfx = track();

// intro
whoosh(sfx, 0.1, 1.0, 0.22, true);
boom(sfx, t(T.s0.hit), 0.5);
sparkle(sfx, t(T.s0.hit + 2), 0.14);
whoosh(sfx, t(T.s0.wordmark - 4), 0.5, 0.16, true);
bell(sfx, t(T.s0.wordmark + 8), mtof(88), 0.12);

// camera flights between the scenes
T.flights.forEach(([a, b], i) => {
  whoosh(sfx, t(a), t(b - a), 0.3, i % 2 === 0, i % 2 ? 0.4 : -0.4);
  tone(sfx, t(a), t(b - a), 70, {f1: 220, gain: 0.12, decay: 0.8, attack: 0.3, harmonics: [1, 2]});
});

// portrait + name
pop(sfx, t(T.s1.card + 8), 480, 0.2);
whoosh(sfx, t(T.s1.card - 4), 0.5, 0.18, true);
[T.s1.name, T.s1.name + 8].forEach((f, i) => {
  kick(sfx, t(f), 0.55);
  click(sfx, t(f), 0.28);
  bell(sfx, t(f) + 0.02, mtof(i ? 91 : 84), 0.1, pan(i), 1.2);
});
T.s1.chips.forEach((f, i) => pop(sfx, t(f), 520 + i * 100, 0.2));

// career facts
T.s2.cards.forEach((f, i) => {
  pop(sfx, t(f), 460 + i * 70, 0.17);
  kick(sfx, t(f + 8), 0.45);
  bell(sfx, t(f + 8), mtof(79 + i * 3), 0.16, pan(i), 1.4);
  whoosh(sfx, t(f + 40), 0.4, 0.16, i % 2 === 0, i % 2 ? 0.7 : -0.7);
});

// gallery pans
for (let k = 0; k < 4; k++) {
  const a = T.s3.first + k * T.s3.step + T.s3.turn[0];
  whoosh(sfx, t(a), t(T.s3.turn[1]) + 0.08, 0.3, k % 2 === 0, k % 2 ? 0.6 : -0.6);
}
for (let k = 0; k < 5; k++) {
  const a = T.s3.first + k * T.s3.step;
  pop(sfx, t(a - 20), 440 + k * 60, 0.12);
  bell(sfx, t(a + 2), mtof(84 + k * 2), 0.1, pan(k), 1.0);
}

// keynotes on the phone
pop(sfx, t(T.s4.start + 10), 500, 0.2);
T.s4.keynotes.forEach((f, i) => {
  pop(sfx, t(f), 520 + i * 70, 0.22);
  bell(sfx, t(f) + 0.02, mtof(86 + i * 2), 0.14, pan(i), 1.2);
  whoosh(sfx, t(f - 2), 0.22, 0.14, true, pan(i));
  whoosh(sfx, t(f + T.s4.keynoteLen - 8), 0.2, 0.1, false, pan(i + 1));
});

// quote: soft tick per word, bell on the last
const words = 20;
for (let i = 0; i < words; i++) click(sfx, t(T.s5.words + i * T.s5.wordStep), 0.14 + 0.04 * (i % 3), i % 2 ? 0.2 : -0.2);
bell(sfx, t(T.s5.words + words * T.s5.wordStep + 4), mtof(91), 0.18, 0, 2.0);

// map
whoosh(sfx, t(T.s6.city.at - 14), 0.5, 0.14, true);
bell(sfx, t(T.s6.city.at), mtof(88), 0.22);
sparkle(sfx, t(T.s6.city.at + 1), 0.08);
tone(sfx, t(T.s6.city.at), 0.3, 140, {f1: 70, gain: 0.3, decay: 10});
T.s6.chips.forEach((f, i) => pop(sfx, t(f), 560 + i * 110, 0.2));

// closing
boom(sfx, t(T.s7.lines[0]), 0.85);
T.s7.lines.forEach((f, i) => {
  if (i > 0) kick(sfx, t(f), 0.65);
  click(sfx, t(f), 0.3);
  whoosh(sfx, t(f) - 0.06, 0.28, 0.16, true);
});
T.s7.chips.forEach((f, i) => pop(sfx, t(f), 540 + i * 90, 0.2));
sparkle(sfx, t(T.s7.wordmark), 0.12);
pop(sfx, t(T.s7.button), 700, 0.25);
bell(sfx, t(T.s7.button) + 0.02, mtof(91), 0.18);
click(sfx, t(T.s7.url), 0.2);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, t(T.s7.chime) + i * 0.09, mtof(m), 0.2, pan(i), 2.4));

// music: groove under facts, gallery and keynotes, a breakdown for the quote, groove back for map and closing
const music = renderMusic(S, DUR, {
  groove: [[t(T.s2.start), t(T.s5.start)], [t(T.s6.start), t(T.s7.start - 14)], [t(T.s7.start + 14), DUR - 1.2]],
  breakdown: [[t(T.s5.start), t(T.s6.start)]],
  risers: T.flights.map(([a, b]) => [t(a), t(b)]),
  arpFrom: 3,
  hatsFrom: t(T.s3.start),
  pulse: [t(T.s1.start), t(T.s2.start)]
});

const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
writeWav(path.join(out, 'showreel-music.wav'), music, 0.8);
writeWav(path.join(out, 'showreel-sfx.wav'), sfx, 0.85);
