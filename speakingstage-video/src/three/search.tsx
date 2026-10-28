import React from 'react';
import {C, prog, sp} from '../theme';
import {Billboard} from './bits';
import {Chip} from './text';
import {PhoneModel} from './PhoneModel';

const CHIPS = [
  {t: 'KI', p: [-1.2, 1.9, 1.6]},
  {t: 'Leadership', p: [1.1, 0.7, 2.0]},
  {t: 'Transformation', p: [-0.85, -0.6, 1.3]},
  {t: 'Nachhaltigkeit', p: [0.8, -1.9, 1.8]}
] as const;

export const SearchWorld: React.FC<{f: number; start: number; rec: number; chips: number[]}> = ({f, start, rec, chips}) => {
  const enter = sp(f, start + 6, 16, 70);
  const bob = Math.sin(f / 18) * 0.12;
  return (
    <group position={[0, -0.15 + bob, -40]}>
      <group position={[0, (1 - enter) * -7, 0]} scale={0.6 + enter * 0.4} rotation={[0, (1 - enter) * 1.2, 0]}>
        <PhoneModel seq="search" frame={f - rec} count={150} />
      </group>
      {CHIPS.map((c, i) => {
        const a = sp(f, chips[i], 9, 150);
        if (f < chips[i]) return null;
        return (
          <Billboard key={c.t} position={[c.p[0] * (0.5 + 0.5 * a), c.p[1] + Math.sin(f / 14 + i * 1.7) * 0.18, c.p[2]]} scale={Math.max(0.01, a)}>
            <Chip text={c.t} fill={i % 2 ? '#ffffff' : C.cream} unit={0.0026} />
          </Billboard>
        );
      })}
    </group>
  );
};
