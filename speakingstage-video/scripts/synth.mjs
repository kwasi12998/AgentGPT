// Tiny additive synth used by make-audio2.mjs. Everything is generated procedurally (no samples, no licences).
import fs from 'node:fs';

export const SR = 44100;
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export const createSynth = (dur) => {
  const N = Math.floor(dur * SR);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const track = () => ({L: new Float32Array(N), R: new Float32Array(N)});
  const add = (tr, i, v, pan = 0) => {
    if (i < 0 || i >= N) return;
    tr.L[i] += v * (1 - Math.max(0, pan));
    tr.R[i] += v * (1 + Math.min(0, pan));
  };

  const tone = (tr, t0, d, f0, o = {}) => {
    const {f1 = f0, gain = 0.3, attack = 0.005, decay = 6, harmonics = [1], pan = 0, wave = 'sine'} = o;
    const n = Math.floor(d * SR);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const f = f0 * Math.pow(f1 / f0, t / d);
      ph += (2 * Math.PI * f) / SR;
      const env = Math.min(1, t / attack) * Math.exp(-decay * t) * Math.min(1, (d - t) / 0.01);
      let s = 0;
      harmonics.forEach((h, hi) => {
        s += Math.sin(ph * h) / Math.pow(hi + 1, wave === 'saw' ? 1 : 1.6);
      });
      add(tr, Math.floor(t0 * SR) + k, s * env * gain, pan);
    }
  };

  const noise = (tr, t0, d, o = {}) => {
    const {gain = 0.2, lp0 = 2000, lp1 = lp0, hp = 0, shape = 'sin', pan = 0, attack} = o;
    const n = Math.floor(d * SR);
    let y1 = 0, y2 = 0, hs = 0;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const fc = lp0 * Math.pow(lp1 / lp0, t);
      const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
      y1 += a * (rnd() - y1);
      y2 += a * (y1 - y2);
      let s = y2;
      if (hp) {
        hs += (1 - Math.exp((-2 * Math.PI * hp) / SR)) * (s - hs);
        s -= hs;
      }
      const env = shape === 'sin' ? Math.sin(Math.PI * t) : shape === 'rise' ? Math.pow(t, 2.2) : shape === 'fall' ? Math.pow(1 - t, 2.5) : Math.min(1, t / (attack ?? 0.02)) * Math.pow(1 - t, 2);
      add(tr, Math.floor(t0 * SR) + k, s * env * gain * 4, pan);
    }
  };

  const kick = (tr, t0, g = 0.7) => tone(tr, t0, 0.35, 130, {f1: 42, gain: g, decay: 9, attack: 0.001});
  const click = (tr, t0, g = 0.25, pan = 0) => {
    noise(tr, t0, 0.012, {gain: g, lp0: 9000, hp: 2500, shape: 'fall', pan});
    tone(tr, t0, 0.02, 1900, {gain: g * 0.6, decay: 120, attack: 0.0005, pan});
  };
  const pop = (tr, t0, f = 600, g = 0.22) => tone(tr, t0, 0.09, f, {f1: f * 1.6, gain: g, decay: 30, attack: 0.002});
  const bell = (tr, t0, f, g = 0.2, pan = 0, d = 1.6) => tone(tr, t0, d, f, {gain: g, decay: 3.2, harmonics: [1, 2.76, 5.4], pan, attack: 0.002});
  const whoosh = (tr, t0, d, g = 0.2, up = true, pan = 0) => noise(tr, t0, d, {gain: g, lp0: up ? 300 : 5000, lp1: up ? 6000 : 300, hp: 120, shape: 'sin', pan});
  const boom = (tr, t0, g = 0.8) => {
    tone(tr, t0, 1.6, 90, {f1: 34, gain: g, decay: 2.6, attack: 0.002});
    noise(tr, t0, 0.5, {gain: g * 0.35, lp0: 3500, lp1: 200, shape: 'fall'});
  };
  const sparkle = (tr, t0, g = 0.12) => [1568, 2093, 2637, 3136].forEach((f, i) => bell(tr, t0 + i * 0.045, f, g, i % 2 ? 0.4 : -0.4, 0.8));

  const writeWav = (file, tr, targetPeak) => {
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
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Math.tanh(tr.L[i] * k * 1.2) * edge)) * 32767), 44 + i * 4);
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Math.tanh(tr.R[i] * k * 1.2) * edge)) * 32767), 46 + i * 4);
    }
    fs.writeFileSync(file, buf);
    console.log('wrote', file, (buf.length / 1e6).toFixed(1) + ' MB');
  };

  return {N, rnd, track, add, tone, noise, kick, click, pop, bell, whoosh, boom, sparkle, writeWav};
};
