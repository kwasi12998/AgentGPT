import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, prog, sp} from './theme';

export const Headline: React.FC<{
  lines: {text: string; accent?: boolean}[];
  from: number;
  to: number;
  sub?: string;
  top?: number;
  size?: number;
}> = ({lines, from, to, sub, top = 190, size = 104}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const exit = prog(f, to - 9, 9);
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top,
        textAlign: 'center',
        fontFamily: FONT,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 30}px)`
      }}
    >
      {lines.map((l, i) => {
        const s = sp(f, from + i * 5, 16, 140);
        return (
          <div
            key={i}
            style={{
              fontSize: size,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2.5,
              color: l.accent ? C.copper : C.ink,
              opacity: Math.min(1, s * 1.4),
              transform: `translateY(${(1 - s) * 50}px)`
            }}
          >
            {l.text}
          </div>
        );
      })}
      {sub && (
        <div
          style={{
            marginTop: 26,
            fontSize: 40,
            fontWeight: 500,
            color: C.gray,
            opacity: prog(f, from + 14, 14)
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};
