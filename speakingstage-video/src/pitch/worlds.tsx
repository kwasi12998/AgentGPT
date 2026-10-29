import React from 'react';
import {Easing} from 'remotion';
import {C, prog} from '../theme';
import {PingRing} from '../three/bits';
import {Chip, TextPlane} from '../three/text';
import {PhotoCard} from '../showreel/cards';
import {B} from '../pitch-timeline';
import {Crowd, FlipCard, HERO_CELL, LabelCard, Person, STYLE, crowdCell} from './gfx';

/** frame at fraction `frac` of a beat's voice-over */
export const u = (id: string, frac: number) => B[id].v0 + frac * B[id].vFrames;
const out3 = Easing.out(Easing.cubic);
const inOut3 = Easing.inOut(Easing.cubic);
const rise = (f: number, at: number, dur = 16) => prog(f, at, dur, out3);

export const Z = {b3: -60, b4: -100, b5: -140, b6: -180, flip: -220, b10: -260, b11: -300};

/** Pain 1: capable people become order takers, and the ones who speak up leave. */
export const CrowdWorld: React.FC<{f: number}> = ({f}) => {
  const [hx, hz] = crowdCell(HERO_CELL.c, HERO_CELL.r);
  const hero = rise(f, B.b3.start + 8 + HERO_CELL.r * 7, 14);
  const leave = prog(f, u('b3', 0.62), 46, Easing.in(Easing.cubic));
  const gap = rise(f, u('b3', 0.66), 20);
  return (
    <group position={[0, 0, Z.b3]}>
      <mesh position={[0, -0.02, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.6, 64]} />
        <meshBasicMaterial color={C.cream} toneMapped={false} />
      </mesh>
      <Crowd f={f} start={B.b3.start + 8} color="#b4bcc7" />
      <group position={[hx - leave * 6.4, 0, hz]} scale={Math.max(0.001, hero)}>
        <Person color={C.copper} emissive={C.copperLight} />
      </group>
      <mesh position={[hx, 0.01, hz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.56, 48]} />
        <meshBasicMaterial color={C.copper} transparent opacity={0.65 * gap} depthWrite={false} toneMapped={false} />
      </mesh>
      <PingRing position={[hx, 0.02, hz]} t={prog(f, u('b3', 0.5), 40, (t) => t)} size={2.6} />
    </group>
  );
};

/** Pain 2: every tool is in place, one slot stays empty. */
export const ToolsWorld: React.FC<{f: number}> = ({f}) => {
  const tools = ['Methoden', 'Tools', 'Frameworks', 'Leitbild'];
  const dim = 1 - 0.35 * prog(f, u('b4', 0.55), 20);
  const slot = rise(f, u('b4', 0.4), 18);
  const pulse = 0.5 + 0.5 * Math.sin((f - u('b4', 0.55)) / 9);
  return (
    <group position={[0, 0, Z.b4]}>
      {tools.map((t, i) => {
        const a = rise(f, u('b4', 0.04 + i * 0.1), 16);
        if (a <= 0) return null;
        return (
          <group key={t} position={[-1.45 - (1 - a) * 1.4, 1.35 - i * 0.9, 0]}>
            <LabelCard text={t} w={2.2} h={0.78} style={STYLE.gray} screenPx={46} check opacity={a * dim} />
          </group>
        );
      })}
      {slot > 0 && (
        <group position={[1.45, 0, 0]} scale={0.9 + 0.1 * slot}>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[2.7, 2.6]} />
            <meshBasicMaterial color={C.copperLight} transparent opacity={slot * (0.1 + 0.12 * pulse) * (f > u('b4', 0.55) ? 1 : 0.4)} depthWrite={false} />
          </mesh>
          <LabelCard text="Haltung?" w={2.2} h={2.1} style={STYLE.slot} screenPx={58} opacity={slot} />
        </group>
      )}
    </group>
  );
};

/** What the organiser needs: the copper card is revealed as the clichés are swiped away. */
export const SlidesWorld: React.FC<{f: number}> = ({f}) => {
  const words = ['Durchhalteparolen', 'Floskeln', 'Folienschlacht'];
  const reveal = rise(f, u('b5', 0.1), 20);
  return (
    <group position={[0, 0, Z.b5]}>
      <group position={[0, 0, -0.3]} scale={0.94 + 0.06 * reveal}>
        <LabelCard text="Klartext. Substanz." sub="Eine Keynote mit Haltung" w={3.6} h={1.9} style={STYLE.copper} screenPx={64} opacity={reveal} />
      </group>
      {words.map((t, i) => {
        const swipe = prog(f, u('b5', 0.5 + i * 0.1), 20, Easing.in(Easing.cubic));
        const a = rise(f, B.b5.start + 6 + i * 4, 12);
        if (swipe >= 1 || a <= 0) return null;
        return (
          <group key={t} position={[swipe * 6.4 + (i - 1) * 0.12, 0.2 - i * 0.2 + swipe * 0.5, 0.15 * (i + 1)]} rotation={[0, 0, -swipe * 0.45 + (1 - i) * 0.035]}>
            <LabelCard text={t} w={3.6} h={1.9} style={STYLE.gray} screenPx={58} opacity={a} />
          </group>
        );
      })}
    </group>
  );
};

/** The solution: Chris-Aike Spring. */
export const ChrisWorld: React.FC<{f: number}> = ({f}) => {
  const a = rise(f, B.b6.start + 12, 22);
  const lines = ['Chris-Aike', 'Spring'];
  return (
    <group position={[0, 0, Z.b6]}>
      <group position={[-1.35 - (1 - a) * 1.2, 0.1, 0]} scale={Math.max(0.01, a)}>
        <PhotoCard photo={1} w={2.55} h={3.3} />
      </group>
      {lines.map((t, i) => {
        const s = rise(f, B.b6.v0 + 2 + i * 8, 18);
        if (s <= 0) return null;
        return (
          <group key={t} position={[1.45 + (1 - s) * 1.4, 1.2 - i * 0.78, 0]}>
            <TextPlane text={t} fontPx={140} weight={800} color={i ? C.copper : C.ink} layers={9} layerStep={0.014} layerColor={i ? C.copperDark : C.navy} unit={0.0024} opacity={s} />
          </group>
        );
      })}
      {['Keynote-Speakerin', 'Female Leadership'].map((t, i) => {
        const s = rise(f, B.b6.v0 + 20 + i * 8, 14);
        if (s <= 0) return null;
        return (
          <group key={t} position={[1.45, -0.3 - i * 0.62, 0]} scale={0.8 + 0.2 * s}>
            <Chip text={t} fill={i ? C.copper : '#ffffff'} ink={i ? '#ffffff' : C.copper} unit={0.0029} opacity={s} />
          </group>
        );
      })}
    </group>
  );
};

const PAIRS = [
  {pain: 'Blinde Flecken', title: 'Ehrlichkeit als Diagnoseinstrument', sub: 'Räume, in denen Führung neu gedacht wird', beat: 'b7'},
  {pain: 'Führung ohne Haltung', title: 'Führungshaltung vervielfacht Verhalten', sub: 'Integrität · Selbstreflexion · Vorbild', beat: 'b8'},
  {pain: 'Unsichtbare Bewertungsmaßstäbe', title: 'Als Frau musst du doppelt so gut sein', sub: 'Hürden weiblicher Führung sichtbar machen', beat: 'b9'}
];

/** Problem cards that flip over into her keynotes, one per voice-over segment. */
export const FlipWorld: React.FC<{f: number}> = ({f}) => (
  <group position={[0, 0, Z.flip]}>
    {PAIRS.map((p, i) => {
      const a = rise(f, B.b7.v0 - 6 + i * 6, 16);
      const flip = prog(f, u(p.beat, 0.12), 26, inOut3);
      if (a <= 0) return null;
      return (
        <group key={p.pain} position={[0, 1.45 - i * 1.55, 0]} scale={0.9 + 0.1 * a}>
          <FlipCard pain={p.pain} title={p.title} sub={p.sub} w={3.8} h={1.4} flip={flip} />
        </group>
      );
    })}
  </group>
);

/** Three stage photos, always fully in frame. */
export const PhotosWorld: React.FC<{f: number}> = ({f}) => (
  <group position={[0, 0, Z.b10]}>
    {[2, 3, 5].map((p, i) => {
      const a = rise(f, B.b10.v0 + 4 + i * 8, 20);
      if (a <= 0) return null;
      return (
        <group key={p} position={[(i - 1) * 1.95, -0.4 + (1 - a) * -0.8, 0]} rotation={[0, (1 - i) * 0.1, 0]} scale={0.9 + 0.1 * a}>
          <PhotoCard photo={p} w={1.75} h={2.75} />
        </group>
      );
    })}
  </group>
);

/** Closing: the name in 3D type. */
export const CtaWorld: React.FC<{f: number}> = ({f}) => (
  <group position={[0, 0, Z.b11]}>
    {['Chris-Aike', 'Spring'].map((t, i) => {
      const at = B.b11.v0 + i * 10;
      const a = rise(f, at, 18);
      if (a <= 0) return null;
      return (
        <group key={t} position={[0, 2.25 - i * 1.05, (1 - a) * 3]}>
          <TextPlane text={t} fontPx={150} weight={800} color={i ? C.copper : C.ink} layers={11} layerStep={0.016} layerColor={i ? C.copperDark : C.navy} unit={0.0041} opacity={a} />
        </group>
      );
    })}
  </group>
);
