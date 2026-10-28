import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import T from './timing.json';
import {C, FONT, prog, sp, inOut} from './theme';
import {DOTS, MAP_W, MAP_H, outlinePath, project} from './dach';
import {Headline} from './Headline';
import {Streak} from './Streak';

const TILT = 42;
const cities = T.map.cities.map((c) => ({...c, p: project(c.lon, c.lat)}));

const headAt = (f: number): [number, number] => {
  if (f <= cities[0].at) return cities[0].p;
  for (let i = 0; i < cities.length - 1; i++) {
    const a = cities[i];
    const b = cities[i + 1];
    if (f <= b.at) {
      const t = inOut((f - a.at) / (b.at - a.at));
      return [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t];
    }
  }
  return cities[cities.length - 1].p;
};

const Tracker: React.FC<{f: number}> = ({f}) => {
  const steps = ['Einreichen', 'Prüfung', 'Live', 'Anfrage'];
  const at = [T.map.start - 10, T.map.steps.pruefung, T.map.steps.live, T.map.steps.anfrage];
  const reveal = sp(f, T.map.start + 4, 16, 110);
  const fill = Math.min(1, Math.max(0, (f - T.map.start) / (T.map.steps.anfrage + 20 - T.map.start))) * 0.97;
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        width: 920,
        top: 1490,
        height: 210,
        borderRadius: 48,
        background: '#ffffffee',
        border: `2px solid ${C.line}`,
        boxShadow: '0 30px 70px rgba(22,33,49,0.14)',
        fontFamily: FONT,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 120}px)`
      }}
    >
      <div style={{position: 'absolute', left: 110, right: 110, top: 70, height: 8, borderRadius: 4, background: C.line}}>
        <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${C.copper}, ${C.copperLight})`}} />
      </div>
      {steps.map((s, i) => {
        const x = 110 + (i * (920 - 220)) / 3;
        const done = f >= at[i] + (i === 0 ? 0 : 14);
        const active = !done && (i === 0 || f >= at[i - 1] + 14);
        const pop = sp(f, at[i] + 10, 8, 160);
        return (
          <div key={s} style={{position: 'absolute', left: x - 120, width: 240, top: 38, textAlign: 'center'}}>
            <div
              style={{
                margin: '0 auto',
                width: 74,
                height: 74,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: done ? C.copper : '#fff',
                border: `4px solid ${done || active ? C.copper : C.line}`,
                color: '#fff',
                fontSize: 38,
                fontWeight: 800,
                transform: `scale(${done && i > 0 ? 0.8 + 0.2 * Math.min(1.2, pop) : active ? 1 + 0.06 * Math.sin(f / 4) : 1})`,
                boxShadow: active ? `0 0 0 10px ${C.copper}22` : 'none'
              }}
            >
              {done ? '✓' : ''}
            </div>
            <div style={{marginTop: 20, fontSize: 30, fontWeight: done || active ? 700 : 500, color: done || active ? C.ink : C.gray}}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

export const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const {start, end} = T.map;
  if (f < start - 4 || f > end + 10) return null;
  const enter = sp(f, start, 18, 80);
  const exit = prog(f, end - 8, 16);
  const [hx, hy] = headAt(f);
  const visited = cities.filter((c) => f >= c.at);
  const pts = [...visited.map((c) => c.p), [hx, hy] as [number, number]];
  const d = pts.length > 1 ? 'M' + pts.map((p) => p.join(',')).join(' L') : '';
  const headVisible = prog(f, T.map.cities[0].at - 8, 8);
  const drop = (1 - prog(f, T.map.cities[0].at - 14, 14)) * 160;

  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - exit}}>
      <Headline from={start + 2} to={T.map.steps.live - 4} lines={[{text: 'Wir prüfen'}, {text: 'Ihr Profil.', accent: true}]} sub="Persönlich. Meist in wenigen Tagen." />
      <Headline from={T.map.steps.live - 4} to={T.map.steps.anfrage - 4} lines={[{text: 'Ihr Profil'}, {text: 'geht live.', accent: true}]} sub="Sichtbar bei Google und in unserer KI-Suche." />
      <Headline from={T.map.steps.anfrage - 4} to={end} lines={[{text: 'Anfragen aus'}, {text: 'dem DACH-Raum.', accent: true}]} size={92} />
      <div style={{position: 'absolute', left: 90, top: 560, width: MAP_W, height: MAP_H, perspective: 2200, perspectiveOrigin: '50% 30%', opacity: enter, transform: `translateY(${(1 - enter) * 120}px)`}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${TILT}deg) scale(0.8)`, transformOrigin: '50% 0%'}}>
          <svg width={MAP_W} height={MAP_H} style={{position: 'absolute', inset: 0}}>
            <path d={outlinePath} fill={C.cream} stroke={C.copper} strokeWidth={4} strokeLinejoin="round" opacity={0.95} />
            {DOTS.map((p, i) => {
              const a = prog(f, start + 2 + (p.y / MAP_H) * 26, 10);
              const lit = cities.some((c) => Math.hypot(c.p[0] - p.x, c.p[1] - p.y) < 70 && f >= c.at);
              return <circle key={i} cx={p.x} cy={p.y} r={lit ? 6 : 4.2} fill={lit ? C.copper : '#d3cabe'} opacity={a * (lit ? 0.9 : 0.8)} />;
            })}
            {d && <Streak id="route" d={d} progress={1} tail={1.2} width={11} />}
            {cities.map((c) => {
              const t = f - c.at;
              if (t < 0 || t > 40) return null;
              const r = prog(f, c.at, 38);
              return <circle key={c.name} cx={c.p[0]} cy={c.p[1]} r={r * 110} fill="none" stroke={C.copper} strokeWidth={5 * (1 - r)} opacity={1 - r} />;
            })}
          </svg>
          {cities.map((c) => {
            const pin = sp(f, c.at, 9, 150);
            if (f < c.at) return null;
            return (
              <div key={c.name} style={{position: 'absolute', left: c.p[0], top: c.p[1], width: 0, height: 0, transformStyle: 'preserve-3d'}}>
                <div style={{position: 'absolute', left: 0, bottom: 0, transformOrigin: '50% 100%', transform: `translateX(-50%) rotateX(${-TILT}deg) scale(${pin})`, fontFamily: FONT, textAlign: 'center'}}>
                  <div style={{padding: '12px 26px', borderRadius: 40, background: C.navy, color: '#fff', fontSize: 34, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(22,33,49,0.3)'}}>{c.name}</div>
                  <div style={{width: 6, height: 54 * pin, margin: '0 auto', background: `linear-gradient(${C.navy}, ${C.copper})`}} />
                  <div style={{width: 30, height: 30, margin: '-4px auto 0', borderRadius: '50%', background: C.copper, boxShadow: `0 0 30px ${C.copperLight}`}} />
                </div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: hx, top: hy, width: 0, height: 0, transformStyle: 'preserve-3d', opacity: headVisible}}>
            <div style={{position: 'absolute', left: -26, top: -26 - drop, width: 52, height: 52, borderRadius: '50%', background: '#fff', boxShadow: `0 0 0 8px ${C.copper}, 0 0 60px 26px ${C.copperLight}`, transform: `rotateX(${-TILT}deg)`}} />
          </div>
        </div>
      </div>
      <Tracker f={f} />
    </div>
  );
};
