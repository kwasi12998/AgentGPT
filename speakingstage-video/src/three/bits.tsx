import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {Color, DoubleSide, Group, InstancedMesh, Object3D} from 'three';
import {C} from '../theme';
import {rr, useTexture} from './tex';

/** Keeps its children facing the camera. */
export const Billboard: React.FC<{position: [number, number, number]; scale?: number; children: React.ReactNode}> = ({position, scale = 1, children}) => {
  const ref = useRef<Group>(null);
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    ref.current?.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {children}
    </group>
  );
};

/** Soft contact shadow under floating cards. */
export const SoftShadow: React.FC<{w: number; h: number; opacity?: number}> = ({w, h, opacity = 0.22}) => {
  const tex = useTexture('shadow', 256, 256, (ctx) => {
    ctx.filter = 'blur(26px)';
    ctx.fillStyle = '#16213199';
    rr(ctx, 56, 56, 144, 144, 28);
    ctx.fill();
  });
  return (
    <mesh position={[0.08, -0.14, -0.04]}>
      <planeGeometry args={[w * 1.5, h * 1.4]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
};

/** Copper dust that streaks past the camera during flights. */
export const Particles: React.FC<{count?: number; zFrom?: number; zTo?: number}> = ({count = 700, zFrom = 30, zTo = -300}) => {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    let seed = 11;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const o = new Object3D();
    const col = new Color();
    for (let i = 0; i < count; i++) {
      let x = (rnd() - 0.5) * 30;
      let y = (rnd() - 0.5) * 22;
      if (Math.abs(x) < 2.2 && Math.abs(y) < 2.2) x += x < 0 ? -3 : 3;
      o.position.set(x, y, zFrom + (zTo - zFrom) * rnd());
      const s = 0.04 + rnd() * 0.1;
      o.scale.set(s, s, s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      col.set(rnd() > 0.4 ? C.copperLight : C.copper);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count, zFrom, zTo]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

/** Expanding ping ring on the ground / in space. */
export const PingRing: React.FC<{position: [number, number, number]; t: number; size?: number; flat?: boolean}> = ({position, t, size = 3, flat = true}) => {
  if (t <= 0 || t >= 1) return null;
  const r = 0.2 + t * size;
  return (
    <mesh position={position} rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <ringGeometry args={[r, r + 0.07 * (1 - t) + 0.01, 64]} />
      <meshBasicMaterial color={C.copper} transparent opacity={1 - t} side={DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};
