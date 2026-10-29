import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {C, FONT, prog} from '../theme';
import {CameraRig, Pose, V3} from '../three/camera';
import {B, TL} from '../apple-timeline';
import {AudiencePlate, Chair, Dust, FloorGlow, GlassPanel, Mic, MorphPoints, PANEL, Reflect, SpotCone} from './objects';

const out3 = Easing.out(Easing.cubic);
const inOut3 = Easing.inOut(Easing.cubic);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const between = (f: number, a: number, b: number) => f >= a && f <= b;
const DEG = Math.PI / 180;

const wordTimes = (beat: string, words: string[]) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const f = B[beat].v0 + (acc / total) * B[beat].vFrames * 0.94;
    acc += w.length + 1;
    return f;
  });
};

// ------------------------------------------------------------------ camera (slow dolly, one orbit, no shake)
const P = (pos: V3, target: V3, fov = 30): Pose => ({pos, target, roll: 0, fov});
const mixP = (a: Pose, b: Pose, t: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l3 = (x: V3, y: V3): V3 => [l(x[0], y[0]), l(x[1], y[1]), l(x[2], y[2])];
  return {pos: l3(a.pos, b.pos), target: l3(a.target, b.target), roll: 0, fov: l(a.fov, b.fov)};
};
const sine = Easing.inOut(Easing.sin);

export const cameraAt = (f: number): Pose => {
  if (f < B.a2.start) {
    const p = clamp01((f - B.a1.start) / (B.a1.end - B.a1.start));
    return mixP(P([0, 1.55, 8.8], [0, 1.05, 0]), P([0, 1.5, 7.9], [0, 1.05, 0]), sine(p));
  }
  if (f < B.a3.start) {
    const p = inOut3(clamp01((f - B.a2.start) / (B.a2.end - B.a2.start)));
    const ang = 22 * p * DEG;
    const r = 7.9 - 0.5 * p;
    return P([Math.sin(ang) * r, 1.5 + 0.1 * p, Math.cos(ang) * r], [0, 1.3, 0]);
  }
  const p = clamp01((f - B.a3.start) / (TL.total - B.a3.start));
  return mixP(P([0, 0.1, 9.8], [0, 0, 0]), P([0, 0.1, 8.7], [0, 0, 0]), sine(p));
};

// ------------------------------------------------------------------ small typography helpers
const MaskLine: React.FC<{at: number; f: number; children: React.ReactNode; dur?: number; style?: React.CSSProperties}> = ({at, f, children, dur = 20, style}) => {
  const p = prog(f, at, dur, out3);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 108}%)`, opacity: Math.min(1, p * 2.4)}}>{children}</div>
    </div>
  );
};

const Question: React.FC<{f: number}> = ({f}) => {
  if (f > B.a2.start + 40) return null;
  const words = ['Wer', 'nimmt', 'diesen', 'Platz', 'ein?'];
  const at = wordTimes('a1', words);
  const out = prog(f, B.a2.start + 4, 26, inOut3);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT, opacity: 1 - out, transform: `translateY(${-out * 18}px)`}}>
      {[words.slice(0, 2), words.slice(2)].map((line, li) => (
        <div key={li} style={{fontSize: 118, fontWeight: 800, letterSpacing: -4, lineHeight: 1.04, color: '#fff'}}>
          {line.map((w, wi) => {
            const k = li === 0 ? wi : 2 + wi;
            const p = prog(f, at[k], 22, out3);
            return (
              <span key={w} style={{display: 'inline-block', marginRight: 24, opacity: p, transform: `translateY(${(1 - p) * 28}px)`, filter: `blur(${(1 - p) * 10}px)`, color: w === 'Platz' ? C.copperLight : '#fff'}}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Voice: React.FC<{f: number}> = ({f}) => {
  if (!between(f, B.a2.start, B.a3.start + 6)) return null;
  const p = prog(f, B.a2.v0, 22, out3);
  const out = prog(f, B.a3.start - 18, 14);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 96, textAlign: 'center', fontFamily: FONT, fontSize: 60, fontWeight: 700, letterSpacing: -1.5, color: '#fff', opacity: p * (1 - out), transform: `translateY(${(1 - p) * 20}px)`, filter: `blur(${(1 - p) * 8}px)`}}>
      Eine Stimme mit <span style={{color: C.copperLight}}>Haltung.</span>
    </div>
  );
};

const Name: React.FC<{f: number}> = ({f}) => {
  if (!between(f, B.a3.start + 8, B.a4a.start + 30)) return null;
  const out = prog(f, B.a4a.start - 4, 18, inOut3);
  const lines = ['Chris-', 'Aike', 'Spring'];
  const sub = prog(f, B.a3.v0 + B.a3.vFrames * 0.42, 22, out3);
  return (
    <>
      <div style={{position: 'absolute', left: 560, top: 322, fontFamily: FONT, fontSize: 138, fontWeight: 800, letterSpacing: -5, lineHeight: 0.98, opacity: 1 - out, transform: `translateX(${out * 40}px)`}}>
        {lines.map((t, i) => (
          <MaskLine key={t} f={f} at={B.a3.v0 + i * 6} style={{color: i === 2 ? C.copper : C.ink}}>
            {t}
          </MaskLine>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 92, textAlign: 'center', fontFamily: FONT, fontSize: 44, fontWeight: 600, letterSpacing: -0.5, color: C.navy, opacity: sub * (1 - out), transform: `translateY(${(1 - sub) * 16}px)`}}>
        Keynote-Speakerin für <span style={{color: C.copper}}>Female Leadership</span>
      </div>
    </>
  );
};

const Usp: React.FC<{f: number}> = ({f}) => {
  if (!between(f, B.a4a.start, B.a5.start + 40)) return null;
  const words = [B.a4a, B.a4b, B.a4c];
  const text = ['Klartext.', 'Substanz.', 'Haltung.'];
  const out = prog(f, B.a5.start + 6, 22, inOut3);
  const line = prog(f, B.a4c.v0 + 14, 24, out3);
  return (
    <div style={{position: 'absolute', left: 70, top: 292, fontFamily: FONT, fontSize: 176, fontWeight: 800, letterSpacing: -6, lineHeight: 1.0, opacity: 1 - out, transform: `translateY(${-out * 30}px)`}}>
      {text.map((t, i) => {
        const dim = i < 2 ? prog(f, words[i + 1].v0, 16, out3) : 0;
        const color = i === 2 ? C.copper : dim > 0 ? `rgb(${Math.round(22 + 178 * dim)},${Math.round(33 + 175 * dim)},${Math.round(49 + 170 * dim)})` : C.ink;
        return (
          <MaskLine key={t} f={f} at={words[i].v0} dur={18} style={{color, height: 176 * 1.0}}>
            {t}
          </MaskLine>
        );
      })}
      <div style={{height: 10, width: 560 * line, background: C.copper, borderRadius: 5, marginTop: 6}} />
    </div>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < B.a5.start + 8) return null;
  const wm = prog(f, B.a5.v0 + 30, 18, out3);
  const url = prog(f, B.a5.v0 + 46, 16, out3);
  const nameP = prog(f, B.a5.start + 10, 20, out3);
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 100, textAlign: 'center', fontFamily: FONT, fontSize: 54, fontWeight: 700, letterSpacing: -1, color: C.navy, opacity: nameP, transform: `translateY(${(1 - nameP) * 14}px)`}}>
        Chris-Aike Spring
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center', fontFamily: FONT, fontSize: 196, fontWeight: 800, letterSpacing: -7, lineHeight: 0.98}}>
        <MaskLine f={f} at={B.a5.v0 - 2} style={{color: C.ink}}>Jetzt</MaskLine>
        <MaskLine f={f} at={B.a5.v0 + 6} style={{color: C.copper}}>anfragen.</MaskLine>
      </div>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 330, top: 800, width: 420, height: 70, opacity: wm, transform: `translateY(${(1 - wm) * 20}px)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 902, textAlign: 'center', fontFamily: FONT, fontSize: 36, fontWeight: 600, color: C.navy, opacity: url}}>speakingstage.com/speaker/chris-aike-spring</div>
    </>
  );
};

// ------------------------------------------------------------------ 3D worlds
const DarkWorld: React.FC<{f: number}> = ({f}) => {
  const r = f - B.a2.start;
  const L = B.a2.end - B.a2.start;
  const inA2 = f >= B.a2.start;
  const chairO = inA2 ? 1 - prog(r, 0, 22, inOut3) : 1;
  const t = inA2 ? clamp01((r - 12) / (0.66 * L)) : 0;
  const pointsA = inA2 ? prog(r, 4, 18) * (1 - prog(r, 0.74 * L, 24)) : 0;
  const micO = inA2 ? prog(r, 0.72 * L, 26, inOut3) : 0;
  const spin = inA2 ? r * 0.005 : 0;
  const intro = prog(f, 0, 30, out3);
  return (
    <group>
      <hemisphereLight args={['#a9bde0', '#141a24', 0.55]} />
      <directionalLight position={[3.5, 7, 5]} intensity={1.7} color="#ffffff" />
      <pointLight position={[-3.2, 2.6, -3]} intensity={55} color="#e0a074" />
      <pointLight position={[3, 1.2, 3]} intensity={10} color="#9fb8e8" />
      <AudiencePlate opacity={intro} />
      <FloorGlow opacity={intro} />
      <SpotCone opacity={intro} />
      <Dust f={f} opacity={intro} />
      <group scale={0.55 + 0.45 * intro}>
        <Chair opacity={chairO} />
        <Reflect floorY={0}>
          <Chair opacity={0.16 * chairO} ghost />
        </Reflect>
        <MorphPoints t={t} alpha={pointsA} />
        <Reflect floorY={0}>
          <MorphPoints t={t} alpha={pointsA * 0.3} ghost />
        </Reflect>
        <Mic opacity={micO} spin={spin} />
        <Reflect floorY={0}>
          <Mic opacity={0.16 * micO} spin={spin} ghost />
        </Reflect>
      </group>
    </group>
  );
};

const LightWorld: React.FC<{f: number}> = ({f}) => {
  const enter = prog(f, B.a3.start + 10, 44, out3);
  const q = prog(f, B.a4a.start, 28, inOut3);
  const gone = prog(f, B.a5.start, 20);
  const yaw = -0.16 + 0.0005 * (f - B.a3.start);
  const x = -1.15 + (1.61 + 1.15) * q;
  const y = 0.05 + (1.73 - 0.05) * q - (1 - enter) * 0.5;
  const scale = (1 - q * 0.6) * (0.92 + 0.08 * enter);
  const sweep = prog(f, B.a3.start + 34, 70, inOut3);
  const op = enter * (1 - gone);
  const refl = -(PANEL.h + 0.1);
  return (
    <group>
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 6]} intensity={2.0} />
      <group position={[x, y, 0]} scale={scale} rotation={[0, yaw * (1 - q) - 0.1 * q, 0]}>
        <GlassPanel f={f} opacity={op} sweep={sweep} />
        <group position={[0, refl, 0]} scale={[1, -1, 1]}>
          <GlassPanel f={f} opacity={op * (1 - q) * 0.7} sweep={sweep} ghost />
        </group>
      </group>
    </group>
  );
};

/** 0..1 while the voice speaks (with short ramps) - ducks music and effects. */
const speaking = (frame: number) =>
  TL.beats.reduce((m, b) => Math.max(m, Math.min(1, Math.max(0, (frame - (b.v0 - 6)) / 6)) * (1 - Math.min(1, Math.max(0, (frame - (b.v0 + b.vFrames)) / 10)))), 0);

export const AppleChris: React.FC = () => {
  const f = useCurrentFrame();
  const pose = cameraAt(f);
  const swap = B.a3.start + 8;
  const darkWorld = f <= swap;
  const grow = prog(f, B.a3.start - 20, 28, inOut3);
  const fade = 1 - prog(f, swap, 30, out3);
  const rad = grow * 1700;
  return (
    <AbsoluteFill style={{background: '#05080d'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #1c2b42 0%, #0e1724 52%, #05080d 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #ffffff 0%, #fbf8f4 55%, #f3ece3 100%)', opacity: f > swap ? 1 : 0}} />
      <ThreeCanvas width={1080} height={1080} gl={{alpha: true, antialias: true}} camera={{fov: 30, near: 0.1, far: 120, position: [0, 1.5, 8]}}>
        <CameraRig pose={pose} width={1080} height={1080} />
        {darkWorld ? <DarkWorld f={f} /> : <LightWorld f={f} />}
      </ThreeCanvas>

      <Question f={f} />
      <Voice f={f} />
      <Name f={f} />
      <Usp f={f} />
      <Cta f={f} />

      {/* light wipe: the highlight of the microphone widens until the whole frame is light */}
      {f >= B.a3.start - 20 && f <= swap + 32 && (
        <AbsoluteFill
          style={{
            opacity: f <= swap ? 1 : fade,
            background: `radial-gradient(circle at 50% 36%, #ffffff 0, #ffffff ${rad * 0.5}px, rgba(251,244,236,0.92) ${rad * 0.72}px, rgba(255,255,255,0) ${rad}px)`
          }}
        />
      )}

      <Audio src={staticFile('audio/apple-music.wav')} volume={(fr) => 0.55 * (1 - 0.5 * speaking(fr))} />
      <Audio src={staticFile('audio/apple-sfx.wav')} volume={(fr) => 0.9 * (1 - 0.35 * speaking(fr))} />
      {TL.beats.map((b) => (
        <Sequence key={b.id} from={b.v0} durationInFrames={b.vFrames + 4}>
          <Audio src={staticFile(b.file)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
