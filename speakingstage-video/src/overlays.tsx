import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import T from './timing2.json';
import {C, FONT, prog, sp} from './theme';
import {SPEAKERS} from './three/cards';

export const Tracker: React.FC = () => {
  const f = useCurrentFrame();
  const s4 = T.s4;
  if (f < s4.start + 2 || f > s4.end - 4) return null;
  const steps = ['Einreichen', 'Prüfung', 'Live', 'Anfrage'];
  const at = [s4.start - 10, s4.steps.pruefung, s4.steps.live, s4.steps.anfrage];
  const reveal = sp(f, s4.start + 6, 16, 110) * (1 - prog(f, s4.end - 12, 8));
  const fill = Math.min(1, Math.max(0, (f - s4.start) / (s4.steps.anfrage + 14 - s4.start))) * 0.97;
  return (
    <div style={{position: 'absolute', left: 80, width: 920, top: 1560, height: 210, borderRadius: 48, background: '#ffffffee', border: `2px solid ${C.line}`, boxShadow: '0 30px 70px rgba(22,33,49,0.14)', fontFamily: FONT, opacity: reveal, transform: `translateY(${(1 - reveal) * 120}px)`}}>
      <div style={{position: 'absolute', left: 110, right: 110, top: 70, height: 8, borderRadius: 4, background: C.line}}>
        <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${C.copper}, ${C.copperLight})`}} />
      </div>
      {steps.map((s, i) => {
        const x = 110 + (i * (920 - 220)) / 3;
        const done = f >= at[i] + (i === 0 ? 0 : 12);
        const active = !done && (i === 0 || f >= at[i - 1] + 12);
        const pop = sp(f, at[i] + 10, 8, 160);
        return (
          <div key={s} style={{position: 'absolute', left: x - 120, width: 240, top: 38, textAlign: 'center'}}>
            <div style={{margin: '0 auto', width: 74, height: 74, borderRadius: '50%', display: 'grid', placeItems: 'center', background: done ? C.copper : '#fff', border: `4px solid ${done || active ? C.copper : C.line}`, color: '#fff', fontSize: 38, fontWeight: 800, transform: `scale(${done && i > 0 ? 0.8 + 0.2 * Math.min(1.2, pop) : active ? 1 + 0.06 * Math.sin(f / 4) : 1})`, boxShadow: active ? `0 0 0 10px ${C.copper}22` : 'none'}}>
              {done ? '✓' : ''}
            </div>
            <div style={{marginTop: 20, fontSize: 30, fontWeight: done || active ? 700 : 500, color: done || active ? C.ink : C.gray}}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Notification: React.FC = () => {
  const f = useCurrentFrame();
  const {notify, end} = T.s5;
  if (f < notify - 2 || f > end + 8) return null;
  const note = sp(f, notify, 14, 110);
  const out = prog(f, end - 8, 10);
  return (
    <div style={{position: 'absolute', left: 70, width: 940, top: 230, borderRadius: 56, padding: '34px 38px', background: '#ffffffee', border: `2px solid ${C.line}`, boxShadow: '0 36px 90px rgba(22,33,49,0.25)', fontFamily: FONT, display: 'flex', gap: 30, alignItems: 'center', opacity: Math.min(1, note * 1.4) * (1 - out), transform: `translateY(${(1 - note) * -420}px) scale(${1 - out * 0.06})`}}>
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
  );
};

const CHIPS = ['Keine Exklusivität', 'Keine Umsatzbeteiligung', 'Andere Plattformen erlaubt'];

export const ClaimOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const c = T.s6;
  if (f < c.chips[0] - 6) return null;
  const wm = sp(f, c.wordmark, 14, 120);
  const btn = sp(f, c.button, 9, 150);
  const url = prog(f, c.url, 12);
  const shine = ((f - c.button - 14) % 60) / 60;
  return (
    <>
      {CHIPS.map((t, i) => {
        const s = sp(f, c.chips[i], 11, 150);
        return (
          <div key={t} style={{position: 'absolute', left: 130, width: 820, top: 930 + i * 128, height: 104, borderRadius: 52, background: C.cream, border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 14px', fontFamily: FONT, fontSize: 40, fontWeight: 600, color: C.ink, opacity: Math.min(1, s * 1.5), transform: `translateX(${(1 - s) * 160}px)`}}>
            <div style={{width: 76, height: 76, borderRadius: '50%', background: C.copper, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 800}}>✓</div>
            {t}
          </div>
        );
      })}
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 190, top: 1340, width: 700, height: 117, opacity: Math.min(1, wm * 1.5), transform: `translateY(${(1 - wm) * 40}px)`}} />
      <div style={{position: 'absolute', left: 160, width: 760, top: 1490, height: 138, borderRadius: 69, background: C.copper, overflow: 'hidden', opacity: Math.min(1, btn * 1.5), transform: `scale(${0.7 + btn * 0.3 + Math.sin(f / 10) * 0.008})`, boxShadow: `0 24px 60px ${C.copper}66`, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: FONT, fontSize: 54, fontWeight: 800, letterSpacing: -0.5}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: `${-20 + shine * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-20deg)'}} />
        Profil einreichen  →
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1666, textAlign: 'center', fontFamily: FONT, fontSize: 42, fontWeight: 600, color: C.navy, opacity: url}}>speakingstage.com/speaker-werden</div>
    </>
  );
};

/** Trust strip for the speaker corridor: counter + scrolling names. */
export const TrustStrip: React.FC = () => {
  const f = useCurrentFrame();
  const {start, end} = T.s2;
  if (f < start + 30 || f > end + 4) return null;
  const a = sp(f, start + 34, 14, 110) * (1 - prog(f, end - 10, 10));
  const count = Math.round(prog(f, start + 40, 70, (t) => 1 - Math.pow(1 - t, 3)) * 160);
  const names = SPEAKERS.map((s) => s.name.toUpperCase()).join('   ·   ');
  const x = -((f - start) * 5.2);
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1580, textAlign: 'center', fontFamily: FONT, opacity: a, transform: `translateY(${(1 - a) * 60}px)`}}>
        <span style={{display: 'inline-block', padding: '18px 44px', borderRadius: 60, background: '#ffffffee', border: `2px solid ${C.line}`, boxShadow: '0 20px 50px rgba(22,33,49,0.14)', fontSize: 46, fontWeight: 800, color: C.ink}}>
          <span style={{color: C.copper}}>{count}+</span> Speaker-Profile
        </span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1730, height: 60, overflow: 'hidden', fontFamily: FONT, fontSize: 36, fontWeight: 700, letterSpacing: 2, color: C.gray, opacity: a * 0.9, whiteSpace: 'nowrap'}}>
        <div style={{transform: `translateX(${x}px)`}}>{names}   ·   {names}   ·   {names}</div>
      </div>
    </>
  );
};

/** Copper speed lines that fire during camera flights. */
export const SpeedLines: React.FC<{amount: number}> = ({amount}) => {
  if (amount < 0.05) return null;
  const lines = Array.from({length: 34}, (_, i) => {
    const a = (i / 34) * Math.PI * 2 + (i % 5) * 0.07;
    const r0 = 260 + ((i * 97) % 220);
    const r1 = r0 + 420 + ((i * 53) % 500);
    return {x1: 540 + Math.cos(a) * r0, y1: 960 + Math.sin(a) * r0 * 1.6, x2: 540 + Math.cos(a) * r1, y2: 960 + Math.sin(a) * r1 * 1.6, w: 3 + (i % 4) * 2};
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: Math.min(1, amount) * 0.5, pointerEvents: 'none'}}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={i % 3 ? C.copperLight : C.copper} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </svg>
  );
};
