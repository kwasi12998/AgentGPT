import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, prog} from '../theme';
import {B, TL} from '../ad-timeline';

// ------------------------------------------------------------------ helpers
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const inOut3 = Easing.inOut(Easing.cubic);
const out3 = Easing.out(Easing.cubic);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const wordTimes = (beat: string, words: string[]) => {
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  return words.map((w) => {
    const f = B[beat].v0 + (acc / total) * B[beat].vFrames * 0.94;
    acc += w.length + 1;
    return f;
  });
};

const Slam: React.FC<{f: number; at: number; dur?: number; from?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({f, at, dur = 10, from = 0.34, children, style}) => {
  const p = prog(f, at, dur, expoOut);
  return <span style={{display: 'inline-block', opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 34}px) scale(${1 + (1 - p) * from})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined, ...style}}>{children}</span>;
};

// ------------------------------------------------------------------ CSS 3D world with a camera
const PERSP = 1400;
type Cam = {x: number; y: number; z: number; yaw: number; pitch: number};

const World: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <div style={{position: 'absolute', inset: 0, perspective: PERSP, perspectiveOrigin: '50% 50%', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg) translate3d(${-cam.x}px,${-cam.y}px,${-cam.z}px)`}}>{children}</div>
  </div>
);

const Obj: React.FC<{x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, style, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate(-50%,-50%)`, ...style}}>{children}</div>
);

const SP = (slug: string) => staticFile(`speakers/${slug}.jpg`);
const CHRIS = staticFile('chris/photo1.jpg');
const FACES = [
  {n: 'Oliver Kahn', t: 'Leadership', src: SP('oliver-kahn')},
  {n: 'Miriam Meckel', t: 'Künstliche Intelligenz', src: SP('miriam-meckel')},
  {n: 'Chris-Aike Spring', t: 'Female Leadership', src: CHRIS},
  {n: 'Sandra Navidi', t: 'USA & Finanzmärkte', src: SP('sandra-navidi')},
  {n: 'Anders Indset', t: 'KI & Leadership', src: SP('anders-indset')},
  {n: 'Nina Ruge', t: 'Longevity', src: SP('nina-ruge')},
  {n: 'Urs Meier', t: 'Entscheidungen', src: SP('urs-meier')},
  {n: 'Dani Arnold', t: 'Motivation', src: SP('dani-arnold')},
  {n: 'Jochen Schweizer', t: 'Mut & Unternehmertum', src: SP('jochen-schweizer')},
  {n: 'Michael Groß', t: 'Motivation', src: SP('michael-gross')},
  {n: 'Hannes Jaenicke', t: 'Nachhaltigkeit', src: SP('hannes-jaenicke')},
  {n: 'Chris-Aike Spring', t: 'Female Leadership', src: staticFile('chris/photo2.jpg')}
];

const photo = (src: string, w: number, h: number, r: number, extra?: React.CSSProperties): React.ReactNode => (
  <Img src={src} style={{width: w, height: h, borderRadius: r, objectFit: 'cover', objectPosition: '50% 20%', display: 'block', ...extra}} />
);

// ------------------------------------------------------------------ timeline anchors
const T = {
  wipe: B.d4.start - 4, // light starts to grow
  swap: B.d4.start + 16,
  d5: B.d5.start,
  arrive: (id: string) => B[id].start + 18
};
const STEP_IDS = ['d6', 'd7', 'd8', 'd9', 'd10'];
const PX = [-900, 0, 900, 1800, 2700];
const PANEL = {w: 760, h: 560, y: 112};

// ------------------------------------------------------------------ camera
const darkCam = (f: number): Cam => {
  const end = B.d4.start + 20;
  const p = clamp01(f / end);
  const e = Easing.inOut(Easing.poly(1.4))(p);
  return {x: 0, y: 0, z: lerp(1100, -3300, e), yaw: 0, pitch: 0};
};

const camKeys = (): {x: number; y: number; z: number; yaw: number}[] => [];
void camKeys;

const lightCam = (f: number): Cam => {
  const close = (i: number, push = 0): Cam => ({x: PX[i], y: 0, z: -183 - push, yaw: 0, pitch: 0});
  const overview: Cam = {x: 0, y: -175, z: 2600, yaw: 0, pitch: 0};
  const logo: Cam = {x: 0, y: 0, z: 700, yaw: 0, pitch: 0};
  const mix = (a: Cam, b: Cam, t: number): Cam => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t)});
  const cut = Easing.inOut(Easing.poly(3.2));
  // d4: logo moment, slowly pulling back
  if (f < T.d5) return mix({...logo, z: 330}, logo, out3(clamp01((f - B.d4.start) / (T.d5 - B.d4.start))));
  // d5: whip out to the overview of three steps
  const a5 = B.d5.start;
  if (f < T.arrive('d6')) return mix(logo, overview, cut(clamp01((f - a5) / 26)));
  const ids = STEP_IDS;
  // travel to every station
  for (let i = 0; i < ids.length; i++) {
    const arr = T.arrive(ids[i]);
    const prevEnd = i === 0 ? a5 + 26 : T.arrive(ids[i - 1]);
    const nextArr = i + 1 < ids.length ? T.arrive(ids[i + 1]) : B.d11.start + 6;
    const travel = i === 0 ? 38 : 30;
    const t0 = arr - travel;
    if (f < arr) {
      const u = cut(clamp01((f - t0) / travel));
      const from = i === 0 ? overview : close(i - 1, 60);
      const to = close(i, 0);
      const c = mix(from, to, u);
      const dir = i === 0 ? 0 : 1;
      return {...c, yaw: c.yaw + dir * 9 * Math.sin(Math.PI * u), pitch: 0};
    }
    if (f < nextArr - travel || i === ids.length - 1) {
      const u = clamp01((f - arr) / Math.max(1, nextArr - travel - arr));
      if (i === ids.length - 1) break;
      return close(i, 60 * u);
    }
  }
  // d11: pull back and up
  const t = clamp01((f - T.arrive('d10')) / (B.d11.start + 40 - T.arrive('d10')));
  const last = close(4, 60);
  if (f < B.d11.start) return last;
  const u = Easing.inOut(Easing.cubic)(clamp01((f - B.d11.start) / 46));
  void t;
  return mix(last, {x: 2100, y: -120, z: 2100, yaw: 0, pitch: 0}, u);
};

// ------------------------------------------------------------------ dark world
const CloudCards: React.FC<{cam: Cam; f: number}> = ({cam, f}) => {
  const items = React.useMemo(() => {
    const rng = lcg(41);
    return Array.from({length: 54}, (_, i) => ({
      x: (rng() - 0.5) * 2300,
      y: (rng() - 0.5) * 1500,
      z: 500 - rng() * 8200,
      ry: (rng() - 0.5) * 70,
      rz: (rng() - 0.5) * 24,
      f: FACES[i % FACES.length]
    }));
  }, []);
  return (
    <>
      {items.map((it, i) => {
        const d = cam.z - it.z; // distance in front of the camera
        if (d < 160 || d > 5200) return null;
        const blur = Math.max(0, (d - 1500) / 380) + Math.max(0, (700 - d) / 140);
        const op = clamp01((5200 - d) / 2200) * clamp01((d - 160) / 500) * 0.8;
        return (
          <Obj key={i} x={it.x} y={it.y} z={it.z} ry={it.ry} rz={it.rz}>
            <div style={{width: 280, height: 350, borderRadius: 26, overflow: 'hidden', opacity: op, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', position: 'relative'}}>
              {photo(it.f.src, 280, 350, 0, {filter: 'brightness(0.55) saturate(0.8)'})}
            </div>
          </Obj>
        );
      })}
      <Obj x={0} y={0} z={cam.z - 99999} />
      {void f}
    </>
  );
};

const Ico: React.FC<{kind: 'search' | 'euro' | 'cal' | 'docs'; size?: number}> = ({kind, size = 150}) => {
  const st = {stroke: '#fff', strokeWidth: 7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'search' && (
        <>
          <circle cx="42" cy="42" r="24" {...st} />
          <path d="M60 60 L82 82" {...st} />
          <path d="M30 42 c4 -8 8 -8 12 0 s8 8 12 0" stroke={C.copperLight} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'euro' && (
        <>
          <circle cx="50" cy="50" r="34" {...st} />
          <path d="M62 36 a16 16 0 1 0 0 28 M34 45 H58 M34 55 H56" {...st} />
        </>
      )}
      {kind === 'cal' && (
        <>
          <rect x="16" y="22" width="68" height="62" rx="12" {...st} />
          <path d="M16 42 H84 M34 14 V28 M66 14 V28" {...st} />
          <path d="M44 56 a7 7 0 1 1 9 7 c-3 1.5 -3 4 -3 6" stroke={C.copperLight} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'docs' && (
        <>
          <rect x="16" y="14" width="42" height="56" rx="8" {...st} />
          <rect x="42" y="30" width="42" height="56" rx="8" {...st} />
        </>
      )}
    </svg>
  );
};

const PainTile: React.FC<{f: number; at: number; kind: 'search' | 'euro' | 'cal'; x: number; ry: number}> = ({f, at, kind, x, ry}) => {
  const p = prog(f, at, 16, expoOut);
  if (p <= 0) return null;
  const out = prog(f, B.d3.start + 28, 18, inOut3);
  return (
    <Obj x={x} y={220} z={(1 - p) * -900} ry={ry + (1 - p) * 40}>
      <div style={{width: 250, height: 250, borderRadius: 56, background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))', border: '1.5px solid rgba(255,255,255,0.28)', boxShadow: '0 40px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, p * 2.4) * (1 - out)}}>
        <Ico kind={kind} />
      </div>
    </Obj>
  );
};

const OfferDoc: React.FC<{f: number; at: number; x: number; w: number; h: number; ry: number; rz: number; lines: number[]}> = ({f, at, x, w, h, ry, rz, lines}) => {
  const p = prog(f, at, 18, expoOut);
  if (p <= 0) return null;
  const out = prog(f, T.wipe - 4, 16, inOut3);
  return (
    <Obj x={x} y={200} z={(1 - p) * -800 + out * 400} ry={ry} rz={rz}>
      <div style={{width: w, height: h, borderRadius: 26, background: 'linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))', border: '1.5px solid rgba(255,255,255,0.28)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', padding: 26, boxSizing: 'border-box', opacity: Math.min(1, p * 2.4) * (1 - out)}}>
        <div style={{height: 16, width: '46%', borderRadius: 8, background: 'rgba(255,255,255,0.5)', marginBottom: 20}} />
        {lines.map((l, i) => (
          <div key={i} style={{height: 11, width: `${l}%`, borderRadius: 6, background: 'rgba(255,255,255,0.2)', marginBottom: 14}} />
        ))}
      </div>
    </Obj>
  );
};

const DarkText: React.FC<{f: number}> = ({f}) => {
  if (f > T.wipe + 18) return null;
  const q = ['Du', 'suchst', 'einen', 'Keynote-', 'Speaker?'];
  const at = wordTimes('d1', q);
  const out1 = prog(f, B.d2a.start - 2, 12, inOut3);
  const lines = [
    {id: 'd2a', a: 'Endlose ', k: 'Recherche.'},
    {id: 'd2b', a: 'Unklare ', k: 'Preise.'},
    {id: 'd2c', a: 'Offener ', k: 'Termin.'}
  ];
  const out2 = prog(f, B.d3.start - 2, 12, inOut3);
  const out3_ = prog(f, T.wipe - 6, 14, inOut3);
  return (
    <>
      {f < B.d2a.start + 14 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', fontFamily: FONT, fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 1.04, color: '#fff', opacity: 1 - out1, transform: `scale(${1 + out1 * 0.12})`, filter: out1 > 0 ? `blur(${out1 * 10}px)` : undefined}}>
          <div>
            <Slam f={f} at={at[0]}>Du</Slam> <Slam f={f} at={at[1]}>suchst</Slam>
          </div>
          <div>
            <Slam f={f} at={at[2]}>einen</Slam> <Slam f={f} at={at[3]} style={{color: C.copperLight}}>Keynote-</Slam>
          </div>
          <div>
            <Slam f={f} at={at[4]} style={{color: C.copperLight}}>Speaker?</Slam>
          </div>
        </div>
      )}
      {f >= B.d2a.start && f < B.d3.start + 14 && (
        <div style={{position: 'absolute', left: 70, top: 86, fontFamily: FONT, fontSize: 104, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.02, color: '#fff', opacity: 1 - out2}}>
          {lines.map((ln, i) => {
            const dim = i < 2 ? prog(f, B[lines[i + 1].id].v0 - 2, 10, out3) : 0;
            return (
              <div key={ln.id} style={{opacity: 1 - dim * 0.62}}>
                <Slam f={f} at={B[ln.id].v0 - 2} dur={9} from={0.5}>
                  {ln.a}
                  <span style={{color: C.copperLight}}>{ln.k}</span>
                </Slam>
              </div>
            );
          })}
        </div>
      )}
      {f >= B.d3.start && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT, fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 1.04, color: '#fff', opacity: 1 - out3_}}>
          <div>
            <Slam f={f} at={B.d3.v0 - 2} dur={10}>Angebote.</Slam>
          </div>
          <div>
            <Slam f={f} at={B.d3.v0 + 26} dur={10} style={{color: C.copperLight}}>Nicht vergleichbar.</Slam>
          </div>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ light world: glass panels
const GlassPanel: React.FC<{children: React.ReactNode; sheen?: number}> = ({children, sheen = 0}) => (
  <div style={{position: 'relative', width: PANEL.w, height: PANEL.h, borderRadius: 44, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,246,240,0.95))', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 70px 120px -30px rgba(22,33,49,0.38), 0 24px 44px -12px rgba(22,33,49,0.2), inset 0 1px 0 #fff', fontFamily: FONT}}>
    {children}
    {sheen > 0 && sheen < 1 && <div style={{position: 'absolute', top: -80, bottom: -80, width: 220, left: lerp(-300, 1000, sheen), transform: 'rotate(18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />}
  </div>
);

const Chip: React.FC<{active?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({active = 0, children, style}) => (
  <div style={{padding: '0 26px', height: 54, borderRadius: 27, display: 'inline-flex', alignItems: 'center', fontSize: 24, fontWeight: 700, color: active > 0.5 ? '#fff' : C.navy, background: active > 0.5 ? C.copper : '#f2ece4', ...style}}>{children}</div>
);

const typed = (text: string, f: number, at: number, cps = 1.1) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((f - at) * cps))));

const Check: React.FC<{p: number; size?: number}> = ({p, size = 52}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, opacity: p > 0 ? 1 : 0}}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
      <path d="M5 12.5 L10 17.5 L19 7" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const P1: React.FC<{t: number}> = ({t}) => {
  const count = Math.round(160 * prog(t, 18, 40, out3));
  const q = typed('Leadership Keynote', t, 6, 0.6);
  const tiles = FACES.slice(0, 8);
  return (
    <GlassPanel sheen={prog(t, 0, 40, inOut3)}>
      <div style={{position: 'absolute', left: 28, top: 28, width: 704, height: 76, borderRadius: 38, background: '#f4efe8', display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box'}}>
        <svg width="32" height="32" viewBox="0 0 24 24" style={{marginRight: 18}}>
          <circle cx="10.5" cy="10.5" r="6.5" stroke={C.navy} strokeWidth="2.4" fill="none" />
          <path d="M15.5 15.5 L21 21" stroke={C.navy} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div style={{fontSize: 30, fontWeight: 600, color: C.navy}}>
          {q}
          <span style={{opacity: Math.floor(t / 8) % 2 ? 0 : 1, color: C.copper}}>|</span>
        </div>
        <div style={{marginLeft: 'auto', padding: '8px 20px', borderRadius: 24, background: C.copper, color: '#fff', fontSize: 26, fontWeight: 800, opacity: prog(t, 14, 8)}}>{count}+</div>
      </div>
      {tiles.map((fc, i) => {
        const p = prog(t, 24 + i * 3, 14, expoOut);
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <div key={i} style={{position: 'absolute', left: 28 + col * 181, top: 128 + row * 210, width: 160, height: 194, borderRadius: 24, overflow: 'hidden', opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.88 + 0.12 * p})`, boxShadow: i === 2 ? `0 0 0 4px ${C.copper}` : '0 10px 24px rgba(22,33,49,0.18)'}}>
            {photo(fc.src, 160, 194, 0)}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 12px 10px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(10,16,24,0.78))', color: '#fff', fontSize: 15, fontWeight: 700}}>{fc.n}</div>
          </div>
        );
      })}
    </GlassPanel>
  );
};

const P2: React.FC<{t: number; words: number[]; f: number}> = ({t, words, f}) => {
  const tabs = ['Profile', 'Videos', 'Themen'];
  const act = (i: number) => prog(f, words[i], 6, out3) * (1 - (i < 2 ? prog(f, words[i + 1], 6, out3) : 0));
  const cards = [FACES[2], FACES[0], FACES[1]];
  const heart = prog(t, 76, 12, expoOut);
  return (
    <GlassPanel sheen={prog(t, 0, 40, inOut3)}>
      <div style={{position: 'absolute', left: 28, top: 26, display: 'flex', gap: 14}}>
        {tabs.map((tb, i) => (
          <Chip key={tb} active={act(i)}>
            {tb}
          </Chip>
        ))}
      </div>
      {cards.map((fc, i) => {
        const p = prog(t, 10 + i * 5, 16, expoOut);
        const pActive = act(0);
        const vActive = act(1);
        const tActive = act(2);
        return (
          <div key={i} style={{position: 'absolute', left: 28 + i * 240, top: 104, width: 224, height: 424, borderRadius: 28, background: '#fbf8f4', boxShadow: '0 12px 28px rgba(22,33,49,0.14)', opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${1 + 0.03 * pActive})`, overflow: 'hidden'}}>
            <div style={{position: 'relative', width: 224, height: 252}}>
              {photo(fc.src, 224, 252, 0)}
              <div style={{position: 'absolute', left: 14, bottom: 14, height: 44, padding: '0 16px', borderRadius: 22, background: vActive > 0.5 ? C.copper : 'rgba(255,255,255,0.92)', color: vActive > 0.5 ? '#fff' : C.navy, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8}}>
                <svg width="14" height="16" viewBox="0 0 14 16">
                  <path d="M1 1 L13 8 L1 15 Z" fill={vActive > 0.5 ? '#fff' : C.navy} />
                </svg>
                Video
              </div>
              {i === 0 && (
                <div style={{position: 'absolute', right: 14, top: 14, width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="24" height="22" viewBox="0 0 24 22">
                    <path d="M12 20 C-4 9 4 -2 12 5 C20 -2 28 9 12 20 Z" fill={heart > 0.4 ? C.copper : 'none'} stroke={heart > 0.4 ? C.copper : C.navy} strokeWidth="2.2" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{padding: '16px 18px'}}>
              <div style={{fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5}}>{fc.n}</div>
              <div style={{marginTop: 10, display: 'inline-block', padding: '6px 14px', borderRadius: 16, background: tActive > 0.5 ? C.copper : '#f0e9e0', color: tActive > 0.5 ? '#fff' : C.copperDark, fontSize: 16, fontWeight: 700}}>{fc.t}</div>
            </div>
          </div>
        );
      })}
    </GlassPanel>
  );
};

const P3: React.FC<{t: number}> = ({t}) => {
  const fields = [
    ['Termin', '12. März'],
    ['Ort', 'Hamburg'],
    ['Teilnehmer', '250'],
    ['Thema', 'Leadership']
  ];
  const press = prog(t, 74, 6, inOut3) * (1 - prog(t, 80, 8, out3));
  const done = prog(t, 82, 10, expoOut);
  return (
    <GlassPanel sheen={prog(t, 0, 40, inOut3)}>
      <div style={{position: 'absolute', left: 36, top: 30, fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: -1}}>Dein Briefing</div>
      {fields.map(([lab, val], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const p = prog(t, 8 + i * 5, 12, expoOut);
        return (
          <div key={lab} style={{position: 'absolute', left: 36 + col * 350, top: 100 + row * 122, width: 322, opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
            <div style={{fontSize: 18, fontWeight: 600, color: '#7b838f', marginBottom: 8}}>{lab}</div>
            <div style={{height: 68, borderRadius: 18, background: '#f4efe8', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 28, fontWeight: 700, color: C.navy}}>{typed(val, t, 18 + i * 12, 0.8)}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 36, top: 356, width: 688, height: 92, borderRadius: 46, background: done > 0.5 ? C.navy : C.copper, color: '#fff', fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${1 - 0.04 * press})`, boxShadow: '0 16px 30px rgba(167,100,60,0.35)'}}>
        {done > 0.5 ? (
          <>
            <Check p={1} size={46} /> Anfrage gesendet
          </>
        ) : (
          'Unverbindlich anfragen'
        )}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 472, textAlign: 'center', fontSize: 22, fontWeight: 600, color: '#7b838f'}}>Die Anfrage bleibt unverbindlich.</div>
    </GlassPanel>
  );
};

const P4: React.FC<{t: number; words: number[]; f: number}> = ({t, words, f}) => {
  const rows = ['Inhaltlicher Fit', 'Termin für dein Event', 'Kuratierte Auswahl'];
  const ids = [FACES[2], FACES[0], FACES[1]];
  return (
    <GlassPanel sheen={prog(t, 0, 40, inOut3)}>
      <div style={{position: 'absolute', left: 36, top: 30, fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: -1}}>Wir prüfen</div>
      {rows.map((r, i) => {
        const p = prog(t, 8 + i * 4, 12, expoOut);
        const ck = prog(f, words[i] ?? 0, 10, expoOut);
        return (
          <div key={r} style={{position: 'absolute', left: 36, top: 100 + i * 96, width: 688, height: 80, borderRadius: 24, background: '#f6f1ea', display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', gap: 22, opacity: p, transform: `translateX(${(1 - p) * -60}px)`}}>
            <div style={{width: 52, height: 52, borderRadius: 26, background: '#e7dfd4', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Check p={ck} />
            </div>
            <div style={{fontSize: 30, fontWeight: 700, color: C.navy}}>{r}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 36, top: 408, display: 'flex'}}>
        {ids.map((fc, i) => {
          const p = prog(f, words[2] + 4 + i * 4, 14, expoOut);
          return (
            <div key={i} style={{marginLeft: i ? -18 : 0, width: 100, height: 100, borderRadius: 50, overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 8px 18px rgba(22,33,49,0.2)', opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>
              {photo(fc.src, 100, 100, 0)}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 36 + 3 * 82 + 24, top: 440, fontSize: 26, fontWeight: 700, color: C.copperDark, opacity: prog(f, words[2] + 12, 12)}}>Deine Shortlist</div>
    </GlassPanel>
  );
};

const P5: React.FC<{t: number}> = ({t}) => {
  const cards = [FACES[0], FACES[2], FACES[1]];
  const sel = prog(t, 54, 12, expoOut);
  return (
    <GlassPanel sheen={prog(t, 0, 40, inOut3)}>
      <div style={{position: 'absolute', left: 36, top: 30, fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: -1}}>Deine Angebote</div>
      {cards.map((fc, i) => {
        const p = prog(t, 8 + i * 5, 14, expoOut);
        const isSel = i === 1;
        const lift = isSel ? sel : 0;
        return (
          <div key={i} style={{position: 'absolute', left: 36 + i * 236, top: 100 + (isSel ? -10 * lift : 0), width: 216, height: 370, borderRadius: 28, background: '#fbf8f4', boxShadow: isSel && lift > 0.1 ? `0 0 0 ${3 + lift}px ${C.copper}, 0 22px 40px rgba(167,100,60,0.28)` : '0 10px 24px rgba(22,33,49,0.14)', opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${1 + 0.04 * lift})`, padding: 20, boxSizing: 'border-box'}}>
            <div style={{width: 92, height: 92, borderRadius: 46, overflow: 'hidden'}}>{photo(fc.src, 92, 92, 0)}</div>
            <div style={{marginTop: 16, fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5}}>{fc.n}</div>
            <div style={{marginTop: 4, fontSize: 18, fontWeight: 600, color: '#7b838f'}}>Individuelles Angebot</div>
            {[88, 70, 80].map((w, k) => (
              <div key={k} style={{height: 11, width: `${w}%`, borderRadius: 6, background: '#e9e2d8', marginTop: 14}} />
            ))}
            <div style={{position: 'absolute', left: 20, right: 20, bottom: 20, height: 56, borderRadius: 28, background: isSel && lift > 0.5 ? C.copper : '#f0e9e0', color: isSel && lift > 0.5 ? '#fff' : C.copperDark, fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
              {isSel && lift > 0.5 ? (
                <>
                  <Check p={1} size={30} /> Zusage
                </>
              ) : (
                'Prüfen'
              )}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 492, textAlign: 'center', fontSize: 22, fontWeight: 600, color: '#7b838f'}}>Verbindlich erst nach Angebotsannahme.</div>
    </GlassPanel>
  );
};

const Bokeh: React.FC<{cam: Cam}> = ({cam}) => {
  const items = React.useMemo(() => {
    const rng = lcg(77);
    return Array.from({length: 34}, () => ({x: -1800 + rng() * 6400, y: -900 + rng() * 1500, z: -300 - rng() * 2600, r: 70 + rng() * 190, warm: rng() > 0.5, a: 0.25 + rng() * 0.4}));
  }, []);
  return (
    <>
      {items.map((b, i) => (
        <Obj key={i} x={b.x} y={b.y} z={b.z}>
          <div style={{width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: b.warm ? `radial-gradient(circle, rgba(224,160,116,${b.a}) 0%, rgba(224,160,116,${b.a * 0.55}) 55%, rgba(224,160,116,0) 72%)` : `radial-gradient(circle, rgba(255,255,255,${b.a + 0.3}) 0%, rgba(255,255,255,${b.a * 0.6}) 55%, rgba(255,255,255,0) 72%)`}} />
        </Obj>
      ))}
      {void cam}
    </>
  );
};

const LightWorld: React.FC<{f: number; cam: Cam}> = ({f, cam}) => {
  const logoP = prog(f, T.swap, 26, expoOut);
  const logoGone = prog(f, B.d5.start, 22, inOut3);
  const panelsIn = (i: number) => prog(f, B.d5.start + 6 + i * 5, 24, expoOut);
  const overviewHold = (i: number) => i < 3 ? 1 : prog(f, T.arrive('d9') - 40, 20);
  const d11 = prog(f, B.d11.start + 6, 36, inOut3);
  const w7 = wordTimes('d7', ['Profile,', 'Videos', 'und', 'Themen.']);
  const w9 = wordTimes('d9', ['Wir', 'prüfen', 'Fit', 'und', 'Termin.', 'Du', 'bekommst', 'eine', 'kuratierte', 'Auswahl.']);
  const w9s = [w9[2], w9[4], w9[9]];
  const panels = [
    (t: number) => <P1 t={t} />,
    (t: number) => <P2 t={t} words={[w7[0], w7[1], w7[3]]} f={f} />,
    (t: number) => <P3 t={t} />,
    (t: number) => <P4 t={t} words={w9s} f={f} />,
    (t: number) => <P5 t={t} />
  ];
  return (
    <>
      <Bokeh cam={cam} />
      {/* logo moment */}
      {logoGone < 1 && (
        <Obj x={0} y={30} z={(1 - logoP) * -500 - logoGone * 900} s={1}>
          <div style={{width: 520, height: 520, borderRadius: 130, background: 'linear-gradient(160deg, #ffffff, #f6f0e8)', boxShadow: '0 80px 140px -30px rgba(22,33,49,0.35), inset 0 1px 0 #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, logoP * 2.4) * (1 - logoGone)}}>
            <Img src={staticFile('mark.png')} style={{width: 300, height: 300, objectFit: 'contain'}} />
          </div>
        </Obj>
      )}
      {PX.map((px, i) => {
        const pIn = panelsIn(i) * overviewHold(i) * (1 - d11 * 0.85);
        if (pIn <= 0.01) return null;
        const t = f - T.arrive(STEP_IDS[i]) + 24;
        return (
          <React.Fragment key={i}>
            <Obj x={px} y={PANEL.y + (1 - pIn) * 520} z={0} s={0.9 + 0.1 * pIn} style={{opacity: Math.min(1, pIn * 1.6)}}>
              {panels[i](Math.max(0, t))}
            </Obj>
            <Obj x={px} y={PANEL.y + PANEL.h / 2 + 90} z={-20} rx={90} style={{opacity: pIn}}>
              <div style={{width: 900, height: 220, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(22,33,49,0.26) 0%, rgba(22,33,49,0.08) 55%, rgba(22,33,49,0) 72%)'}} />
            </Obj>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ light typography
const Head: React.FC<{f: number; id: string; num?: string; title: string; sub?: React.ReactNode; last?: boolean}> = ({f, id, num, title, sub, last}) => {
  const b = B[id];
  const out = last ? 0 : prog(f, b.end - 10, 10, inOut3);
  if (f < b.start || f > b.end + 2) return null;
  const at = b.start + 6;
  return (
    <div style={{position: 'absolute', left: 70, top: 60, fontFamily: FONT, opacity: 1 - out, transform: `translateY(${-out * 30}px)`, filter: out > 0 ? `blur(${out * 8}px)` : undefined}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        {num && (
          <Slam f={f} at={at} from={0.6} style={{width: 112, height: 112, borderRadius: 56, background: C.copper, color: '#fff', fontSize: 64, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>
            {num}
          </Slam>
        )}
        <div style={{fontSize: 136, fontWeight: 800, letterSpacing: -5, color: C.ink, lineHeight: 1}}>
          <Slam f={f} at={at + 2} dur={11} from={0.4}>
            {title}
          </Slam>
        </div>
      </div>
      {sub && (
        <div style={{marginTop: 18, fontSize: 44, fontWeight: 600, letterSpacing: -0.8, color: C.navy}}>
          <Slam f={f} at={at + 10} from={0.12}>
            {sub}
          </Slam>
        </div>
      )}
    </div>
  );
};

const LightText: React.FC<{f: number}> = ({f}) => (
  <>
    <Head f={f} id="d4" title="Es geht einfacher." />
    <Head f={f} id="d5" title="In drei Schritten." />
    <Head f={f} id="d6" num="1" title="Finden." sub={<>160+ Speaker aus dem <span style={{color: C.copper}}>DACH-Raum</span></>} />
    <Head f={f} id="d7" num="2" title="Vergleichen." sub={<>Profile. Videos. <span style={{color: C.copper}}>Themen.</span></>} />
    <Head f={f} id="d8" num="3" title="Anfragen." sub={<>Unverbindlich. Mit deinem <span style={{color: C.copper}}>Briefing.</span></>} />
    <Head f={f} id="d9" title="Wir prüfen." sub={<>Fit, Termin und eine <span style={{color: C.copper}}>Auswahl.</span></>} />
    <Head f={f} id="d10" title="Du entscheidest." sub={<>Verbindlich erst mit deiner <span style={{color: C.copper}}>Zusage.</span></>} />
  </>
);

const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < B.d11.start + 4) return null;
  const a = B.d11.v0;
  const wm = prog(f, a + 40, 14, expoOut);
  const btn = prog(f, a + 56, 14, expoOut);
  const url = prog(f, a + 70, 12, expoOut);
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontFamily: FONT, fontSize: 150, fontWeight: 800, letterSpacing: -6, lineHeight: 1.0, color: C.ink}}>
        <div>
          <Slam f={f} at={a - 2} dur={11}>Dein Speaker.</Slam>
        </div>
        <div>
          <Slam f={f} at={a + 24} dur={11} style={{color: C.copper}}>Dein Event.</Slam>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: btn, transform: `translateY(${(1 - btn) * 24}px) scale(${0.94 + 0.06 * btn})`}}>
        <div style={{height: 112, padding: '0 64px', borderRadius: 56, background: C.copper, color: '#fff', fontFamily: FONT, fontSize: 48, fontWeight: 800, display: 'flex', alignItems: 'center', boxShadow: '0 24px 50px rgba(167,100,60,0.38)'}}>Jetzt unverbindlich anfragen</div>
      </div>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 300, top: 790, width: 480, height: 80, opacity: wm, transform: `translateY(${(1 - wm) * 20}px)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 902, textAlign: 'center', fontFamily: FONT, fontSize: 42, fontWeight: 600, color: C.navy, opacity: url}}>speakingstage.com</div>
    </>
  );
};

// ------------------------------------------------------------------ composition
const speaking = (frame: number) =>
  TL.beats.reduce((m, b) => Math.max(m, Math.min(1, Math.max(0, (frame - (b.v0 - 6)) / 6)) * (1 - Math.min(1, Math.max(0, (frame - (b.v0 + b.vFrames)) / 10)))), 0);

export const Ad: React.FC = () => {
  const f = useCurrentFrame();
  const dark = f <= T.swap;
  const grow = prog(f, T.wipe, 20, inOut3);
  const fade = 1 - prog(f, T.swap, 24, out3);
  const rad = grow * 1700;
  const dcam = darkCam(f);
  const lcam = lightCam(f);
  return (
    <AbsoluteFill style={{background: '#05080d'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #1c2b42 0%, #0e1724 52%, #05080d 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #ffffff 0%, #fbf8f4 55%, #f3ece3 100%)', opacity: dark ? 0 : 1}} />
      {dark ? (
        <World cam={dcam}>
          <CloudCards cam={dcam} f={f} />
        </World>
      ) : (
        <World cam={lcam}>
          <LightWorld f={f} cam={lcam} />
        </World>
      )}
      {dark && f >= B.d2a.start + 4 && (
        <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '50% 60%'}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d'}}>
            <PainTile f={f} at={B.d2a.v0 - 2} kind="search" x={-300} ry={14} />
            <PainTile f={f} at={B.d2b.v0 - 2} kind="euro" x={0} ry={0} />
            <PainTile f={f} at={B.d2c.v0 - 2} kind="cal" x={300} ry={-14} />
          </div>
        </div>
      )}
      {dark && f >= B.d3.start && (
        <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '50% 60%'}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d'}}>
            <OfferDoc f={f} at={B.d3.v0 + 4} x={-330} w={250} h={330} ry={16} rz={-4} lines={[90, 60, 75, 40]} />
            <OfferDoc f={f} at={B.d3.v0 + 14} x={0} w={290} h={250} ry={0} rz={3} lines={[70, 85, 50]} />
            <OfferDoc f={f} at={B.d3.v0 + 24} x={340} w={230} h={380} ry={-16} rz={-2} lines={[80, 45, 90, 65, 55]} />
          </div>
        </div>
      )}

      <DarkText f={f} />
      <LightText f={f} />
      <Cta f={f} />

      {f >= T.wipe && f <= T.swap + 26 && (
        <AbsoluteFill style={{opacity: f <= T.swap ? 1 : fade, background: `radial-gradient(circle at 50% 50%, #ffffff 0, #ffffff ${rad * 0.5}px, rgba(251,244,236,0.92) ${rad * 0.72}px, rgba(255,255,255,0) ${rad}px)`}} />
      )}

      <Audio src={staticFile('audio/ad-music.wav')} volume={(fr) => 0.5 * (1 - 0.5 * speaking(fr))} />
      <Audio src={staticFile('audio/ad-sfx.wav')} volume={(fr) => 0.9 * (1 - 0.35 * speaking(fr))} />
      {TL.beats.map((b) => (
        <Sequence key={b.id} from={b.v0} durationInFrames={b.vFrames + 4}>
          <Audio src={staticFile(b.file)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
