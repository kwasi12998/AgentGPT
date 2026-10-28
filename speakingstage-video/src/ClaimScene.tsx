import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import T from './timing.json';
import {C, FONT, prog, sp} from './theme';
import {Streak} from './Streak';

const LINES = ['Ihre Bühne.', 'Ihr Thema.', 'Kostenlos.'];
const CHIPS = ['Keine Exklusivität', 'Keine Umsatzbeteiligung', 'Andere Plattformen erlaubt'];

export const ClaimScene: React.FC = () => {
  const f = useCurrentFrame();
  const c = T.claim;
  if (f < c.start - 4) return null;
  const bg = prog(f, c.start - 6, 6);
  const underline = prog(f, c.lines[2] + 10, 20);
  const wm = sp(f, c.wordmark, 14, 120);
  const btn = sp(f, c.button, 9, 150);
  const url = prog(f, c.url, 12);
  const shine = ((f - c.button - 14) % 60) / 60;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: bg, fontFamily: FONT}}>
      {LINES.map((t, i) => {
        const s = sp(f, c.lines[i], 13, 150);
        const last = i === 2;
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 230 + i * 168,
              textAlign: 'center',
              fontSize: 142,
              fontWeight: 800,
              letterSpacing: -4,
              color: last ? C.copper : C.ink,
              opacity: Math.min(1, s * 1.6),
              transform: `translateY(${(1 - s) * 80}px) scale(${0.92 + s * 0.08})`
            }}
          >
            {t}
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Streak id="under" d="M 190 800 C 420 830 700 760 900 790" progress={underline * 1.3} tail={1.2} width={12} />
      </svg>
      {CHIPS.map((t, i) => {
        const s = sp(f, c.chips[i], 11, 150);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: 130,
              width: 820,
              top: 900 + i * 128,
              height: 104,
              borderRadius: 52,
              background: C.cream,
              border: `2px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '0 14px',
              fontSize: 40,
              fontWeight: 600,
              color: C.ink,
              opacity: Math.min(1, s * 1.5),
              transform: `translateX(${(1 - s) * 160}px)`
            }}
          >
            <div style={{width: 76, height: 76, borderRadius: '50%', background: C.copper, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 800}}>✓</div>
            {t}
          </div>
        );
      })}
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 190, top: 1300, width: 700, height: 117, opacity: Math.min(1, wm * 1.5), transform: `translateY(${(1 - wm) * 40}px)`}} />
      <div
        style={{
          position: 'absolute',
          left: 160,
          width: 760,
          top: 1460,
          height: 138,
          borderRadius: 69,
          background: C.copper,
          overflow: 'hidden',
          opacity: Math.min(1, btn * 1.5),
          transform: `scale(${0.7 + btn * 0.3 + Math.sin(f / 10) * 0.008})`,
          boxShadow: `0 24px 60px ${C.copper}66`,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: -0.5
        }}
      >
        <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: `${-20 + shine * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-20deg)'}} />
        Profil einreichen  →
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1636, textAlign: 'center', fontSize: 42, fontWeight: 600, color: C.navy, opacity: url}}>
        speakingstage.com/speaker-werden
      </div>
    </div>
  );
};
