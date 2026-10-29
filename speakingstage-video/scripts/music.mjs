// Shared music bed (120 bpm, C - G - Am - F): pad, arpeggio, kick/bass/hats, risers, final ring, ping-pong echo.
import {mtof, SR} from './synth.mjs';

const chords = [
  {root: 36, pad: [48, 55, 64], arp: [60, 64, 67]},
  {root: 43, pad: [47, 55, 62], arp: [59, 62, 67]},
  {root: 45, pad: [45, 52, 60], arp: [57, 60, 64]},
  {root: 41, pad: [41, 53, 57], arp: [57, 60, 65]}
];
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const inAny = (ranges, t) => ranges.some(([a, b]) => t >= a && t < b);

/** ranges are [startSec, endSec] pairs; `hatsFrom` is the time from which off-beat hats play inside groove ranges. */
export const renderMusic = (S, DUR, {groove = [], breakdown = [], risers = [], arpFrom = 3.5, hatsFrom = 0, pulse = null}) => {
  const music = S.track();
  const BAR = 2;
  for (let bar = 0; bar < DUR / BAR; bar++) {
    const t0 = bar * BAR;
    const ch = chords[bar % 4];
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
          S.add(music, Math.floor(t0 * SR) + k, s * 0.045 * env * ramp(t0 + t, 0, 2) * (1 - ramp(t0 + t, DUR - 2.5, DUR)), vi === 1 ? 0.2 : vi === 2 ? -0.2 : 0);
        }
      });
    });
    if (t0 >= arpFrom && t0 < DUR - 1) {
      [0, 1, 2, 1, 2, 1, 2, 1].forEach((pi, step) => {
        const t = t0 + step * 0.25;
        if (inAny(breakdown, t) && step % 2) return;
        S.tone(music, t, 0.45, mtof(ch.arp[pi] + (step % 4 === 2 ? 12 : 0) + 12), {gain: 0.1, decay: 7, harmonics: [1, 2, 3], wave: 'saw', pan: step % 2 ? 0.3 : -0.3});
      });
    }
    for (let beat = 0; beat < 4; beat++) {
      const t = t0 + beat * 0.5;
      const g = inAny(groove, t);
      if (pulse && t >= pulse[0] && t < pulse[1] && beat % 2 === 0) S.kick(music, t, 0.25);
      if (g) {
        S.kick(music, t, 0.5);
        S.tone(music, t, 0.5, mtof(ch.root), {gain: 0.2, decay: 4, attack: 0.01});
        S.noise(music, t + 0.25, 0.05, {gain: 0.07, lp0: 9000, hp: 6000, shape: 'fall', pan: 0.3});
        if (beat % 2 === 1 && t >= hatsFrom) S.noise(music, t, 0.13, {gain: 0.13, lp0: 7000, hp: 1800, shape: 'fall'});
      }
    }
  }
  risers.forEach(([a, b]) => S.noise(music, a, b - a, {gain: 0.1, lp0: 400, lp1: 8000, shape: 'rise'}));
  [60, 64, 67, 72].forEach((m) => S.tone(music, DUR - 1.1, 0.9, mtof(m), {gain: 0.05, decay: 3, harmonics: [1, 2]}));
  const d = Math.floor(0.375 * SR);
  for (let i = d; i < S.N; i++) {
    music.L[i] += 0.28 * music.R[i - d];
    music.R[i] += 0.28 * music.L[i - d];
  }
  return music;
};
