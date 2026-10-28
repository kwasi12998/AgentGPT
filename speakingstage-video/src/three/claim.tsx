import React from 'react';
import {C, prog, sp} from '../theme';
import {TextPlane} from './text';

export const CLAIM_Z = -270;
const LINES = [
  {t: 'Ihre Bühne.', y: 1.4, color: C.ink},
  {t: 'Ihr Thema.', y: 0.78, color: C.ink},
  {t: 'Kostenlos.', y: 0.16, color: C.copper}
];

export const ClaimWorld: React.FC<{f: number; lines: number[]}> = ({f, lines}) => (
  <group position={[0, 0, CLAIM_Z]}>
    {LINES.map((l, i) => {
      if (f < lines[i]) return null;
      const a = sp(f, lines[i], 10, 130);
      const fade = Math.min(1, prog(f, lines[i], 5, (t) => t));
      return (
        <group key={l.t} position={[0, l.y, (1 - a) * 5]} scale={Math.max(0.01, 1 + (1 - a) * 1.2)}>
          <TextPlane text={l.t} fontPx={150} weight={800} color={l.color} layers={11} layerStep={0.016} layerColor={i === 2 ? C.copperDark : C.navy} unit={0.0034} opacity={fade} />
        </group>
      );
    })}
  </group>
);
