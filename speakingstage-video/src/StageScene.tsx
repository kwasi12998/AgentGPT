import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import T from './timing.json';
import {C, FONT, prog, sp} from './theme';
import {Headline} from './Headline';
import {Streak} from './Streak';

const Person: React.FC<{x: number; y: number; s: number; f: number; i: number}> = ({x, y, s, f, i}) => (
  <g transform={`translate(${x} ${y + Math.sin(f / 9 + i * 1.7) * 5}) scale(${s})`} fill={C.navy}>
    <circle cx={0} cy={-120} r={62} />
    <path d="M -130 120 C -130 -10 -80 -40 0 -40 C 80 -40 130 -10 130 120 Z" />
  </g>
);

export const StageScene: React.FC = () => {
  const f = useCurrentFrame();
  const {start, landing, notify, end} = T.stage;
  if (f < start - 12 || f > end + 6) return null;
  const fade = prog(f, start - 10, 14) * (1 - prog(f, end - 4, 8));
  const light = prog(f, landing - 4, 14) * (0.85 + 0.15 * Math.sin(f / 3));
  const drop = prog(f, start + 4, landing - start - 4);
  const ripple = prog(f, landing, 40);
  const note = sp(f, notify, 14, 110);
  const noteOut = prog(f, end - 14, 12);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: fade, overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.copperLight} stopOpacity={0.7} />
            <stop offset="1" stopColor={C.copperLight} stopOpacity={0.12} />
          </linearGradient>
          <radialGradient id="floor">
            <stop offset="0" stopColor={C.copperLight} stopOpacity={0.75} />
            <stop offset="1" stopColor={C.copperLight} stopOpacity={0} />
          </radialGradient>
        </defs>
        <polygon points="500,-40 580,-40 980,1420 100,1420" fill="url(#cone)" opacity={light} />
        <ellipse cx={540} cy={1400} rx={460} ry={110} fill="url(#floor)" opacity={light} />
        <ellipse cx={540} cy={1400} rx={300} ry={64} fill="none" stroke={C.copper} strokeWidth={4} opacity={0.5 * light} />
        {f >= landing && <ellipse cx={540} cy={1400} rx={ripple * 520} ry={ripple * 120} fill="none" stroke={C.copper} strokeWidth={6 * (1 - ripple)} opacity={1 - ripple} />}
        {drop < 1 && <Streak id="drop" d="M 540 -80 C 540 500 540 900 540 1390" progress={drop} tail={0.22} width={16} opacity={1 - prog(f, landing - 2, 6)} />}
        {/* mic stand */}
        <g opacity={light}>
          <rect x={534} y={1000} width={12} height={160} fill={C.ink} />
          <rect x={518} y={940} width={44} height={74} rx={22} fill={C.ink} />
          <rect x={518} y={968} width={44} height={8} fill={C.copper} />
          {/* lectern */}
          <path d="M 420 1150 H 660 L 680 1400 H 400 Z" fill={C.navy} />
          <rect x={410} y={1136} width={260} height={26} rx={10} fill={C.ink} />
        </g>
        <Person x={150} y={1860} s={1.5} f={f} i={0} />
        <Person x={430} y={1900} s={1.7} f={f} i={1} />
        <Person x={700} y={1870} s={1.55} f={f} i={2} />
        <Person x={950} y={1910} s={1.7} f={f} i={3} />
      </svg>
      <Img src={staticFile('mark.png')} style={{position: 'absolute', left: 540 - 56, top: 1255 - 56, width: 112, height: 112, filter: 'invert(1)', opacity: light}} />
      <Headline from={start + 2} to={notify - 6} lines={[{text: 'Dann kommt'}, {text: 'die Anfrage.', accent: true}]} top={200} />
      <div
        style={{
          position: 'absolute',
          left: 70,
          width: 940,
          top: 230,
          borderRadius: 56,
          padding: '34px 38px',
          background: '#ffffffee',
          border: `2px solid ${C.line}`,
          boxShadow: '0 36px 90px rgba(22,33,49,0.25)',
          fontFamily: FONT,
          display: 'flex',
          gap: 30,
          alignItems: 'center',
          opacity: Math.min(1, note * 1.4) * (1 - noteOut),
          transform: `translateY(${(1 - note) * -420}px) scale(${1 - noteOut * 0.06})`
        }}
      >
        <div style={{width: 120, height: 120, borderRadius: 30, background: C.cream, border: `2px solid ${C.line}`, display: 'grid', placeItems: 'center', flex: 'none'}}>
          <Img src={staticFile('mark.png')} style={{width: 92, height: 92}} />
        </div>
        <div style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600, color: C.gray}}>
            <span>SPEAKINGSTAGE</span>
            <span>jetzt</span>
          </div>
          <div style={{fontSize: 44, fontWeight: 800, color: C.ink, marginTop: 6, letterSpacing: -0.5}}>Neue Buchungsanfrage</div>
          <div style={{fontSize: 32, fontWeight: 500, color: C.copper, marginTop: 4}}>Keynote · 400 Gäste · Hamburg</div>
        </div>
      </div>
    </div>
  );
};
