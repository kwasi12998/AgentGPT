// Music + SFX for the SpeakingStage ad, synced to the audio-first timeline (src/timeline.ts + src/vo-ad.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSynth, mtof} from './synth.mjs';
import {renderMusic} from './music.mjs';
import {buildTimeline} from '../src/timeline.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(here, p), 'utf8'));
const TL = buildTimeline(read('../src/voscript-ad.json').scenes, read('../src/vo-ad.json'));
const B = TL.byId;
const FPS = 30;
const DUR = TL.total / FPS;
const t = (f) => f / FPS;
const S = createSynth(DUR);
const {track, tone, noise, kick, click, pop, bell, whoosh, boom, sparkle, writeWav} = S;
const sfx = track();
const pan = (i) => (i % 2 ? 0.35 : -0.35);
const arrive = (id) => B[id].start + 18; // camera reaches the station panel
const loc = (id, tt) => arrive(id) - 24 + tt; // frame of a panel-local time

const wordTimes = (id, words) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const f = B[id].v0 + (acc / total) * B[id].vFrames * 0.94;
    acc += w.length + 1;
    return f;
  });
};

// ---- dark: hook and pain points
noise(sfx, 0, 2.6, {gain: 0.1, lp0: 300, lp1: 5000, shape: 'rise'});
tone(sfx, 0, 3.0, 55, {gain: 0.18, decay: 0.7, attack: 1.2, harmonics: [1, 2]});
wordTimes('d1', ['Du', 'suchst', 'einen', 'Keynote-', 'Speaker?']).forEach((f, i) => click(sfx, t(f), 0.14 + 0.02 * i, pan(i) * 0.5));
['d2a', 'd2b', 'd2c'].forEach((id, i) => {
  const f = B[id].v0 - 2;
  whoosh(sfx, t(f) - 0.2, 0.35, 0.2, true, pan(i));
  tone(sfx, t(f), 0.7, 90 - i * 8, {f1: 50, gain: 0.34, decay: 4});
  pop(sfx, t(f) + 0.02, 380 + i * 60, 0.16);
});
[0, 1, 2].forEach((i) => {
  const f = B.d3.v0 + 4 + i * 10;
  whoosh(sfx, t(f) - 0.1, 0.3, 0.16, true, pan(i));
  pop(sfx, t(f) + 0.05, 330 + i * 40, 0.14);
});
tone(sfx, t(B.d3.v0 + 26), 0.9, 70, {f1: 46, gain: 0.3, decay: 3});

// ---- turn: light wipe
const wipe = B.d4.start - 4;
noise(sfx, t(wipe), 0.85, {gain: 0.2, lp0: 500, lp1: 9000, shape: 'rise'});
boom(sfx, t(wipe + 20), 0.6);
sparkle(sfx, t(wipe + 22), 0.12);
[72, 76, 79, 84].forEach((m, i) => bell(sfx, t(wipe + 24) + i * 0.1, mtof(m), 0.13, pan(i), 2.4));
pop(sfx, t(B.d4.v0 + 8), 560, 0.16);

// ---- d5: three panels rise
whoosh(sfx, t(B.d5.start), 0.7, 0.24, true);
[0, 1, 2].forEach((i) => pop(sfx, t(B.d5.start + 6 + i * 5 + 6), 440 + i * 70, 0.16));

// ---- steps: camera travel between panels
['d6', 'd7', 'd8', 'd9', 'd10'].forEach((id, i) => {
  const travel = i === 0 ? 38 : 30;
  whoosh(sfx, t(arrive(id) - travel), t(travel) + 0.1, 0.3, i % 2 === 0, i === 0 ? 0 : 0.5);
  tone(sfx, t(arrive(id) - 6), 0.5, 120, {f1: 60, gain: 0.2, decay: 4});
});

// d6: typing, click, AI result
for (let k = 0; k < 33; k++) click(sfx, t(loc('d6', 40 + k * 2)), 0.07 + 0.02 * (k % 3), pan(k) * 0.4);
click(sfx, t(loc('d6', 132)), 0.3);
pop(sfx, t(loc('d6', 133)), 640, 0.22);
sparkle(sfx, t(loc('d6', 140)), 0.12);
whoosh(sfx, t(loc('d6', 138)), 0.35, 0.18, false);
[0, 1, 2].forEach((i) => {
  pop(sfx, t(loc('d6', 150 + i * 6)), 520 + i * 80, 0.16);
  bell(sfx, t(loc('d6', 150 + i * 6)) + 0.02, mtof(84 + i * 3), 0.1, pan(i), 1.4);
});

// d7: tabs follow the voice
wordTimes('d7', ['Profile,', 'Videos', 'und', 'Themen.']).forEach((f, i) => {
  if (i === 2) return;
  pop(sfx, t(f), 520 + i * 90, 0.18);
  bell(sfx, t(f) + 0.02, mtof(88 + i * 2), 0.1, pan(i), 1.4);
});

// d8: briefing form, click, sent
for (let i = 0; i < 4; i++) pop(sfx, t(loc('d8', 8 + i * 5 + 4)), 460 + i * 40, 0.12);
for (let k = 0; k < 24; k++) click(sfx, t(loc('d8', 18 + k * 2)), 0.06 + 0.02 * (k % 3), pan(k) * 0.4);
click(sfx, t(loc('d8', 74)), 0.32);
pop(sfx, t(loc('d8', 75)), 600, 0.24);
bell(sfx, t(loc('d8', 82)), mtof(91), 0.2, 0, 2.0);
sparkle(sfx, t(loc('d8', 83)), 0.1);

// d9: three checks on Fit, Termin, Auswahl
const w9 = wordTimes('d9', ['Wir', 'prüfen', 'Fit', 'und', 'Termin.', 'Du', 'bekommst', 'eine', 'kuratierte', 'Auswahl.']);
[w9[2], w9[4], w9[9]].forEach((f, i) => {
  pop(sfx, t(f), 560 + i * 100, 0.2);
  bell(sfx, t(f) + 0.02, mtof(84 + i * 4), 0.14, pan(i), 1.6);
});
[0, 1, 2].forEach((i) => pop(sfx, t(w9[9] + 4 + i * 4), 480 + i * 60, 0.12));

// d10: choose and confirm
[0, 1, 2].forEach((i) => pop(sfx, t(loc('d10', 8 + i * 5 + 4)), 450 + i * 60, 0.12));
click(sfx, t(loc('d10', 54)), 0.28);
bell(sfx, t(loc('d10', 56)), mtof(88), 0.2, 0, 2.2);
bell(sfx, t(loc('d10', 56)) + 0.07, mtof(95), 0.14, 0.3, 2.2);

// d11: call to action
const a = B.d11.v0;
boom(sfx, t(a), 0.6);
whoosh(sfx, t(a) - 0.1, 0.4, 0.2, true);
[a + 24].forEach((f) => pop(sfx, t(f), 640, 0.2));
pop(sfx, t(a + 56) + 0.03, 700, 0.24);
sparkle(sfx, t(a + 58), 0.12);
click(sfx, t(a + 70), 0.2);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, t(a + B.d11.vFrames + 4) + i * 0.09, mtof(m), 0.18, pan(i), 2.8));

// ---- music: warm pad, light pulse once the light world starts
const music = renderMusic(S, DUR, {
  breakdown: [[0, DUR]],
  arpFrom: 1e9,
  risers: [],
  pulse: [t(B.d4.start + 14), DUR - 3]
});

const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
writeWav(path.join(out, 'ad-music.wav'), music, 0.7);
writeWav(path.join(out, 'ad-sfx.wav'), sfx, 0.85);
