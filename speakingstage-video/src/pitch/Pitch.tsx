import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {C, FONT, prog} from '../theme';
import {LayoutCtx} from '../layout';
import {SpeedLines} from '../overlays';
import {CameraRig, ease, Pose, V3} from '../three/camera';
import {Particles} from '../three/bits';
import {B, TL} from '../pitch-timeline';
import {ChrisWorld, CrowdWorld, CtaWorld, FlipWorld, PhotosWorld, SlidesWorld, ToolsWorld, Z, u} from './worlds';

const SQUARE = {wide: false, w: 1080, h: 1080};
const between = (f: number, a: number, b: number) => f >= a && f <= b;
const out3 = Easing.out(Easing.cubic);

// ---------------------------------------------------------------- camera (smooth, no shake)
type Seg = {id: string; a: Pose; z: Pose};
const P = (pos: V3, target: V3, fov = 34): Pose => ({pos, target, roll: 0, fov});
const SEGS: Seg[] = [
  {id: 'b1', a: P([0, 0, 12], [0, 0, 0]), z: P([0, 0, 7], [0, 0, 0])},
  {id: 'b2', a: P([0, 0, 7], [0, 0, 0]), z: P([0.3, 0.1, 3.5], [0, 0, 0])},
  {id: 'b3', a: P([0, 4.8, Z.b3 + 8.2], [0, 0.2, Z.b3 - 2.2]), z: P([0, 3.5, Z.b3 + 7.0], [0, 0.2, Z.b3 - 2.2])},
  {id: 'b4', a: P([0, 0.3, Z.b4 + 10.5], [0, 0, Z.b4]), z: P([0, 0.2, Z.b4 + 9.2], [0, 0, Z.b4])},
  {id: 'b5', a: P([0, 0.2, Z.b5 + 10.5], [0, 0, Z.b5]), z: P([0, 0.1, Z.b5 + 9.2], [0, 0, Z.b5])},
  {id: 'b6', a: P([-0.6, 0.3, Z.b6 + 10.2], [0.1, 0, Z.b6]), z: P([0.5, 0.2, Z.b6 + 9.4], [0.1, 0, Z.b6])},
  {id: 'b7', a: P([0, 0.2, Z.flip + 11], [0, 0, Z.flip]), z: P([0, 0.1, Z.flip + 10], [0, 0, Z.flip])},
  {id: 'b8', a: P([0, 0.1, Z.flip + 10], [0, 0, Z.flip]), z: P([0, 0, Z.flip + 9.4], [0, 0, Z.flip])},
  {id: 'b9', a: P([0, 0, Z.flip + 9.4], [0, 0, Z.flip]), z: P([0, 0, Z.flip + 8.9], [0, 0, Z.flip])},
  {id: 'b10', a: P([0, 0, Z.b10 + 11.5], [0, 0, Z.b10]), z: P([0, 0.1, Z.b10 + 10], [0, 0, Z.b10])},
  {id: 'b11', a: P([0.4, 0.15, Z.b11 + 10.5], [0, 0.1, Z.b11]), z: P([0, 0.15, Z.b11 + 9.5], [0, 0.1, Z.b11])}
];

const mix = (p: Pose, q: Pose, t: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l3 = (x: V3, y: V3): V3 => [l(x[0], y[0]), l(x[1], y[1]), l(x[2], y[2])];
  return {pos: l3(p.pos, q.pos), target: l3(p.target, q.target), roll: l(p.roll, q.roll), fov: l(p.fov, q.fov)};
};

export const cameraAt = (f: number): Pose => {
  const i = Math.max(0, SEGS.findIndex((s) => f < B[s.id].end));
  const idx = i === -1 ? SEGS.length - 1 : i;
  const s = SEGS[idx];
  const b = B[s.id];
  if (f < b.v0 && idx > 0) return mix(SEGS[idx - 1].z, s.a, ease.inOutQuint(Math.max(0, (f - b.start) / (b.v0 - b.start))));
  return mix(s.a, s.z, ease.inOutSine(Math.min(1, Math.max(0, (f - b.v0) / (b.end - b.v0)))));
};

const speedOf = (f: number) => {
  const a = cameraAt(f).pos;
  const c = cameraAt(f - 1).pos;
  return Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
};
const BIG_FLIGHTS = ['b3', 'b4', 'b5', 'b6', 'b7', 'b10', 'b11'];
const inFlight = (f: number) => BIG_FLIGHTS.some((id) => between(f, B[id].start, B[id].v0));

// ---------------------------------------------------------------- hook typography (2D, crisp)
const HOOK: {t: string; kind?: 'big' | 'half'; line: number}[] = [
  ...['Als', 'Frau', 'musst', 'du'].map((t) => ({t, line: 0})),
  {t: 'DOPPELT', kind: 'big', line: 1},
  ...['so', 'gut', 'sein,'].map((t) => ({t, line: 2})),
  ...['damit', 'ein', 'Mann', 'anerkennt,'].map((t) => ({t, line: 3})),
  ...['dass', 'du'].map((t) => ({t, line: 4})),
  {t: 'HALB', kind: 'half', line: 4},
  ...['so', 'gut', 'bist', 'wie', 'er.'].map((t) => ({t, line: 4}))
];
const HOOK_SIZE = [84, 218, 108, 64, 62];
const wordTimes = (beat: string, words: string[]) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const t = B[beat].v0 + (acc / total) * B[beat].vFrames * 0.94;
    acc += w.length + 1;
    return t;
  });
};
const HOOK_AT = wordTimes('b1', HOOK.map((w) => w.t));
export const HOOK_TIMES = HOOK_AT;
const BIG_I = HOOK.findIndex((w) => w.kind === 'big');
const HALF_I = HOOK.findIndex((w) => w.kind === 'half');

const extrude = (n: number, color: string) => Array.from({length: n}, (_, i) => `0 ${i + 1}px 0 ${color}`).join(', ');

const Hook: React.FC<{f: number}> = ({f}) => {
  const b1 = B.b1;
  const out = prog(f, b1.end - 12, 10);
  if (f > b1.end) return null;
  const slam = prog(f, HOOK_AT[BIG_I], 9, out3);
  const since = f - HOOK_AT[BIG_I];
  const shakeAmp = since >= 0 && since < 14 ? (1 - since / 14) * 16 : 0;
  const sx = Math.sin(since * 2.7) * shakeAmp;
  const sy = Math.cos(since * 3.3) * shakeAmp;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, opacity: 1 - out, transform: `translate(${sx}px, ${sy}px)`}}>
      {HOOK_SIZE.map((size, line) => (
        <div key={line} style={{display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline', justifyContent: 'center', gap: line === 1 ? 0 : 16, lineHeight: line === 1 ? 0.95 : 1.12}}>
          {HOOK.map((w, i) => {
            if (w.line !== line) return null;
            const p = prog(f, HOOK_AT[i], w.kind === 'big' ? 9 : 10, out3);
            const color = w.kind === 'big' ? C.copper : w.kind === 'half' ? C.copper : line >= 3 ? '#7a828f' : C.ink;
            const scale = w.kind === 'big' ? 2.7 - 1.7 * slam : w.kind === 'half' ? 2.0 - 1.0 * p : 1;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontSize: w.kind === 'half' ? 36 : size,
                  fontWeight: 800,
                  letterSpacing: w.kind === 'big' ? -4 : -1.5,
                  color,
                  opacity: w.kind === 'big' ? Math.min(1, slam * 3) : p,
                  transform: `translateY(${(1 - p) * 26}px) scale(${scale})`,
                  textShadow: w.kind === 'big' ? `${extrude(14, C.copperDark)}, 0 26px 40px rgba(126,72,36,0.35)` : undefined
                }}
              >
                {w.t}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const HOOK2 = ['Viele', 'Frauen', 'kennen', 'diesen', 'Satz.'];
const HOOK2_AT = wordTimes('b2', HOOK2);
const Hook2: React.FC<{f: number}> = ({f}) => {
  const b = B.b2;
  if (!between(f, b.start, b.end)) return null;
  const inn = prog(f, b.start, 12);
  const out = prog(f, b.end - 8, 8);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', alignContent: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 22, padding: '0 90px', fontFamily: FONT, opacity: inn * (1 - out)}}>
      {HOOK2.map((w, i) => {
        const p = prog(f, HOOK2_AT[i], 10, out3);
        return (
          <span key={w} style={{display: 'inline-block', fontSize: 118, fontWeight: 800, letterSpacing: -3, color: i === 1 ? C.copper : C.ink, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- small 2D pieces
const Pill: React.FC<{f: number; at: number; out?: number; children: React.ReactNode; fill?: string; ink?: string; size?: number; top?: number; left?: number | 'center'}> = ({f, at, out, children, fill = '#fff', ink = C.navy, size = 40, top = 64, left = 'center'}) => {
  const a = prog(f, at, 14, out3) * (out === undefined ? 1 : 1 - prog(f, out, 10));
  if (a <= 0.01) return null;
  const common = {position: 'absolute' as const, top, fontFamily: FONT, opacity: a, transform: `translateY(${(1 - a) * -20}px)`};
  const pill = (
    <span style={{display: 'inline-block', padding: '12px 34px', borderRadius: 50, background: fill, color: ink, border: `2px solid ${C.line}`, boxShadow: '0 12px 30px rgba(22,33,49,0.14)', fontWeight: 800, fontSize: size}}>{children}</span>
  );
  return left === 'center' ? <div style={{...common, left: 0, right: 0, textAlign: 'center'}}>{pill}</div> : <div style={{...common, left}}>{pill}</div>;
};

const Credentials: React.FC<{f: number}> = ({f}) => {
  const rows = [
    {t: 'Mit 27: kaufmännische Leiterin', at: u('b6', 0.42)},
    {t: 'Mit 30: Niederlassungsleiterin', at: u('b6', 0.66)}
  ];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 905, textAlign: 'center', fontFamily: FONT}}>
      {rows.map((r) => {
        const a = prog(f, r.at, 14, out3);
        return (
          <div key={r.t} style={{margin: '8px 0', opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>
            <span style={{display: 'inline-block', padding: '10px 32px', borderRadius: 50, background: '#fff', border: `2px solid ${C.line}`, boxShadow: '0 12px 30px rgba(22,33,49,0.14)', fontWeight: 800, fontSize: 38, color: C.navy}}>
              <span style={{color: C.copper}}>{r.t.split(':')[0]}:</span>
              {r.t.split(':')[1]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const QUOTE = ['Du musst nicht die', 'Person bleiben,', 'die andere in dir sehen.'];
const Quote: React.FC<{f: number}> = ({f}) => {
  const b = B.b10;
  if (!between(f, b.start, b.end)) return null;
  const out = prog(f, b.end - 8, 8);
  const words = QUOTE.join(' ').split(' ');
  const times = wordTimes('b10', words);
  let k = 0;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 46, textAlign: 'center', fontFamily: FONT, opacity: 1 - out}}>
      {QUOTE.map((line, li) => (
        <div key={li} style={{fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.12, color: C.ink}}>
          {line.split(' ').map((w, wi) => {
            const p = prog(f, times[k++], 12, out3);
            return (
              <span key={wi} style={{display: 'inline-block', marginRight: 16, opacity: p, transform: `translateY(${(1 - p) * 28}px)`, color: w === 'nicht' ? C.copper : C.ink}}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  const b = B.b11;
  if (f < b.start + 4) return null;
  const chips = ['Female Leadership', 'Resilienz', 'Mitarbeiterführung', 'Networking'];
  const wm = prog(f, b.v0 + 34, 16, out3);
  const btn = prog(f, b.v0 + 46, 14, out3);
  const url = prog(f, b.v0 + 70, 12);
  const shine = (((f - b.v0 - 60) % 60) + 60) % 60 / 60;
  return (
    <>
      <div style={{position: 'absolute', left: 40, right: 40, top: 468, textAlign: 'center', fontFamily: FONT}}>
        {chips.map((t, i) => {
          const a = prog(f, b.v0 + 22 + i * 7, 12, out3);
          return (
            <span key={t} style={{display: 'inline-block', margin: '8px 10px', padding: '12px 30px', borderRadius: 50, background: i === 0 ? C.copper : '#fff', color: i === 0 ? '#fff' : C.copper, border: `2px solid ${C.line}`, boxShadow: '0 12px 30px rgba(22,33,49,0.14)', fontWeight: 700, fontSize: 36, opacity: a, transform: `scale(${0.8 + 0.2 * a})`}}>{t}</span>
          );
        })}
      </div>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 280, top: 676, width: 520, height: 87, opacity: wm, transform: `translateY(${(1 - wm) * 30}px)`}} />
      <div style={{position: 'absolute', left: 150, width: 780, top: 794, height: 112, borderRadius: 56, background: C.copper, overflow: 'hidden', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: FONT, fontSize: 42, fontWeight: 800, boxShadow: `0 22px 54px ${C.copper}66`, opacity: btn, transform: `scale(${0.85 + 0.15 * btn})`}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, width: 110, left: `${-20 + shine * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-20deg)'}} />
        Jetzt unverbindlich anfragen
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 940, textAlign: 'center', fontFamily: FONT, fontSize: 34, fontWeight: 600, color: C.navy, opacity: url}}>speakingstage.com/speaker/chris-aike-spring</div>
    </>
  );
};

/** 0..1 while the voice speaks (with short ramps) - ducks music and effects. */
const speaking = (frame: number) =>
  TL.beats.reduce((m, b) => Math.max(m, Math.min(1, Math.max(0, (frame - (b.v0 - 6)) / 6)) * (1 - Math.min(1, Math.max(0, (frame - (b.v0 + b.vFrames)) / 10)))), 0);

export const PitchChris: React.FC = () => {
  const f = useCurrentFrame();
  const pose = cameraAt(f);
  const blur = inFlight(f) ? Math.min(14, Math.max(0, (speedOf(f) - 0.35) * 12)) : 0;
  const win = (id: string, pad = 14) => between(f, B[id].start - pad, B[id].end + pad);
  const flipWin = between(f, B.b7.start - 14, B.b9.end + 14);
  const showMark = f >= B.b3.start + 20 && f < B.b11.start;
  return (
    <LayoutCtx.Provider value={SQUARE}>
      <AbsoluteFill style={{background: '#fff'}}>
        <AbsoluteFill style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
          <ThreeCanvas width={1080} height={1080} camera={{fov: 34, near: 0.1, far: 400, position: [0, 0, 10]}}>
            <color attach="background" args={['#ffffff']} />
            <fog attach="fog" args={['#ffffff', 18, 80]} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[4, 8, 6]} intensity={2.2} />
            <CameraRig pose={pose} width={1080} height={1080} />
            <Particles count={700} zFrom={20} zTo={-340} />
            {win('b3') && <CrowdWorld f={f} />}
            {win('b4') && <ToolsWorld f={f} />}
            {win('b5') && <SlidesWorld f={f} />}
            {win('b6') && <ChrisWorld f={f} />}
            {flipWin && <FlipWorld f={f} />}
            {win('b10') && <PhotosWorld f={f} />}
            {f >= B.b11.start - 14 && <CtaWorld f={f} />}
          </ThreeCanvas>
        </AbsoluteFill>
        <SpeedLines amount={(blur - 2) / 10} />

        <Hook f={f} />
        <Hook2 f={f} />

        {win('b3', 0) && (
          <>
            <Pill f={f} at={u('b3', 0.12)} out={B.b3.end - 10} fill="#eceff3" ink="#6b7380">Befehlsempfänger statt Haltung</Pill>
            <Pill f={f} at={u('b3', 0.64)} out={B.b3.end - 10} fill={C.copper} ink="#fff" top={150} size={38}>Verloren: wer Missstände benennt</Pill>
          </>
        )}
        {win('b4', 0) && (
          <>
            <Pill f={f} at={u('b4', 0.06)} out={B.b4.end - 10} fill="#eceff3" ink="#6b7380">Alle Werkzeuge sind da</Pill>
            <Pill f={f} at={u('b4', 0.5)} out={B.b4.end - 10} fill={C.copper} ink="#fff" top={150}>Nur die Haltung fehlt</Pill>
          </>
        )}
        {win('b5', 0) && <Pill f={f} at={u('b5', 0.02)} out={B.b5.end - 10}>Was Sie als Veranstalter brauchen</Pill>}
        {win('b6', 0) && <Credentials f={f} />}
        {flipWin && <Pill f={f} at={B.b7.v0} out={B.b9.end - 10} fill="#fff" ink={C.copper} size={38}>Das Problem  →  Ihre Lösung</Pill>}
        <Quote f={f} />
        <Cta f={f} />

        {showMark && <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 36, top: 30, width: 170, height: 28, opacity: 0.9}} />}

        <Audio src={staticFile('audio/pitch-music.wav')} volume={(fr) => 0.6 * (1 - 0.55 * speaking(fr))} />
        <Audio src={staticFile('audio/pitch-sfx.wav')} volume={(fr) => 0.9 * (1 - 0.35 * speaking(fr))} />
        {TL.beats.map((b) => (
          <Sequence key={b.id} from={b.v0} durationInFrames={b.vFrames + 4}>
            <Audio src={staticFile(b.file)} volume={1} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </LayoutCtx.Provider>
  );
};
