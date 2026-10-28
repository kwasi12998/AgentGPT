// Synthesizes music.wav and sfx.wav, synced to src/timing.json (no external assets).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(here, '../src/timing.json'), 'utf8'));
const SR = 44100;
const DUR = T.total / T.fps;
const N = Math.floor(DUR * SR);
const f2t = (f) => f / T.fps;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const track = () => ({L: new Float32Array(N), R: new Float32Array(N)});
const add = (tr, i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  tr.L[i] += v * (1 - Math.max(0, pan));
  tr.R[i] += v * (1 + Math.min(0, pan));
};

// ---------- primitives ----------
function tone(tr, t0, dur, f0, o = {}) {
  const {f1 = f0, gain = 0.3, attack = 0.005, decay = 6, harmonics = [1], pan = 0, wave = 'sine'} = o;
  const n = Math.floor(dur * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = f0 * Math.pow(f1 / f0, t / dur);
    ph += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t) * Math.min(1, (dur - t) / 0.01);
    let s = 0;
    harmonics.forEach((h, hi) => {
      const amp = 1 / Math.pow(hi + 1, wave === 'saw' ? 1 : 1.6);
      s += Math.sin(ph * h) * amp;
    });
    add(tr, Math.floor(t0 * SR) + k, s * env * gain, pan);
  }
}

function noise(tr, t0, dur, o = {}) {
  const {gain = 0.2, lp0 = 2000, lp1 = lp0, hp = 0, shape = 'sin', pan = 0, attack} = o;
  const n = Math.floor(dur * SR);
  let y1 = 0, y2 = 0, hpState = 0;
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const fc = lp0 * Math.pow(lp1 / lp0, t);
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    const x = rnd();
    y1 += a * (x - y1);
    y2 += a * (y1 - y2);
    let s = y2;
    if (hp) {
      const b = 1 - Math.exp((-2 * Math.PI * hp) / SR);
      hpState += b * (s - hpState);
      s -= hpState;
    }
    let env;
    if (shape === 'sin') env = Math.sin(Math.PI * t);
    else if (shape === 'rise') env = Math.pow(t, 2.2);
    else if (shape === 'fall') env = Math.pow(1 - t, 2.5);
    else env = Math.min(1, t / (attack ?? 0.02)) * Math.pow(1 - t, 2);
    add(tr, Math.floor(t0 * SR) + k, s * env * gain * 4, pan);
  }
}

const kick = (tr, t0, g = 0.7) => tone(tr, t0, 0.35, 130, {f1: 42, gain: g, decay: 9, attack: 0.001});
const click = (tr, t0, g = 0.25, pan = 0) => {
  noise(tr, t0, 0.012, {gain: g, lp0: 9000, hp: 2500, shape: 'fall', pan});
  tone(tr, t0, 0.02, 1900, {gain: g * 0.6, decay: 120, attack: 0.0005, pan});
};
const pop = (tr, t0, f = 600, g = 0.22) => tone(tr, t0, 0.09, f, {f1: f * 1.6, gain: g, decay: 30, attack: 0.002});
const bell = (tr, t0, f, g = 0.2, pan = 0, dur = 1.6) =>
  tone(tr, t0, dur, f, {gain: g, decay: 3.2, harmonics: [1, 2.76, 5.4], pan, attack: 0.002});
const whoosh = (tr, t0, dur, g = 0.2, up = true, pan = 0) =>
  noise(tr, t0, dur, {gain: g, lp0: up ? 300 : 5000, lp1: up ? 6000 : 300, hp: 120, shape: 'sin', pan});
const boom = (tr, t0, g = 0.8) => {
  tone(tr, t0, 1.6, 90, {f1: 34, gain: g, decay: 2.6, attack: 0.002});
  noise(tr, t0, 0.5, {gain: g * 0.35, lp0: 3500, lp1: 200, shape: 'fall'});
};
const sparkle = (tr, t0, g = 0.12) => {
  [1568, 2093, 2637, 3136].forEach((f, i) => bell(tr, t0 + i * 0.045, f, g, i % 2 ? 0.4 : -0.4, 0.8));
};

// ---------- SFX ----------
const sfx = track();
// intro
whoosh(sfx, 0.2, 1.0, 0.22, true);
boom(sfx, f2t(24), 0.5);
sparkle(sfx, f2t(26), 0.14);
whoosh(sfx, f2t(46), 0.5, 0.16, true);
bell(sfx, f2t(56), mtof(88), 0.12);

// phone in
whoosh(sfx, f2t(T.phone.start - 4), 0.7, 0.2, true);
pop(sfx, f2t(T.phone.start + 14), 500, 0.2);

// search typing
const q = T.search.query;
for (let i = 0; i < q.length; i++) {
  click(sfx, f2t(T.search.typeStart + i * T.search.charFrames), 0.2 + 0.05 * Math.abs(rnd()), 0.1);
}
pop(sfx, f2t(T.search.suggest), 650);
[0, 5, 9].forEach((d, i) => pop(sfx, f2t(T.search.results + d), 520 + i * 90, 0.18));
bell(sfx, f2t(T.search.placeholder), mtof(88), 0.2);
bell(sfx, f2t(T.search.placeholder) + 0.08, mtof(95), 0.14);
tone(sfx, f2t(T.search.placeholder), 0.6, 120, {f1: 70, gain: 0.35, decay: 5});

// form
whoosh(sfx, f2t(T.form.start - 2), 0.4, 0.18, true);
for (const fld of T.form.fields) {
  for (let i = 0; i < fld.text.length; i++) {
    click(sfx, f2t(fld.start + i * T.form.charFrames), 0.18 + 0.05 * Math.abs(rnd()), -0.1);
  }
}
tone(sfx, f2t(T.form.press), 0.1, 160, {f1: 90, gain: 0.45, decay: 25});
click(sfx, f2t(T.form.press), 0.3);
tone(sfx, f2t(T.form.press + 2), f2t(T.form.progressEnd - T.form.press), 380, {f1: 1100, gain: 0.12, decay: 0.4, harmonics: [1, 2], attack: 0.02});
bell(sfx, f2t(T.form.progressEnd + 1), mtof(84), 0.22);
bell(sfx, f2t(T.form.progressEnd + 1) + 0.09, mtof(91), 0.2);
kick(sfx, f2t(T.form.stamp), 0.8);
noise(sfx, f2t(T.form.stamp), 0.2, {gain: 0.18, lp0: 2500, lp1: 400, shape: 'fall'});
sparkle(sfx, f2t(T.form.stamp + 4), 0.14);
whoosh(sfx, f2t(T.phone.end - 16), 0.5, 0.18, false);

// map
whoosh(sfx, f2t(T.map.start - 3), 1.2, 0.18, true);
const penta = [84, 86, 88, 91, 93, 96];
T.map.cities.forEach((c, i) => {
  bell(sfx, f2t(c.at), mtof(penta[i]), 0.2, (i % 2 ? 0.35 : -0.35));
  sparkle(sfx, f2t(c.at) + 0.02, 0.05);
  if (i > 0) whoosh(sfx, f2t(T.map.cities[i - 1].at) + 0.05, f2t(c.at - T.map.cities[i - 1].at) - 0.05, 0.1, true, i % 2 ? 0.3 : -0.3);
});
bell(sfx, f2t(T.map.steps.live), mtof(79), 0.14);
bell(sfx, f2t(T.map.steps.anfrage), mtof(86), 0.14);

// stage
whoosh(sfx, f2t(T.stage.start - 4), 0.7, 0.2, false);
tone(sfx, f2t(T.stage.start + 12), 1.3, 110, {f1: 220, gain: 0.18, decay: 1.2, attack: 0.5, harmonics: [1, 2, 3]});
boom(sfx, f2t(T.stage.landing), 0.6);
sparkle(sfx, f2t(T.stage.landing + 2), 0.12);
// applause
for (let i = 0; i < 260; i++) {
  const t = f2t(T.stage.notify) + 0.1 + Math.abs(rnd()) * 1.6;
  const env = Math.sin(Math.PI * Math.min(1, (t - f2t(T.stage.notify)) / 1.8));
  noise(sfx, t, 0.02, {gain: 0.12 * Math.max(0.1, env), lp0: 6000, hp: 1500, shape: 'fall', pan: rnd() * 0.8});
}
[91, 95, 100].forEach((m, i) => bell(sfx, f2t(T.stage.notify) + i * 0.1, mtof(m), 0.2, i - 1 > 0 ? 0.3 : -0.3, 1.2));

// claim
noise(sfx, f2t(T.claim.start) - 0.8, 0.8, {gain: 0.2, lp0: 300, lp1: 7000, shape: 'rise'});
boom(sfx, f2t(T.claim.start), 0.9);
T.claim.lines.forEach((f, i) => {
  if (i > 0) kick(sfx, f2t(f), 0.6);
  click(sfx, f2t(f), 0.3);
  whoosh(sfx, f2t(f) - 0.05, 0.25, 0.14, true);
});
T.claim.chips.forEach((f, i) => pop(sfx, f2t(f), 560 + i * 120, 0.22));
sparkle(sfx, f2t(T.claim.wordmark), 0.12);
pop(sfx, f2t(T.claim.button), 700, 0.25);
bell(sfx, f2t(T.claim.button) + 0.02, mtof(91), 0.18);
click(sfx, f2t(T.claim.url), 0.2);
[84, 88, 91, 96].forEach((m, i) => bell(sfx, f2t(T.claim.chime) + i * 0.09, mtof(m), 0.2, i % 2 ? 0.3 : -0.3, 2.2));

// ---------- Music (120 bpm, C – G – Am – F) ----------
const music = track();
const BAR = 2;
const chords = [
  {root: 36, pad: [48, 55, 64], arp: [60, 64, 67]},
  {root: 43, pad: [47, 55, 62], arp: [59, 62, 67]},
  {root: 45, pad: [45, 52, 60], arp: [57, 60, 64]},
  {root: 41, pad: [41, 53, 57], arp: [57, 60, 65]}
];
const fadeIn = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
for (let bar = 0; bar < 15; bar++) {
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
        const g = 0.045 * env * fadeIn(t0 + t, 0, 2) * (1 - fadeIn(t0 + t, 27.5, 30));
        add(music, Math.floor(t0 * SR) + k, s * g, vi === 1 ? 0.2 : vi === 2 ? -0.2 : 0);
      }
    });
  });
  // arp plucks
  if (t0 >= 4 && t0 < 29) {
    const pattern = [0, 1, 2, 1, 2, 1, 2, 1];
    pattern.forEach((pi, step) => {
      const t = t0 + step * 0.25;
      if (t >= 21 && t < 25 && step % 2) return;
      const m = ch.arp[pi] + (step % 4 === 2 ? 12 : 0) + 12;
      tone(music, t, 0.45, mtof(m), {gain: 0.1, decay: 7, harmonics: [1, 2, 3], wave: 'saw', pan: step % 2 ? 0.3 : -0.3});
    });
  }
  // beat
  for (let beat = 0; beat < 4; beat++) {
    const t = t0 + beat * 0.5;
    const grooveA = t >= 8 && t < 21;
    const grooveB = t >= 25 && t < 29.5;
    if (grooveA || grooveB) kick(music, t, grooveB ? 0.55 : 0.4);
    if (grooveA || grooveB) {
      tone(music, t, 0.5, mtof(ch.root), {gain: 0.2, decay: 4, attack: 0.01});
      noise(music, t + 0.25, 0.05, {gain: 0.07, lp0: 9000, hp: 6000, shape: 'fall', pan: 0.3});
    }
    if (t >= 14 && t < 21 && beat % 2 === 1) noise(music, t, 0.12, {gain: 0.11, lp0: 7000, hp: 1800, shape: 'fall'});
    if (grooveB && beat % 2 === 1) noise(music, t, 0.14, {gain: 0.14, lp0: 7000, hp: 1800, shape: 'fall'});
  }
}
// riser into the claim
noise(music, 21, 4, {gain: 0.12, lp0: 400, lp1: 8000, shape: 'rise'});
// final ring
[60, 64, 67, 72].forEach((m, i) => tone(music, 29.2, 0.8, mtof(m), {gain: 0.05, decay: 3, harmonics: [1, 2]}));

// ping-pong echo on music (dotted eighth)
const d = Math.floor(0.375 * SR);
for (let i = d; i < N; i++) {
  music.L[i] += 0.28 * music.R[i - d];
  music.R[i] += 0.28 * music.L[i - d];
}

// ---------- write ----------
function writeWav(file, tr, targetPeak) {
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  const k = targetPeak / (peak || 1);
  const fade = Math.floor(0.05 * SR);
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    const edge = Math.min(1, i / fade, (N - i) / fade);
    const l = Math.max(-1, Math.min(1, Math.tanh(tr.L[i] * k * 1.2) * edge));
    const r = Math.max(-1, Math.min(1, Math.tanh(tr.R[i] * k * 1.2) * edge));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
  console.log('wrote', file, (buf.length / 1e6).toFixed(1) + ' MB');
}
const out = path.join(here, '../public/audio');
fs.mkdirSync(out, {recursive: true});
writeWav(path.join(out, 'music.wav'), music, 0.8);
writeWav(path.join(out, 'sfx.wav'), sfx, 0.85);
