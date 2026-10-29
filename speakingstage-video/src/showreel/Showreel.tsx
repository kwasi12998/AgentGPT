import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../timing3.json';
import {C, FONT, prog, sp} from '../theme';
import {Headline} from '../Headline';
import {LayoutCtx} from '../layout';
import {SpeedLines} from '../overlays';
import {CameraRig, ease, Key, Pose, sampleKeys, shake, V3} from '../three/camera';
import {Particles} from '../three/bits';
import {IntroWorld} from '../three/intro';
import {MapWorld, cityWorld} from '../three/map';
import {ClosingWorld, FactsWorld, GALLERY_C, GalleryWorld, KeynoteWorld, PortraitWorld} from './worlds';

const SQUARE = {wide: false, w: 1080, h: 1080};
const CITY = T.s6.city;
const R = cityWorld(CITY);

const keysA: Key[] = [
  {f: 0, pos: [1.0, 0.5, 16], target: [0, 0.5, 0], roll: 6, fov: 34},
  {f: 60, pos: [0.15, 0.2, 7.6], target: [0, 0.5, 0], roll: 0, fov: 34, ease: ease.out}
];
const keysB: Key[] = [
  {f: 92, pos: [-3.2, 0.4, -30.5], target: [0.1, 0.1, -40], roll: -4, fov: 34},
  {f: 150, pos: [0.2, 0.1, -30.8], target: [0, 0.1, -40], roll: 0, fov: 34},
  {f: 214, pos: [2.8, 0.5, -31.5], target: [0, 0.1, -40], roll: 3, fov: 34}
];
const keysC: Key[] = [
  {f: 244, pos: [0, 0.1, -68.5], target: [0, 0, -82], roll: 0, fov: 34},
  {f: 386, pos: [0, 0.15, -85], target: [0, 0, -100], roll: -2, fov: 34}
];
const keysE: Key[] = [
  {f: 576, pos: [-4.8, 0.5, -160.8], target: [0, 0.1, -170], roll: -3, fov: 34},
  {f: 660, pos: [0.4, 0.3, -160.0], target: [0, 0.1, -170], roll: 0, fov: 34},
  {f: 756, pos: [4.6, 0.6, -161.3], target: [0, 0.1, -170], roll: 3, fov: 34}
];
const keysF: Key[] = [
  {f: 786, pos: [0, 0, -208], target: [0, 0, -230], roll: 0, fov: 34},
  {f: 906, pos: [0.4, 0.2, -221], target: [0, 0, -240], roll: 1, fov: 34}
];
const keysH: Key[] = [
  {f: 1054, pos: [0.4, 0.15, -250.5], target: [0, 0.1, -260], roll: 2, fov: 34},
  {f: 1200, pos: [0, 0.15, -249], target: [0, 0.1, -260], roll: 0, fov: 34}
];

const galleryPose = (f: number): Pose => {
  const {first, step, turn} = T.s3;
  const n = Math.max(0, f - first);
  const k = Math.min(4, Math.floor(n / step));
  const frac = n - k * step;
  const u = k + (k < 4 ? ease.inOut(Math.min(1, Math.max(0, (frac - turn[0]) / turn[1]))) : 0);
  const psi = (u * 72 * Math.PI) / 180;
  const sw = Math.sin(f / 7) * 0.01;
  return {pos: [GALLERY_C[0], GALLERY_C[1], GALLERY_C[2]], target: [GALLERY_C[0] + 10 * Math.sin(psi + sw), GALLERY_C[1], GALLERY_C[2] - 10 * Math.cos(psi + sw)], roll: Math.sin(psi * 5) * 1.2, fov: 34};
};

const mapPose = (f: number): Pose => {
  const t = ease.inOut(Math.min(1, Math.max(0, (f - 936) / 90)));
  const l = (a: number, b: number) => a + (b - a) * t;
  return {pos: [R.x + l(7, 3.4), l(11, 5.6), R.z + l(11, 6.4)], target: [R.x, l(0, 0.9), R.z + l(0, -1.5)], roll: 0, fov: 36};
};

const SEGMENTS: {a: number; b: number; fn: (f: number) => Pose}[] = [
  {a: 0, b: 60, fn: (f) => sampleKeys(f, keysA)},
  {a: 92, b: 214, fn: (f) => sampleKeys(f, keysB)},
  {a: 244, b: 386, fn: (f) => sampleKeys(f, keysC)},
  {a: 416, b: 546, fn: galleryPose},
  {a: 576, b: 756, fn: (f) => sampleKeys(f, keysE)},
  {a: 786, b: 906, fn: (f) => sampleKeys(f, keysF)},
  {a: 936, b: 1026, fn: mapPose},
  {a: 1054, b: 1200, fn: (f) => sampleKeys(f, keysH)}
];

const mix = (p: Pose, q: Pose, t: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l3 = (x: V3, y: V3): V3 => [l(x[0], y[0]), l(x[1], y[1]), l(x[2], y[2])];
  return {pos: l3(p.pos, q.pos), target: l3(p.target, q.target), roll: l(p.roll, q.roll), fov: l(p.fov, q.fov)};
};

export const cameraAt = (f: number): Pose => {
  let p: Pose = SEGMENTS[0].fn(SEGMENTS[0].a);
  for (let i = 0; i < SEGMENTS.length; i++) {
    const s = SEGMENTS[i];
    if (f <= s.b) {
      if (f >= s.a) p = s.fn(f);
      else {
        const prev = SEGMENTS[i - 1];
        p = mix(prev.fn(prev.b), s.fn(s.a), ease.inOutQuint((f - prev.b) / (s.a - prev.b)));
      }
      break;
    }
    p = s.fn(s.b);
  }
  const sh = shake(f, f > 1056 && f < 1074 ? 0.1 : 0.01);
  return {...p, pos: [p.pos[0] + sh[0], p.pos[1] + sh[1], p.pos[2]]};
};

const flying = (f: number) => T.flights.some(([a, b]) => f >= a && f <= b);
const speedOf = (f: number) => {
  const a = cameraAt(f).pos;
  const b = cameraAt(f - 1).pos;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};
const between = (f: number, a: number, b: number) => f >= a && f <= b;

const QUOTE = ['„Als Frau musst du doppelt', 'so gut sein, damit ein Mann', 'anerkennt, dass du halb so', 'gut bist wie er.“'];

const Quote: React.FC<{f: number}> = ({f}) => {
  if (!between(f, T.s5.start + 8, T.s5.end - 2)) return null;
  const exit = prog(f, T.s5.end - 14, 12);
  let idx = 0;
  const attrib = sp(f, T.s5.words + 30 * T.s5.wordStep + 6, 14, 110);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - exit, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 40, top: 60, fontSize: 520, fontWeight: 800, color: C.copper, opacity: 0.16 * sp(f, T.s5.start + 8, 20, 60), lineHeight: 1}}>„</div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 340, textAlign: 'center'}}>
        {QUOTE.map((line, li) => (
          <div key={li} style={{fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.18, color: C.ink}}>
            {line.split(' ').map((w, wi) => {
              const at = T.s5.words + idx++ * T.s5.wordStep;
              const s = sp(f, at, 13, 150);
              return (
                <span key={wi} style={{display: 'inline-block', marginRight: 16, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 34}px)`, color: /doppelt|halb/.test(w) ? C.copper : C.ink}}>
                  {w}
                </span>
              );
            })}
          </div>
        ))}
        <div style={{marginTop: 38, fontSize: 40, fontWeight: 700, color: C.gray, opacity: attrib, transform: `translateY(${(1 - attrib) * 20}px)`}}>
          Chris-Aike Spring
        </div>
      </div>
    </div>
  );
};

const Pill: React.FC<{children: React.ReactNode; at: number; f: number; fill?: string; ink?: string; size?: number}> = ({children, at, f, fill = '#fff', ink = C.copper, size = 38}) => {
  const s = sp(f, at, 11, 150);
  if (f < at) return null;
  return (
    <span style={{display: 'inline-block', margin: '8px 10px', padding: '12px 30px', borderRadius: 50, background: fill, color: ink, border: `2px solid ${C.line}`, boxShadow: '0 12px 30px rgba(22,33,49,0.14)', fontWeight: 700, fontSize: size, opacity: Math.min(1, s * 1.5), transform: `scale(${0.7 + 0.3 * Math.min(1.1, s)})`}}>
      {children}
    </span>
  );
};

export const ShowreelChris: React.FC = () => {
  const f = useCurrentFrame();
  const pose = cameraAt(f);
  const blur = flying(f) ? Math.min(14, Math.max(0, (speedOf(f) - 0.35) * 12)) : 0;
  const fadeTop = (between(f, 246, 400) || between(f, 570, 770) || between(f, 934, 1040)) ? 1 : 0;
  return (
    <LayoutCtx.Provider value={SQUARE}>
      <AbsoluteFill style={{background: '#fff'}}>
        <AbsoluteFill style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
          <ThreeCanvas width={1080} height={1080} camera={{fov: 34, near: 0.1, far: 400, position: [0, 0, 10]}}>
            <color attach="background" args={['#ffffff']} />
            <fog attach="fog" args={['#ffffff', 16, 72]} />
            <ambientLight intensity={1.15} />
            <directionalLight position={[4, 8, 6]} intensity={2.4} />
            <pointLight position={[-6, 3, 4]} intensity={40} color={C.copperLight} />
            <CameraRig pose={pose} width={1080} height={1080} />
            <Particles count={900} zTo={-300} />
            {f < 100 && <IntroWorld f={f} hit={T.s0.hit} wordmark={T.s0.wordmark} />}
            {between(f, 80, 246) && <PortraitWorld f={f} />}
            {between(f, 236, 400) && <FactsWorld f={f} />}
            {between(f, 388, 560) && <GalleryWorld f={f} />}
            {between(f, 550, 770) && <KeynoteWorld f={f} />}
            {between(f, 920, 1040) && <MapWorld f={f} cities={[CITY]} start={T.s6.start} />}
            {f >= 1030 && <ClosingWorld f={f} />}
          </ThreeCanvas>
        </AbsoluteFill>

        <SpeedLines amount={(blur - 2) / 10} />

        {fadeTop ? <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: 'linear-gradient(#ffffff 0%, #ffffffd9 55%, #ffffff00 100%)'}} /> : null}

        {/* S1 label */}
        {between(f, 100, 226) && (
          <div style={{position: 'absolute', left: 60, top: 56, fontFamily: FONT, fontSize: 30, fontWeight: 700, letterSpacing: 8, color: C.copper, opacity: prog(f, 100, 12) * (1 - prog(f, 214, 10))}}>SHOWREEL</div>
        )}
        <Headline from={252} to={392} top={46} size={72} lines={[{text: 'Früh Karriere'}, {text: 'gemacht.', accent: true}]} />
        {between(f, 436, 548) && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', fontFamily: FONT, opacity: prog(f, 436, 10) * (1 - prog(f, 538, 8))}}>
            <span style={{display: 'inline-block', padding: '16px 42px', borderRadius: 60, background: '#ffffffee', border: `2px solid ${C.line}`, boxShadow: '0 20px 50px rgba(22,33,49,0.2)', fontSize: 44, fontWeight: 800, color: C.ink}}>
              Klartext. <span style={{color: C.copper}}>Substanz. Haltung.</span>
            </span>
          </div>
        )}
        <Headline from={572} to={760} top={46} size={72} lines={[{text: 'Fünf Keynotes.', accent: false}]} sub="Female Leadership · Resilienz · Führung" />
        <Quote f={f} />
        <Headline from={940} to={1032} top={46} size={72} lines={[{text: 'Verfügbarkeit'}, {text: 'auf Anfrage.', accent: true}]} />
        {between(f, 970, 1036) && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', fontFamily: FONT, opacity: 1 - prog(f, 1026, 8)}}>
            {['Rostock', 'Deutsch', '20–60 Min. Vortrag'].map((t, i) => (
              <Pill key={t} f={f} at={T.s6.chips[i]} size={34}>{t}</Pill>
            ))}
          </div>
        )}
        {f >= T.s7.chips[0] - 6 && (
          <>
            <div style={{position: 'absolute', left: 40, right: 40, top: 468, textAlign: 'center', fontFamily: FONT}}>
              {['Female Leadership', 'Resilienz', 'Mitarbeiterführung', 'Networking'].map((t, i) => (
                <Pill key={t} f={f} at={T.s7.chips[i]} size={36} fill={i === 0 ? C.copper : '#fff'} ink={i === 0 ? '#fff' : C.copper}>{t}</Pill>
              ))}
            </div>
            <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 280, top: 676, width: 520, height: 87, opacity: Math.min(1, sp(f, T.s7.wordmark, 14, 120) * 1.5), transform: `translateY(${(1 - sp(f, T.s7.wordmark, 14, 120)) * 30}px)`}} />
            <div style={{position: 'absolute', left: 210, width: 660, top: 794, height: 112, borderRadius: 56, background: C.copper, overflow: 'hidden', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: FONT, fontSize: 46, fontWeight: 800, boxShadow: `0 22px 54px ${C.copper}66`, opacity: Math.min(1, sp(f, T.s7.button, 9, 150) * 1.5), transform: `scale(${0.7 + sp(f, T.s7.button, 9, 150) * 0.3 + Math.sin(f / 10) * 0.007})`}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, width: 110, left: `${-20 + ((((f - T.s7.button - 14) % 60) + 60) % 60 / 60) * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-20deg)'}} />
              Speaker anfragen  →
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 940, textAlign: 'center', fontFamily: FONT, fontSize: 34, fontWeight: 600, color: C.navy, opacity: prog(f, T.s7.url, 12)}}>speakingstage.com/speaker/chris-aike-spring</div>
          </>
        )}

        <Audio src={staticFile('audio/showreel-music.wav')} volume={0.6} />
        <Audio src={staticFile('audio/showreel-sfx.wav')} volume={0.9} />
      </AbsoluteFill>
    </LayoutCtx.Provider>
  );
};
