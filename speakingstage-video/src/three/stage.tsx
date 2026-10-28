import React, {useMemo} from 'react';
import {staticFile} from 'remotion';
import {Vector3} from 'three';
import {C, prog} from '../theme';
import {PingRing} from './bits';
import {loadImage, useTexture} from './tex';
import {LightHead, Trail} from './streak';

export const STAGE_Z = -245;

// audience: [x, row z-offset, scale]
const PEOPLE: [number, number, number][] = [
  [-6.4, 0, 1.15], [-4.7, 0.6, 1.0], [-3.2, 0, 1.1], [-2.0, 1.4, 0.95], [2.1, 1.2, 1.05], [3.3, 0, 1.1], [4.9, 0.7, 1.0], [6.6, 0, 1.2],
  [-7.4, 3.2, 1.1], [-5.6, 3.0, 1.0], [-3.9, 3.4, 1.05], [3.8, 3.1, 1.0], [5.5, 3.3, 1.1], [7.3, 3.0, 1.0],
  [-4.4, 6.0, 1.0], [-2.7, 6.3, 1.05], [2.9, 6.1, 1.0], [4.6, 6.4, 1.05]
];

const Person: React.FC<{x: number; z: number; s: number; f: number; i: number}> = ({x, z, s, f, i}) => (
  <group position={[x, Math.sin(f / 11 + i * 1.9) * 0.05, z]} scale={s}>
    <mesh position={[0, 1.55, 0]}>
      <sphereGeometry args={[0.4, 20, 16]} />
      <meshStandardMaterial color={C.navy} roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.55, 0]} scale={[1, 1.15, 0.62]}>
      <sphereGeometry args={[0.78, 20, 16]} />
      <meshStandardMaterial color={C.navy} roughness={0.7} />
    </mesh>
  </group>
);

export const StageWorld: React.FC<{f: number; start: number; landing: number}> = ({f, start, landing}) => {
  const mark = useTexture('mark-white', 256, 256, async (ctx) => {
    const img = await loadImage(staticFile('mark.png'));
    ctx.drawImage(img, 0, 0, 256, 256);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
  });
  const dropP = prog(f, start + 4, landing - start - 4, (t) => t);
  const drop = useMemo(() => {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 24; i++) pts.push(new Vector3(Math.sin(i * 0.3) * 0.15, 20 - (20 - 0.2) * (i / 24), STAGE_Z));
    return pts;
  }, []);
  const n = Math.floor(dropP * 24);
  const shown = drop.slice(Math.max(0, n - 10), n + 1);
  const spot = prog(f, landing, 22);
  const spotty = spot * (0.9 + 0.1 * Math.sin(f / 3));
  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0, STAGE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7, 64]} />
        <meshBasicMaterial color={C.cream} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.01, STAGE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.4, 4.5, 64]} />
        <meshBasicMaterial color={C.copper} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, STAGE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.4, 64]} />
        <meshBasicMaterial color={C.copperLight} transparent opacity={0.45 * spotty} depthWrite={false} />
      </mesh>

      {/* spotlight cones */}
      {[
        [1, 0.1],
        [0.72, 0.1],
        [0.46, 0.13]
      ].map(([sc, op], i) => (
        <mesh key={i} position={[0, 9, STAGE_Z]}>
          <cylinderGeometry args={[0.2 * sc, 4.4 * sc, 18, 48, 1, true]} />
          <meshBasicMaterial color={C.copperLight} transparent opacity={op * spotty * 1.0} depthWrite={false} side={2} toneMapped={false} />
        </mesh>
      ))}

      {/* lectern + mic */}
      <group position={[0, 0, STAGE_Z]}>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.7, 1.9, 0.95]} />
          <meshStandardMaterial color={C.navy} roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[1.95, 0.14, 1.15]} />
          <meshStandardMaterial color={C.ink} roughness={0.35} metalness={0.5} />
        </mesh>
        <mesh position={[0, 2.5, 0.1]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 10]} />
          <meshStandardMaterial color={C.ink} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 3.12, 0.1]}>
          <capsuleGeometry args={[0.13, 0.28, 6, 12]} />
          <meshStandardMaterial color={C.ink} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 3.12, 0.1]}>
          <torusGeometry args={[0.14, 0.02, 8, 24]} />
          <meshBasicMaterial color={C.copper} />
        </mesh>
        <mesh position={[0, 1.0, 0.485]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial map={mark} transparent toneMapped={false} />
        </mesh>
      </group>

      {/* audience */}
      {PEOPLE.map(([x, dz, s], i) => (
        <Person key={i} x={x} z={STAGE_Z + 15.5 + dz} s={s} f={f} i={i} />
      ))}

      <PingRing position={[0, 0.05, STAGE_Z]} t={prog(f, landing, 40, (t) => t)} size={9} />
      {f < landing + 2 && shown.length > 1 && (
        <>
          <Trail points={shown} radius={0.1} />
          <LightHead position={shown[shown.length - 1].toArray() as [number, number, number]} size={0.3} />
        </>
      )}
    </group>
  );
};
