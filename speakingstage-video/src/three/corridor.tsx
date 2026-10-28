import React from 'react';
import {Easing} from 'remotion';
import {Vector3, QuadraticBezierCurve3} from 'three';
import {C, prog, sp} from '../theme';
import {PingRing} from './bits';
import {GapCard, MyCard, SPEAKERS, SpeakerCard} from './cards';
import {PhoneModel} from './PhoneModel';
import {TextPlane} from './text';

export const PHONE_POS: [number, number, number] = [0, -0.1, -146];
export const GAP_POS: [number, number, number] = [0, 0.1, -155];

const slot = (i: number) => {
  const left = i % 2 === 0;
  return {
    left,
    pos: [left ? -1.3 : 1.3, ((i % 3) - 1) * 0.5, -76 - 5.6 * i] as [number, number, number],
    yaw: left ? 0.3 : -0.3
  };
};

const shardDirs = Array.from({length: 30}, (_, i) => {
  const a = (i / 30) * Math.PI * 2 + (i % 3) * 0.2;
  return {dx: Math.cos(a), dy: Math.sin(a), dz: ((i * 37) % 10) / 10 - 0.3, s: 0.06 + ((i * 53) % 10) / 90};
});

const Burst: React.FC<{center: [number, number, number]; t: number}> = ({center, t}) => {
  if (t <= 0 || t >= 1) return null;
  const e = Easing.out(Easing.cubic)(t);
  return (
    <group position={center}>
      {shardDirs.map((d, i) => (
        <mesh key={i} position={[d.dx * e * 4.6, d.dy * e * 4.6, d.dz * e * 2]} rotation={[t * 6 + i, t * 5, i]} scale={d.s * (1 - t) * 3}>
          <boxGeometry args={[1, 1, 0.3]} />
          <meshBasicMaterial color={i % 3 ? C.copper : C.copperLight} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

// the roster wall behind the phone: [x, y, speaker index]
const WALL: [number, number, number][] = [
  [-2.25, 2.7, 0], [-2.25, 0, 1], [-2.25, -2.7, 2],
  [2.25, 2.7, 3], [2.25, 0, 4], [2.25, -2.7, 5],
  [-4.2, 2.7, 6], [-4.2, 0, 7], [4.2, 2.7, 8], [4.2, 0, 9]
];

type Cfg = {
  s2: {cards: number[]; gap: number};
  s3: {rec: number; launch: number; snap: number; stamp: number};
};

export const CorridorWorld: React.FC<{f: number; cfg: Cfg}> = ({f, cfg}) => {
  const {cards, gap} = cfg.s2;
  const {rec, launch, snap, stamp} = cfg.s3;
  const phoneIn = sp(f, gap - 14, 14, 70);
  const gapIn = sp(f, gap, 12, 90);
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);

  // the user's own card flies out of the phone and snaps into the empty slot
  const flight = Easing.inOut(Easing.cubic)(prog(f, launch, snap - launch, (t) => t));
  const curve = new QuadraticBezierCurve3(new Vector3(0, 0.5, PHONE_POS[2] + 0.4), new Vector3(0, 5.6, -142), new Vector3(...GAP_POS));
  const cp = curve.getPoint(flight);
  const cardScale = 0.5 + flight * 0.5;
  const snapped = f >= snap;
  const settle = sp(f, snap, 8, 200);

  const stampS = sp(f, stamp, 10, 130);
  const exit = prog(f, snap + 6, 20);

  return (
    <group>
      {SPEAKERS.map((s, i) => {
        const sl = slot(i);
        const a = sp(f, cards[i], 11, 120);
        if (f < cards[i]) return null;
        return (
          <group
            key={s.slug}
            position={[sl.pos[0] * (1 + (1 - a) * 0.8), sl.pos[1] + (1 - a) * (i % 2 ? 1.6 : -1.6), sl.pos[2]]}
            rotation={[0, sl.yaw + (1 - a) * (sl.left ? 1.4 : -1.4), 0]}
            scale={Math.max(0.01, a) * 0.85}
          >
            <group position={[0, Math.sin(f / 24 + i) * 0.08, 0]}>
              <SpeakerCard slug={s.slug} name={s.name} topic={s.topic} />
            </group>
          </group>
        );
      })}

      {WALL.map(([x, y, si], i) => {
        const at = gap + 4 + i * 5;
        const a = sp(f, at, 11, 120);
        if (f < at) return null;
        const sp0 = SPEAKERS[si];
        return (
          <group key={sp0.slug} position={[x * (1 + (1 - a) * 0.5), y + (1 - a) * (i % 2 ? 2 : -2), -158]} rotation={[0, x < 0 ? 0.14 : -0.14, 0]} scale={Math.max(0.01, a) * 0.7}>
            <group position={[0, Math.sin(f / 26 + i) * 0.07, 0]}>
              <SpeakerCard slug={sp0.slug} name={sp0.name} topic={sp0.topic} />
            </group>
          </group>
        );
      })}

      {f >= gap && !snapped && (
        <group position={GAP_POS} scale={Math.max(0.01, gapIn) * 0.9}>
          <GapCard pulse={pulse} />
        </group>
      )}

      {f >= gap - 14 && (
        <group position={[PHONE_POS[0], PHONE_POS[1] + (1 - phoneIn) * -5 + Math.sin(f / 20) * 0.1 - exit * 7, PHONE_POS[2] + exit * 3]} rotation={[exit * 0.6, Math.sin(f / 60) * 0.12 + (1 - phoneIn) * -1, 0]} scale={(0.7 + phoneIn * 0.3) * (1 - exit * 0.5)}>
          <PhoneModel seq="form" frame={f - rec} count={240} />
        </group>
      )}

      {f >= launch && (
        <group position={snapped ? [GAP_POS[0], GAP_POS[1] + Math.sin(f / 22) * 0.06, GAP_POS[2]] : [cp.x, cp.y, cp.z]} scale={snapped ? 0.9 * (1 + (1 - settle) * 0.12) : cardScale * 0.9} rotation={[0, snapped ? 0 : flight * 0.4 - 0.2, snapped ? 0 : (1 - flight) * 0.3]}>
          <MyCard />
        </group>
      )}

      <Burst center={[GAP_POS[0], GAP_POS[1], GAP_POS[2] + 0.3]} t={prog(f, snap, 28, (t) => t)} />
      <PingRing position={[GAP_POS[0], GAP_POS[1], GAP_POS[2] + 0.2]} t={prog(f, snap, 26, (t) => t)} size={7} flat={false} />

      {f >= stamp && (
        <group position={[0.35, -2.5, -141.6]} rotation={[0, 0, -0.14]} scale={Math.max(0.01, 3.2 - 2.2 * stampS)}>
          <TextPlane text="100 %" fontPx={90} weight={700} color={C.copper} unit={0.0034} position={[0, 0.46, 0]} opacity={Math.min(1, stampS * 1.5)} />
          <TextPlane text="KOSTENLOS" fontPx={150} weight={800} color={C.copper} layers={10} layerStep={0.014} layerColor={C.copperDark} unit={0.0033} opacity={Math.min(1, stampS * 1.5)} />
        </group>
      )}
    </group>
  );
};
