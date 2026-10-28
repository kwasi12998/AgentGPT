import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from './theme';

const blobs = [
  {x: 160, y: 420, r: 340, p: 0},
  {x: 900, y: 880, r: 420, p: 1.7},
  {x: 300, y: 1500, r: 380, p: 3.1},
  {x: 860, y: 1700, r: 300, p: 4.4}
];

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x + Math.sin(f / 70 + b.p) * 40 - b.r,
            top: b.y + Math.cos(f / 85 + b.p) * 50 - b.r,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.copperLight}30 0%, ${C.copperLight}00 70%)`
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
