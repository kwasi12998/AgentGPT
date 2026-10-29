import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {C, FONT, prog} from '../theme';
import {CameraRig, Pose, V3} from '../three/camera';
import {B, TL} from '../apple2-timeline';
import {FloorGlow} from '../apple/objects';
import {Beam, Bokeh, Card3, CardShadow, Chair2, Crowd, Env, Floor, Mic2, Mirror, Morph, Motes, ShockRing} from './objects';

const out3 = Easing.out(Easing.cubic);
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const inOut3 = Easing.inOut(Easing.cubic);
const sine = Easing.inOut(Easing.sin);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const between = (f: number, a: number, b: number) => f >= a && f <= b;
const DEG = Math.PI / 180;
const l = (x: number, y: number, t: number) => x + (y - x) * t;
const l3 = (a: V3, b: V3, t: number): V3 => [l(a[0], b[0], t), l(a[1], b[1], t), l(a[2], b[2], t)];
const mix = (a: Pose, b: Pose, t: number): Pose => ({pos: l3(a.pos, b.pos, t), target: l3(a.target, b.target, t), roll: 0, fov: l(a.fov, b.fov, t)});
const P = (pos: V3, target: V3, fov = 30): Pose => ({pos, target, roll: 0, fov});

const wordTimes = (beat: string, words: string[]) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const f = B[beat].v0 + (acc / total) * B[beat].vFrames * 0.94;
    acc += w.length + 1;
    return f;
  });
};

// ------------------------------------------------------------------ camera: one continuous flight, no shake
const HEAD: V3 = [-0.12, 2.18, 0];
const S2 = () => B.a2.start;
const L2 = () => B.a2.end - B.a2.start;
const K = () => ({
  settle: B.a3.start + 92,
  carousel: B.a3.start + 138
});

export const cameraAt = (f: number): Pose => {
  if (f < B.a2.start) {
    const p = clamp01((f - B.a1.start) / (B.a1.end - B.a1.start));
    const e = Easing.out(Easing.poly(1.5))(p);
    return mix(P([1.0, 0.9, 27], [0, 1.9, 0], 44), P([0.35, 1.35, 9.6], [0, 1.3, 0], 30), e);
  }
  if (f < B.a3.start) {
    const r = f - S2();
    const L = L2();
    const u = clamp01(r / (0.62 * L));
    const eu = sine(u);
    const w = clamp01((r - 0.62 * L) / (0.38 * L));
    const ew = Easing.in(Easing.poly(2.2))(w);
    const ang = -72 * DEG * eu;
    const rad = l(9.6, 5.2, eu);
    const tgt0: V3 = [0, l(1.3, 1.6, eu), 0];
    const tgt: V3 = l3(tgt0, HEAD, ew);
    const radius = l(rad, 1.75, ew);
    const y = l(l(1.35, 1.8, eu), 2.0, ew);
    return {pos: [tgt[0] + Math.sin(ang) * radius, y, tgt[2] + Math.cos(ang) * radius], target: tgt, roll: 0, fov: l(30, 26, ew)};
  }
  const k = K();
  const a = B.a3.start;
  const close = P([-1.4, 0.35, 3.8], [-1.1, 0.1, 0], 34);
  const settled = P([-0.2, 0.25, 7.9], [-0.25, 0.1, 0], 30);
  const carousel = P([1.2, 2.1, 10.6], [1.2, 1.7, 0], 30);
  const end = P([6.0, 2.1, 10.2], [6.0, 1.7, 0], 30);
  if (f < k.settle) return mix(close, settled, Easing.out(Easing.poly(3))(clamp01((f - a) / (k.settle - a))));
  if (f < k.carousel) return mix(settled, carousel, inOut3(clamp01((f - k.settle) / (k.carousel - k.settle))));
  return mix(carousel, end, sine(clamp01((f - k.carousel) / (TL.total - k.carousel))));
};

// ------------------------------------------------------------------ typography (kinetic, fast)
const Slam: React.FC<{f: number; at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({f, at, dur = 10, children, style, from = 0.36}) => {
  const p = prog(f, at, dur, expoOut);
  return (
    <span style={{display: 'inline-block', opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 34}px) scale(${1 + (1 - p) * from})`, filter: `blur(${(1 - p) * 12}px)`, ...style}}>{children}</span>
  );
};

const MaskLine: React.FC<{at: number; f: number; children: React.ReactNode; dur?: number; style?: React.CSSProperties}> = ({at, f, children, dur = 12, style}) => {
  const p = prog(f, at, dur, expoOut);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 108}%)`, opacity: Math.min(1, p * 2.4)}}>{children}</div>
    </div>
  );
};

const Question: React.FC<{f: number}> = ({f}) => {
  if (f > B.a2.start + 24) return null;
  const words = ['Wer', 'nimmt', 'diesen', 'Platz', 'ein?'];
  const at = wordTimes('a1', words);
  const out = prog(f, B.a2.start + 2, 14, inOut3);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT, opacity: 1 - out, transform: `scale(${1 + out * 0.14})`, filter: `blur(${out * 10}px)`}}>
      {[words.slice(0, 2), words.slice(2)].map((line, li) => (
        <div key={li} style={{fontSize: 118, fontWeight: 800, letterSpacing: -4, lineHeight: 1.04, color: '#fff'}}>
          {line.map((w, wi) => (
            <span key={w} style={{marginRight: 24, display: 'inline-block'}}>
              <Slam f={f} at={at[li === 0 ? wi : 2 + wi]} style={{color: w === 'Platz' ? C.copperLight : '#fff'}}>
                {w}
              </Slam>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

const Voice: React.FC<{f: number}> = ({f}) => {
  if (!between(f, B.a2.start, B.a3.start + 2)) return null;
  const words = ['Eine', 'Stimme', 'mit', 'Haltung.'];
  const at = wordTimes('a2', words);
  const out = prog(f, B.a3.start - 14, 10);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 96, textAlign: 'center', fontFamily: FONT, fontSize: 64, fontWeight: 700, letterSpacing: -1.5, color: '#fff', opacity: 1 - out}}>
      {words.map((w) => (
        <span key={w} style={{display: 'inline-block', marginRight: 16}}>
          <Slam f={f} at={at[words.indexOf(w)]} from={0.25} style={{color: w === 'Haltung.' ? C.copperLight : '#fff'}}>
            {w}
          </Slam>
        </span>
      ))}
    </div>
  );
};

const Name: React.FC<{f: number}> = ({f}) => {
  const exit = B.a3.start + 100;
  if (!between(f, B.a3.start + 8, exit + 24)) return null;
  const out = prog(f, exit, 18, inOut3);
  const lines = ['Chris-', 'Aike', 'Spring'];
  const t0 = B.a3.v0;
  return (
    <>
      <div style={{position: 'absolute', left: 560, top: 322, fontFamily: FONT, fontSize: 138, fontWeight: 800, letterSpacing: -5, lineHeight: 0.98, opacity: 1 - out, transform: `translateX(${out * 90}px)`}}>
        {lines.map((t, i) => (
          <MaskLine key={t} f={f} at={t0 + i * 5} style={{color: i === 2 ? C.copper : C.ink}}>
            {t}
          </MaskLine>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 92, textAlign: 'center', fontFamily: FONT, fontSize: 44, fontWeight: 600, letterSpacing: -0.5, color: C.navy, opacity: 1 - out}}>
        <Slam f={f} at={t0 + B.a3.vFrames * 0.5} from={0.12}>
          Keynote-Speakerin für <span style={{color: C.copper}}>Female Leadership</span>
        </Slam>
      </div>
    </>
  );
};

const Usp: React.FC<{f: number}> = ({f}) => {
  if (!between(f, B.a4a.start, B.a5.start + 30)) return null;
  const beats = [B.a4a, B.a4b, B.a4c];
  const text = ['Klartext.', 'Substanz.', 'Haltung.'];
  const out = prog(f, B.a5.start + 2, 14, inOut3);
  const line = prog(f, B.a4c.v0 + 6, 16, expoOut);
  return (
    <div style={{position: 'absolute', left: 70, top: 124, fontFamily: FONT, fontSize: 156, fontWeight: 800, letterSpacing: -5, lineHeight: 1.0, opacity: 1 - out, transform: `translateY(${-out * 40}px)`}}>
      {text.map((t, i) => {
        const dim = i < 2 ? prog(f, beats[i + 1].v0, 10, out3) : 0;
        const color = i === 2 ? C.copper : dim > 0 ? `rgb(${Math.round(22 + 178 * dim)},${Math.round(33 + 175 * dim)},${Math.round(49 + 170 * dim)})` : C.ink;
        return (
          <div key={t} style={{height: 156, color}}>
            <Slam f={f} at={beats[i].v0 - 2} dur={9} from={0.5}>
              {t}
            </Slam>
          </div>
        );
      })}
      <div style={{height: 10, width: 520 * line, background: C.copper, borderRadius: 5, marginTop: 6}} />
    </div>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < B.a5.start) return null;
  const wm = prog(f, B.a5.v0 + 24, 14, expoOut);
  const url = prog(f, B.a5.v0 + 36, 12, expoOut);
  const nameP = prog(f, B.a5.start + 4, 14, expoOut);
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 100, textAlign: 'center', fontFamily: FONT, fontSize: 54, fontWeight: 700, letterSpacing: -1, color: C.navy, opacity: nameP, transform: `translateY(${(1 - nameP) * 14}px)`}}>Chris-Aike Spring</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center', fontFamily: FONT, fontSize: 196, fontWeight: 800, letterSpacing: -7, lineHeight: 0.98}}>
        <MaskLine f={f} at={B.a5.v0 - 4} dur={11} style={{color: C.ink}}>Jetzt</MaskLine>
        <MaskLine f={f} at={B.a5.v0 + 2} dur={11} style={{color: C.copper}}>anfragen.</MaskLine>
      </div>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 330, top: 800, width: 420, height: 70, opacity: wm, transform: `translateY(${(1 - wm) * 20}px)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 902, textAlign: 'center', fontFamily: FONT, fontSize: 36, fontWeight: 600, color: C.navy, opacity: url}}>speakingstage.com/speaker/chris-aike-spring</div>
    </>
  );
};

// ------------------------------------------------------------------ worlds
const DarkWorld: React.FC<{f: number; pose: Pose}> = ({f, pose}) => {
  const r = f - B.a2.start;
  const inA2 = f >= B.a2.start;
  const intro = prog(f, 0, 14, out3);
  const chairO = inA2 ? 1 - prog(r, 2, 4) : 1;
  const t = inA2 ? Math.min(1.06, Math.max(0, (r - 4) / 50)) : 0;
  const glow = inA2 ? prog(r, 2, 4) * (1 - prog(r, 56, 10)) : 0;
  const shard = inA2 && r > 3 && r < 58 ? 1 : 0;
  const micO = inA2 ? prog(r, 54, 10) : 0;
  const cam = pose.pos;
  return (
    <group>
      <fogExp2 attach="fog" args={['#0a111a', 0.04]} />
      <Env intensity={0.45} />
      <hemisphereLight args={['#8fa6cf', '#0a0f16', 0.35]} />
      <spotLight position={[0.5, 9, 2]} intensity={420} angle={0.42} penumbra={0.9} decay={2} color="#fff3e6" />
      <pointLight position={[-3, 2.6, -3]} intensity={45} color="#e0a074" />
      <pointLight position={[3.4, 1.5, 3.5]} intensity={9} color="#9fb8e8" />
      <pointLight position={[cam[0], cam[1] + 0.5, cam[2] + 0.6]} intensity={14} color="#b8c8e8" decay={2} />
      <Floor />
      <Crowd />
      <FloorGlow opacity={intro} />
      <Beam from={[0, 9.4, 0.5]} to={[0, 0, 0]} color="#c4d2ec" opacity={0.2 * intro} width={2.6} />
      <Beam from={[-4.5, 9.4, -3]} to={[0.4, 0, 0]} color="#e0a074" opacity={0.1 * intro} width={1.7} />
      <Beam from={[4.8, 9.4, -3]} to={[-0.4, 0, 0]} color="#9fb8e8" opacity={0.1 * intro} width={1.7} />
      <Bokeh opacity={intro} />
      <Motes f={f} opacity={0.5 * intro} box={[10, 7, 24]} center={[0, 3.5, 12]} color="#f3e6d8" size={0.035} count={360} />
      <Chair2 opacity={chairO} />
      <Mirror>
        <Chair2 opacity={0.2 * chairO} ghost />
      </Mirror>
      <Morph t={t} glow={glow} shard={shard} />
      <Mirror>
        <Morph t={t} glow={glow * 0.3} shard={0} ghost />
      </Mirror>
      <Mic2 opacity={micO} />
      <Mirror>
        <Mic2 opacity={0.2 * micO} ghost />
      </Mirror>
      <ShockRing p={inA2 ? (r - 4) / 26 : 0} />
    </group>
  );
};

type CardCfg = {src: string; key: string; pos: V3; scale: number; yaw: number; blur?: number; at: number};
const FLOOR_Y = -1.5;
const CARDS: CardCfg[] = [
  {src: 'chris/photo2.jpg', key: 'a2-p2', pos: [1.9, 0, -1.0], scale: 0.8, yaw: -0.2, at: 0},
  {src: 'chris/photo3.jpg', key: 'a2-p3', pos: [4.3, 0.05, -1.6], scale: 0.8, yaw: 0, at: 5},
  {src: 'chris/photo4.jpg', key: 'a2-p4', pos: [6.7, 0, -1.0], scale: 0.8, yaw: 0.2, at: 10},
  {src: 'chris/photo5.jpg', key: 'a2-p5', pos: [9.0, 0.05, -1.8], scale: 0.8, yaw: 0.25, at: 15},
  {src: 'chris/photo2.jpg', key: 'a2-p2b', pos: [-3.6, 0.2, -3.6], scale: 1.0, yaw: -0.3, blur: 9, at: 0},
  {src: 'chris/photo4.jpg', key: 'a2-p4b', pos: [11.8, 0.2, -4.0], scale: 1.0, yaw: 0.3, blur: 9, at: 18}
];

const LightWorld: React.FC<{f: number}> = ({f}) => {
  const k = K();
  const enter = prog(f, B.a3.start + 4, 40, Easing.out(Easing.poly(5)));
  const heroOut = prog(f, k.settle, 40, Easing.in(Easing.cubic));
  const sweep = prog(f, B.a3.start + 24, 60, inOut3);
  const carouselIn = (at: number) => prog(f, k.settle + 10 + at, 26, expoOut);
  const gone = prog(f, B.a5.start + 4, 22, inOut3);
  const hx = -1.15 - heroOut * 3.4;
  return (
    <group>
      <Env intensity={0.8} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 6]} intensity={2.0} />
      <Motes f={f} opacity={0.55} box={[16, 6, 12]} center={[3, 0.8, -2]} color="#a7643c" size={0.045} count={150} speed={0.004} />
      <group position={[hx, 0.05 - (1 - enter) * 0.9, 0]} scale={0.85 * (0.6 + 0.4 * enter)} rotation={[0, -0.12 - (1 - enter) * 1.3, 0]}>
        <Card3 src="chris/photo1.jpg" texKey="a2-portrait" opacity={enter * (1 - heroOut)} sweep={sweep} />
      </group>
      <group position={[hx, FLOOR_Y, 0]}>
        <CardShadow opacity={enter * (1 - heroOut) * 0.9} />
      </group>
      {CARDS.map((c) => {
        const p = carouselIn(c.at);
        const op = p * (1 - gone);
        return (
          <group key={c.key}>
            <group position={[c.pos[0], c.pos[1] - (1 - p) * 1.2, c.pos[2]]} scale={c.scale} rotation={[0, c.yaw + (1 - p) * 0.5, 0]}>
              <Card3 src={c.src} texKey={c.key} blur={c.blur} opacity={op * (c.blur ? 0.8 : 1)} />
            </group>
            <group position={[c.pos[0], FLOOR_Y, c.pos[2]]} scale={c.scale}>
              <CardShadow opacity={op * 0.8} />
            </group>
          </group>
        );
      })}
    </group>
  );
};

/** 0..1 while the voice speaks (with short ramps) - ducks music and effects. */
const speaking = (frame: number) =>
  TL.beats.reduce((m, b) => Math.max(m, Math.min(1, Math.max(0, (frame - (b.v0 - 6)) / 6)) * (1 - Math.min(1, Math.max(0, (frame - (b.v0 + b.vFrames)) / 10)))), 0);

export const Apple2: React.FC = () => {
  const f = useCurrentFrame();
  const pose = cameraAt(f);
  const swap = B.a3.start + 8;
  const darkWorld = f <= swap;
  const grow = prog(f, B.a3.start - 14, 22, inOut3);
  const fade = 1 - prog(f, swap, 26, out3);
  const rad = grow * 1700;
  return (
    <AbsoluteFill style={{background: '#05080d'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #1c2b42 0%, #0e1724 50%, #05080d 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #ffffff 0%, #fbf8f4 55%, #f3ece3 100%)', opacity: f > swap ? 1 : 0}} />
      <ThreeCanvas width={1080} height={1080} gl={{alpha: true, antialias: true}} camera={{fov: 30, near: 0.1, far: 140, position: [0, 1.5, 8]}}>
        <CameraRig pose={pose} width={1080} height={1080} />
        {darkWorld ? <DarkWorld f={f} pose={pose} /> : <LightWorld f={f} />}
      </ThreeCanvas>

      <Question f={f} />
      <Voice f={f} />
      <Name f={f} />
      <Usp f={f} />
      <Cta f={f} />

      {f >= B.a3.start - 14 && f <= swap + 28 && (
        <AbsoluteFill
          style={{
            opacity: f <= swap ? 1 : fade,
            background: `radial-gradient(circle at 50% 50%, #ffffff 0, #ffffff ${rad * 0.5}px, rgba(251,244,236,0.92) ${rad * 0.72}px, rgba(255,255,255,0) ${rad}px)`
          }}
        />
      )}

      <Audio src={staticFile('audio/apple2-music.wav')} volume={(fr) => 0.55 * (1 - 0.5 * speaking(fr))} />
      <Audio src={staticFile('audio/apple2-sfx.wav')} volume={(fr) => 0.9 * (1 - 0.35 * speaking(fr))} />
      {TL.beats.map((b) => (
        <Sequence key={b.id} from={b.v0} durationInFrames={b.vFrames + 4}>
          <Audio src={staticFile(b.file)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
