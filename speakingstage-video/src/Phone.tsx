import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate} from 'remotion';
import T from './timing.json';
import {C, FONT, prog, sp, inOut} from './theme';
import {Headline} from './Headline';

const PW = 660;
const PH = 1260;
const SW = PW - 32;

const Skeleton: React.FC<{w?: number}> = ({w = 100}) => (
  <div style={{height: 20, borderRadius: 10, background: '#ece8e2', width: `${w}%`}} />
);

const SearchScreen: React.FC<{f: number}> = ({f}) => {
  const {query, typeStart, charFrames, suggest, results, placeholder} = T.search;
  const typed = query.slice(0, Math.max(0, Math.floor((f - typeStart) / charFrames)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const sugg = prog(f, suggest - 40, 10) * (1 - prog(f, results - 4, 6));
  const completions = [' buchen', ' DACH', ' Honorar', ' Vortrag'];
  const card = (i: number) => prog(f, results + i * 4, 12);
  const pulse = 0.5 + 0.5 * Math.sin((f - placeholder) / 5);
  const ph = sp(f, placeholder, 9, 140);
  return (
    <div style={{position: 'absolute', inset: 0, padding: '104px 28px 0', fontFamily: FONT}}>
      <div style={{display: 'flex', alignItems: 'center', height: 84, borderRadius: 42, background: '#f1efec', padding: '0 28px', gap: 16}}>
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth={2.4} strokeLinecap="round">
          <circle cx={10.5} cy={10.5} r={6.5} />
          <path d="M16 16l5 5" />
        </svg>
        <div style={{fontSize: 29, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {typed}
          <span style={{display: 'inline-block', width: 3, height: 32, marginLeft: 2, verticalAlign: -6, background: caret ? C.copper : 'transparent'}} />
        </div>
      </div>
      <div style={{marginTop: 22, opacity: sugg}}>
        {completions.map((c, i) => (
          <div key={i} style={{display: 'flex', gap: 16, alignItems: 'center', height: 74, borderBottom: `1px solid ${C.line}`, color: C.gray, fontSize: 25, fontWeight: 500, transform: `translateY(${(1 - sugg) * 14}px)`}}>
            <span style={{opacity: 0.6}}>⌕</span>
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden'}}>
              <b style={{color: C.ink, fontWeight: 600}}>{typed.length > 22 ? typed.slice(0, 22) + '…' : typed}</b>
              {c}
            </span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 230}}>
        {[0, 1, 2].map((i) => {
          const isPh = i === 1;
          const a = isPh ? Math.min(1, ph * 1.5) : card(i);
          return (
            <div
              key={i}
              style={{
                height: 250,
                marginBottom: 28,
                borderRadius: 34,
                padding: 28,
                display: 'flex',
                gap: 28,
                alignItems: 'center',
                opacity: a,
                transform: `translateY(${(1 - a) * 40}px) scale(${isPh ? 0.9 + ph * 0.1 : 1})`,
                background: isPh ? `${C.copper}0d` : '#faf8f5',
                border: isPh ? `4px dashed ${C.copper}` : `2px solid ${C.line}`,
                boxShadow: isPh ? `0 0 ${30 + pulse * 40}px ${C.copperLight}88` : 'none'
              }}
            >
              {isPh ? (
                <>
                  <div style={{width: 150, height: 150, borderRadius: 36, border: `4px dashed ${C.copper}`, display: 'grid', placeItems: 'center', color: C.copper, fontSize: 90, fontWeight: 300}}>+</div>
                  <div style={{fontSize: 38, fontWeight: 700, color: C.copper, lineHeight: 1.15}}>
                    Hier fehlt
                    <br />
                    Ihr Profil
                  </div>
                </>
              ) : (
                <>
                  <div style={{width: 150, height: 150, borderRadius: 36, background: '#e9e4dd'}} />
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
                    <Skeleton w={80} />
                    <Skeleton w={60} />
                    <Skeleton w={90} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FormScreen: React.FC<{f: number}> = ({f}) => {
  const {fields, charFrames, press, progressEnd} = T.form;
  const fill = prog(f, press + 2, progressEnd - press - 2, inOut);
  const pressed = f >= press && f < press + 6;
  const done = f >= progressEnd + 2;
  const caret = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{position: 'absolute', inset: 0, padding: '104px 36px 0', fontFamily: FONT}}>
      <div style={{fontSize: 46, fontWeight: 800, letterSpacing: -1, color: C.ink}}>Profil einreichen</div>
      <div style={{fontSize: 26, fontWeight: 600, color: C.copper, marginTop: 6}}>Kostenlos · dauert nur wenige Minuten</div>
      <div style={{marginTop: 34}}>
        {fields.map((fl, i) => {
          const typed = fl.text.slice(0, Math.max(0, Math.floor((f - fl.start) / charFrames)));
          const active = f >= fl.start - 4 && f < (fields[i + 1]?.start ?? press) - 4;
          const appear = prog(f, T.form.start + 4 + i * 4, 12);
          return (
            <div key={i} style={{marginBottom: 30, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)`}}>
              <div style={{fontSize: 24, fontWeight: 600, color: C.gray, marginBottom: 10}}>{fl.label}</div>
              <div
                style={{
                  height: 98,
                  borderRadius: 26,
                  padding: '0 28px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 32,
                  fontWeight: 600,
                  color: C.ink,
                  background: '#fff',
                  border: `3px solid ${active ? C.copper : C.line}`,
                  boxShadow: active ? `0 0 0 8px ${C.copper}1f` : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {typed}
                {active && <span style={{display: 'inline-block', width: 3, height: 36, marginLeft: 2, background: caret ? C.copper : 'transparent'}} />}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          bottom: 70,
          height: 124,
          borderRadius: 62,
          overflow: 'hidden',
          background: C.copper,
          transform: `scale(${pressed ? 0.95 : 1})`,
          boxShadow: `0 18px 40px ${C.copper}55`
        }}
      >
        <div style={{position: 'absolute', inset: 0, width: `${fill * 100}%`, background: `linear-gradient(90deg, ${C.copperDark}, ${C.navy})`}} />
        <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 38, fontWeight: 700}}>
          {done ? '✓  Eingereicht' : 'Profil einreichen'}
        </div>
      </div>
    </div>
  );
};

export const PhoneScene: React.FC = () => {
  const f = useCurrentFrame();
  const {start, end} = T.phone;
  if (f < start || f > end) return null;
  const enter = sp(f, start, 15, 90);
  const exit = prog(f, end - 18, 18, inOut);
  const slide = prog(f, T.form.start, 16, inOut);
  const stamp = sp(f, T.form.stamp, 9, 130);
  const floatY = Math.sin(f / 22) * 8;
  const tilt = (1 - enter) * 8;
  return (
    <>
      <Headline from={start + 2} to={T.search.placeholder - 4} lines={[{text: 'Veranstalter'}, {text: 'suchen Speaker.'}]} />
      <Headline from={T.search.placeholder - 4} to={T.form.start + 6} lines={[{text: 'Und Sie?'}, {text: 'Noch nicht gefunden.', accent: true}]} size={92} />
      <Headline from={T.form.start + 8} to={end - 4} lines={[{text: 'Profil einreichen.'}, {text: 'Kostenlos.', accent: true}]} sub="Dauert nur wenige Minuten." />
      <div
        style={{
          position: 'absolute',
          left: (1080 - PW) / 2,
          top: 540,
          width: PW,
          height: PH,
          transform: `translateY(${(1 - enter) * 1000 + exit * 1500 + floatY}px) rotate(${tilt}deg)`,
          filter: `drop-shadow(0 50px 70px rgba(22,33,49,0.28))`
        }}
      >
        <div style={{position: 'absolute', inset: 0, borderRadius: 96, background: C.ink}} />
        <div style={{position: 'absolute', inset: 16, borderRadius: 82, background: '#fff', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: SW / 2 - 70, top: 18, width: 140, height: 38, borderRadius: 19, background: C.ink, zIndex: 5}} />
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${-slide * SW}px)`}}>
            <SearchScreen f={f} />
          </div>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - slide) * SW}px)`}}>
            <FormScreen f={f} />
          </div>
        </div>
      </div>
      {f >= T.form.stamp && (
        <div
          style={{
            position: 'absolute',
            left: 600,
            top: 1170,
            width: 330,
            height: 330,
            borderRadius: '50%',
            border: `10px solid ${C.copper}`,
            background: '#ffffffee',
            color: C.copper,
            fontFamily: FONT,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            opacity: Math.min(1, stamp * 1.4) * (1 - exit),
            transform: `scale(${2.4 - stamp * 1.4}) rotate(-12deg)`,
            boxShadow: `0 30px 60px ${C.copper}44`
          }}
        >
          <div>
            <div style={{fontSize: 40, fontWeight: 600, letterSpacing: 4}}>100 %</div>
            <div style={{fontSize: 62, fontWeight: 800, letterSpacing: -1}}>KOSTENLOS</div>
          </div>
        </div>
      )}
    </>
  );
};
