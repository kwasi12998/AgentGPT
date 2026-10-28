import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from './timing2.json';
import {C, FONT, prog} from './theme';
import {Headline} from './Headline';
import {CameraRig, ease, Key, Pose, sampleKeys, shake, V3} from './three/camera';
import {Particles} from './three/bits';
import {IntroWorld} from './three/intro';
import {SearchWorld} from './three/search';
import {CorridorWorld} from './three/corridor';
import {MapWorld, headAt} from './three/map';
import {StageWorld, STAGE_Z} from './three/stage';
import {ClaimWorld} from './three/claim';
import {ClaimOverlay, Notification, SpeedLines, Tracker, TrustStrip} from './overlays';

const keysAC: Key[] = [
  {f: 0, pos: [1.6, 0.8, 26], target: [0, 0.5, 0], roll: 8, fov: 34},
  {f: 98, pos: [0.2, 0.2, 11.5], target: [0, 0.5, 0], roll: 0, fov: 34, ease: ease.out},
  {f: 128, pos: [-5.6, -1.8, -26], target: [0, 0.9, -40], roll: -6, fov: 36, ease: ease.inOutQuint},
  {f: 195, pos: [0.4, -0.6, -27.8], target: [0, 0.9, -40], roll: 0, fov: 34},
  {f: 262, pos: [4.8, 0.9, -29.4], target: [0, 1.0, -40], roll: 4, fov: 34},
  {f: 288, pos: [0.05, 1.9, -37.2], target: [0, 1.7, -40.3], roll: 0, fov: 24, ease: ease.inQuint},
  {f: 289, pos: [0, 0.1, -64], target: [0, 0, -84], roll: 0, fov: 34, cut: true},
  {f: 410, pos: [0.15, 0.2, -97], target: [0, 0, -118], roll: -2.5, fov: 34},
  {f: 530, pos: [0, 0.1, -131], target: [0, 0.2, -146], roll: 0, fov: 34},
  {f: 590, pos: [-3.8, 0.9, -135], target: [0, 1.0, -146], roll: 3, fov: 34},
  {f: 660, pos: [2.4, 0.6, -136.5], target: [0, 1.3, -146], roll: -2, fov: 30},
  {f: 715, pos: [3.4, 0.6, -136], target: [0, 0.9, -147], roll: 2, fov: 34},
  {f: 764, pos: [0, 0.9, -128.5], target: [0, 0, -156], roll: 0, fov: 38}
];
const keysF: Key[] = [
  {f: 934, pos: [0.1, 1.7, -219.5], target: [0, 2.4, -245], roll: 0, fov: 42},
  {f: 1030, pos: [0, 2.4, -235], target: [0, 1.6, -245.5], roll: 0, fov: 34, ease: ease.inOutSine}
];
const keysG: Key[] = [
  {f: 1046, pos: [0.7, -0.9, -259.5], target: [0, -0.94, -270], roll: 2, fov: 34},
  {f: 1200, pos: [0, -0.9, -256.5], target: [0, -0.94, -270], roll: 0, fov: 34}
];

const MAP_ESTAB: Pose = {pos: [0, 30, -167], target: [0, 0, -190], roll: 0, fov: 42};

const mix = (a: Pose, b: Pose, t: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l3 = (x: V3, y: V3): V3 => [l(x[0], y[0]), l(x[1], y[1]), l(x[2], y[2])];
  return {pos: l3(a.pos, b.pos), target: l3(a.target, b.target), roll: l(a.roll, b.roll), fov: l(a.fov, b.fov)};
};

const poseE = (f: number): Pose => {
  if (f < 790) return MAP_ESTAB;
  const head = headAt(f, T.s4.cities);
  const lag = headAt(f - 12, T.s4.cities);
  const th = -0.9 + (f - 790) * 0.012;
  const chase: Pose = {pos: [lag.x + Math.sin(th) * 7.5, 7.2, lag.z + Math.cos(th) * 8.5], target: [head.x, 0.4, head.z - 0.4], roll: Math.sin((f - 790) / 30) * 2, fov: 36};
  return mix(MAP_ESTAB, chase, ease.inOut(Math.min(1, (f - 790) / 24)));
};

export const cameraAt = (f: number): Pose => {
  let p: Pose;
  if (f <= 764) p = sampleKeys(f, keysAC);
  else if (f <= 792) p = mix(sampleKeys(764, keysAC), poseE(792), ease.inOutQuint((f - 764) / 28));
  else if (f <= 906) p = poseE(f);
  else if (f <= 934) p = mix(poseE(906), sampleKeys(934, keysF), ease.inOutQuint((f - 906) / 28));
  else if (f <= 1030) p = sampleKeys(f, keysF);
  else if (f <= 1050) p = mix(sampleKeys(1030, keysF), sampleKeys(1050, keysG), ease.inOutQuint((f - 1030) / 20));
  else p = sampleKeys(f, keysG);
  const s = shake(f, f > 1044 && f < 1062 ? 0.12 : 0.012);
  return {...p, pos: [p.pos[0] + s[0], p.pos[1] + s[1], p.pos[2]]};
};

const speedOf = (f: number) => {
  const a = cameraAt(f).pos;
  const b = cameraAt(f - 1).pos;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

const between = (f: number, a: number, b: number) => f >= a && f <= b;

export const SpeakerV2: React.FC = () => {
  const f = useCurrentFrame();
  const pose = cameraAt(f);
  const speed = speedOf(f);
  const flying = between(f, 96, 132) || between(f, 254, 292) || between(f, 762, 798) || between(f, 902, 938) || between(f, 1026, 1052);
  const blur = flying ? Math.min(16, Math.max(0, (speed - 0.35) * 14)) : 0;
  const flash = Math.max(prog(f, 282, 7, (t) => t) * (1 - prog(f, 289, 8, (t) => t)), 0);
  const impact = Math.max(1 - prog(f, 1046, 10, (t) => t), 0) * (f >= 1046 ? 1 : 0);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <AbsoluteFill style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
        <ThreeCanvas width={1080} height={1920} camera={{fov: 36, near: 0.1, far: 400, position: [0, 0, 10]}}>
          <color attach="background" args={['#ffffff']} />
          <fog attach="fog" args={['#ffffff', 16, 72]} />
          <ambientLight intensity={1.15} />
          <directionalLight position={[4, 8, 6]} intensity={2.4} />
          <pointLight position={[-6, 3, 4]} intensity={40} color={C.copperLight} />
          <CameraRig pose={pose} />
          <Particles count={900} />
          {f < 140 && <IntroWorld f={f} hit={T.s0.hit} wordmark={T.s0.wordmark} />}
          {between(f, 112, 292) && <SearchWorld f={f} start={T.s1.start} rec={T.s1.rec} chips={T.s1.chips} />}
          {between(f, 285, 790) && <CorridorWorld f={f} cfg={T} />}
          {between(f, 760, 940) && <MapWorld f={f} cities={T.s4.cities} start={T.s4.start} />}
          {between(f, 905, 1050) && <StageWorld f={f} start={T.s5.start} landing={T.s5.landing} />}
          {f >= 1040 && <ClaimWorld f={f} lines={T.s6.lines} />}
        </ThreeCanvas>
      </AbsoluteFill>

      <SpeedLines amount={(blur - 2) / 10} />

      {/* soft white fades keep headlines and counters readable over 3D cards */}
      {between(f, 292, 1040) && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 520, background: 'linear-gradient(#ffffff 0%, #ffffffd9 50%, #ffffff00 100%)', opacity: Math.min(1, prog(f, 292, 10) * (1 - prog(f, 1030, 10)))}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'linear-gradient(#ffffff00 0%, #ffffffd9 60%, #ffffff 100%)', opacity: between(f, 330, 520) ? 1 : 0}} />
        </>
      )}

      {/* intro tagline */}
      {between(f, 66, 104) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', fontFamily: FONT, fontSize: 46, fontWeight: 600, letterSpacing: 1, color: C.copper, opacity: prog(f, 66, 14) * (1 - prog(f, 94, 9)), transform: `translateY(${(1 - prog(f, 66, 14)) * 24}px)`}}>
          Die Bühne für Keynote Speaker
        </div>
      )}

      <Headline from={T.s1.start + 8} to={206} lines={[{text: 'Veranstalter'}, {text: 'suchen Speaker.'}]} />
      <Headline from={206} to={266} lines={[{text: 'Und Sie?'}, {text: 'Noch nicht gefunden.', accent: true}]} size={92} />
      <Headline from={T.s2.start + 8} to={425} lines={[{text: 'Bereits'}, {text: 'gelistet.', accent: true}]} sub="Auch bekannte Namen." />
      <Headline from={430} to={522} lines={[{text: 'Bekannte Namen'}, {text: 'bei uns gelistet.', accent: true}]} size={90} />
      <TrustStrip />
      <Headline from={T.s3.start + 6} to={702} lines={[{text: 'Profil einreichen.'}, {text: 'Kostenlos.', accent: true}]} sub="Dauert ca. 1 Minute." />
      <Headline from={704} to={768} lines={[{text: 'Und schon sind'}, {text: 'Sie dabei.', accent: true}]} />
      <Headline from={T.s4.start + 4} to={T.s4.steps.live - 2} lines={[{text: 'Wir prüfen'}, {text: 'Ihr Profil.', accent: true}]} sub="Persönlich. Meist in wenigen Tagen." />
      <Headline from={T.s4.steps.live - 2} to={T.s4.steps.anfrage - 2} lines={[{text: 'Ihr Profil'}, {text: 'geht live.', accent: true}]} sub="Bei Google und in unserer KI-Suche." />
      <Headline from={T.s4.steps.anfrage - 2} to={T.s4.end - 2} lines={[{text: 'Anfragen aus'}, {text: 'dem DACH-Raum.', accent: true}]} size={92} />
      <Tracker />
      <Headline from={T.s5.start + 8} to={T.s5.notify - 4} lines={[{text: 'Dann kommt'}, {text: 'die Anfrage.', accent: true}]} top={200} />
      <Notification />
      <ClaimOverlay />

      <AbsoluteFill style={{background: '#ffffff', opacity: Math.min(1, flash * 1.1 + impact * 0.35), pointerEvents: 'none'}} />
      <Audio src={staticFile('audio/music2.wav')} volume={0.55} />
      <Audio src={staticFile('audio/sfx2.wav')} volume={0.9} />
    </AbsoluteFill>
  );
};
