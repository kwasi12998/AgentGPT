import React from 'react';
import {useLF} from './warp-ctx';
import {C, FONT, prog, sp} from './theme';
import {useLayout} from './layout';

export const Headline: React.FC<{
  lines: {text: string; accent?: boolean}[];
  from: number;
  to: number;
  sub?: string;
  top?: number;
  size?: number;
}> = ({lines, from, to, sub, top = 190, size = 104}) => {
  const f = useLF();
  const {wide} = useLayout();
  if (f < from || f > to) return null;
  const exit = prog(f, to - 9, 9);
  const fs = wide ? size * 0.9 : size;
  return (
    <div
      style={{
        position: 'absolute',
        ...(wide ? {left: 100, width: 900, top: 330, textAlign: 'left' as const} : {left: 60, right: 60, top, textAlign: 'center' as const}),
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
              fontSize: fs,
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
        <div style={{marginTop: 26, fontSize: wide ? 36 : 40, fontWeight: 500, color: C.gray, opacity: prog(f, from + 14, 14)}}>
          {sub}
        </div>
      )}
    </div>
  );
};
