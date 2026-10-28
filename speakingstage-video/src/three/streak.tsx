import React, {useEffect, useMemo} from 'react';
import {CatmullRomCurve3, TubeGeometry, Vector3} from 'three';
import {C} from '../theme';

/** Glowing copper light-trail drawn through 3D points (the leitmotif of the video). */
export const Trail: React.FC<{points: Vector3[]; radius?: number}> = ({points, radius = 0.07}) => {
  const geos = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.3);
    const seg = Math.max(8, points.length * 2);
    return {core: new TubeGeometry(curve, seg, radius, 6, false), glow: new TubeGeometry(curve, seg, radius * 3.2, 6, false)};
  }, [points, radius]);
  useEffect(() => () => {
    geos?.core.dispose();
    geos?.glow.dispose();
  }, [geos]);
  if (!geos) return null;
  return (
    <group>
      <mesh geometry={geos.glow}>
        <meshBasicMaterial color={C.copperLight} transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geos.core}>
        <meshBasicMaterial color={C.copper} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Glowing head of a light trail. */
export const LightHead: React.FC<{position: [number, number, number]; size?: number}> = ({position, size = 0.22}) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[size, 32, 24]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </mesh>
    <mesh>
      <sphereGeometry args={[size * 2.0, 32, 24]} />
      <meshBasicMaterial color={C.copperLight} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
    </mesh>
    <mesh>
      <sphereGeometry args={[size * 3.6, 32, 24]} />
      <meshBasicMaterial color={C.copperLight} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>
);
