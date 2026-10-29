import React from 'react';
import {Easing} from 'remotion';
import {C, prog, sp} from '../theme';
import {Billboard} from '../three/bits';
import {PhoneModel} from '../three/PhoneModel';
import {Chip, TextPlane} from '../three/text';
import T from '../timing3.json';
import {FactCard, KeynoteCard, PhotoCard} from './cards';

export const KEYNOTES = [
  'Als Frau musst du doppelt so gut sein',
  'Führungshaltung vervielfacht Verhalten',
  'Ehrlichkeit als Diagnoseinstrument',
  'Im nächsten Leben wäre ich gerne ein Mann',
  'Wer bin ich, wenn niemand mehr entscheidet, wer ich sein soll?'
];

export const FACTS = [
  {big: '27', lines: ['Kaufmännische Leiterin', 'in der maritimen Branche']},
  {big: '30', lines: ['Niederlassungsleiterin', 'im Insolvenzbereich']},
  {big: '1 Jahr', lines: ['Unternehmen gekauft,', 'selbstständig gemacht']},
  {big: 'Vorsitz', lines: ['Wirtschaftsjunioren', 'Rostock']}
];

export const PORTRAIT_Z = -40;
export const FACTS_Z = [-76, -80.5, -85, -89.5];
export const GALLERY_C: [number, number, number] = [0, 0.1, -125];
export const GALLERY_R = 6.0;
export const PHONE_AT: [number, number, number] = [0, 0, -170];
export const CLOSING_Z = -260;

/** Scene 1: hero portrait card + the speaker's name in 3D type. */
export const PortraitWorld: React.FC<{f: number}> = ({f}) => {
  const {card, name, chips} = T.s1;
  const a = sp(f, card, 14, 80);
  const lineA = (i: number) => sp(f, name + i * 8, 11, 130);
  return (
    <group position={[0, 0, PORTRAIT_Z]}>
      <group position={[-1.45, 0.15 + Math.sin(f / 26) * 0.05, (1 - a) * 8]} rotation={[0, (1 - a) * 0.9 + 0.1, 0]} scale={Math.max(0.01, a) * 1.12}>
        <PhotoCard photo={1} w={2.5} h={3.3} />
      </group>
      {['Chris-Aike', 'Spring'].map((t, i) => {
        const s = lineA(i);
        if (f < name + i * 8) return null;
        return (
          <group key={t} position={[1.55 + (1 - s) * 2, 0.8 - i * 0.9, (1 - s) * 3]}>
            <TextPlane text={t} fontPx={140} weight={800} color={i ? C.copper : C.ink} layers={9} layerStep={0.014} layerColor={i ? C.copperDark : C.navy} unit={0.0027} opacity={Math.min(1, s * 1.5)} />
          </group>
        );
      })}
      {['Keynote-Speakerin', 'Female Leadership', 'Rostock'].map((t, i) => {
        const s = sp(f, chips[i], 9, 150);
        if (f < chips[i]) return null;
        return (
          <Billboard key={t} position={[1.5 + (1 - s) * 1.2, -1.05 - i * 0.62, 0.4]} scale={Math.max(0.01, s)}>
            <Chip text={t} fill={i === 1 ? C.copper : '#ffffff'} ink={i === 1 ? '#ffffff' : C.copper} unit={0.0031} />
          </Billboard>
        );
      })}
    </group>
  );
};

/** Scene 2: career stations as cards the camera slaloms through. */
export const FactsWorld: React.FC<{f: number}> = ({f}) => (
  <group>
    {FACTS.map((fc, i) => {
      const at = T.s2.cards[i];
      const a = sp(f, at, 11, 120);
      if (f < at) return null;
      const left = i % 2 === 0;
      return (
        <group
          key={fc.big}
          position={[(left ? -0.85 : 0.85) * (1 + (1 - a) * 0.8), (i % 2 ? -0.25 : 0.2) + (1 - a) * (left ? 1.6 : -1.6), FACTS_Z[i]]}
          rotation={[0, (left ? 0.28 : -0.28) + (1 - a) * (left ? 1.3 : -1.3), 0]}
          scale={Math.max(0.01, a) * 0.66}
        >
          <group position={[0, Math.sin(f / 22 + i) * 0.07, 0]}>
            <FactCard big={fc.big} lines={fc.lines} />
          </group>
        </group>
      );
    })}
  </group>
);

/** Scene 3: five photos on a ring around the camera, which pans from card to card. */
export const gallerySlot = (i: number) => {
  const th = (i * 72 * Math.PI) / 180;
  return {th, pos: [GALLERY_C[0] + GALLERY_R * Math.sin(th), GALLERY_C[1], GALLERY_C[2] - GALLERY_R * Math.cos(th)] as [number, number, number]};
};
const PHOTO_ORDER = [2, 5, 3, 4, 1];
export const GalleryWorld: React.FC<{f: number}> = ({f}) => (
  <group>
    {PHOTO_ORDER.map((p, i) => {
      const {th, pos} = gallerySlot(i);
      const at = T.s3.first + i * T.s3.step - 30;
      const a = sp(f, at, 12, 110);
      return (
        <group key={p} position={pos} rotation={[0, -th, 0]} scale={Math.max(0.01, a)}>
          <PhotoCard photo={p} w={2.5} h={3.3} />
        </group>
      );
    })}
  </group>
);

/** Scene 4: phone with the real profile recording; keynote titles pop in front of it one by one. */
export const KeynoteWorld: React.FC<{f: number}> = ({f}) => {
  const {rec, keynotes, keynoteLen} = T.s4;
  const enter = sp(f, T.s4.start + 10, 15, 70);
  return (
    <group position={PHONE_AT}>
      <group position={[0, -0.35 + (1 - enter) * -6 + Math.sin(f / 20) * 0.08, 0]} scale={(0.7 + enter * 0.3) * 0.82} rotation={[0, (1 - enter) * 1.1, 0]}>
        <PhoneModel seq="chris" frame={f - rec} count={270} />
      </group>
      {KEYNOTES.map((t, i) => {
        const s = keynotes[i];
        if (f < s - 2 || f > s + keynoteLen + 10) return null;
        const inn = sp(f, s, 10, 140);
        const out = prog(f, s + keynoteLen - 8, 8, Easing.in(Easing.cubic));
        return (
          <Billboard key={t} position={[PHONE_AT[0], PHONE_AT[1] - 1.4 + (1 - inn) * -0.8 + out * 0.5, PHONE_AT[2] + 3.4]} scale={Math.max(0.01, inn) * (1 - out * 0.15) * 0.66}>
            <KeynoteCard n={i + 1} title={t} opacity={1 - out} />
          </Billboard>
        );
      })}
    </group>
  );
};

/** Scene 7: closing name in 3D type. */
export const ClosingWorld: React.FC<{f: number}> = ({f}) => (
  <group position={[0, 0, CLOSING_Z]}>
    {['Chris-Aike', 'Spring'].map((t, i) => {
      const at = T.s7.lines[i];
      if (f < at) return null;
      const a = sp(f, at, 10, 130);
      return (
        <group key={t} position={[0, 2.25 - i * 1.05, (1 - a) * 5]} scale={Math.max(0.01, 1 + (1 - a) * 1.1)}>
          <TextPlane text={t} fontPx={150} weight={800} color={i ? C.copper : C.ink} layers={11} layerStep={0.016} layerColor={i ? C.copperDark : C.navy} unit={0.0041} opacity={Math.min(1, prog(f, at, 5, (x) => x))} />
        </group>
      );
    })}
  </group>
);
