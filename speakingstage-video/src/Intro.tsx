import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, FONT, prog, sp} from './theme';
import {Streak} from './Streak';

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 96) return null;
  const streak = prog(f, 4, 26);
  const markIn = sp(f, 24, 12, 110);
  const swap = prog(f, 46, 16);
  const wipe = prog(f, 48, 20);
  const exit = prog(f, 82, 12);
  const ring = prog(f, 26, 30);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - exit, transform: `translateY(${-exit * 60}px)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Streak id="intro" d="M -120 1560 C 260 1500 120 1080 540 960" progress={streak * 1.25} tail={0.55} width={16} opacity={1 - prog(f, 32, 10)} />
        <circle cx={540} cy={960} r={60 + ring * 380} fill="none" stroke={C.copper} strokeWidth={4} opacity={(1 - ring) * 0.7 * (f > 26 ? 1 : 0)} />
      </svg>
      <Img
        src={staticFile('mark.png')}
        style={{
          position: 'absolute',
          left: 540 - 220,
          top: 960 - 220,
          width: 440,
          height: 440,
          opacity: markIn * (1 - swap),
          transform: `scale(${0.5 + markIn * 0.5 - swap * 0.25})`,
          filter: `blur(${swap * 8}px)`
        }}
      />
      <div style={{position: 'absolute', left: 90, top: 960 - 75, width: 900, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: swap}}>
        <Img src={staticFile('wordmark.png')} style={{width: 900, height: 150, display: 'block'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1090,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: 1,
          color: C.copper,
          opacity: prog(f, 62, 14),
          transform: `translateY(${(1 - prog(f, 62, 14)) * 24}px)`
        }}
      >
        Die Bühne für Keynote Speaker
      </div>
    </div>
  );
};
