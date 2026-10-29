import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {BufferGeometry, Color, ExtrudeGeometry, InstancedMesh, Line, LineBasicMaterial, Object3D, Shape, Vector3} from 'three';
import {C, inOut, prog, sp} from '../theme';
import {DOTS, outlinePoints, project} from '../dach';
import {Billboard, PingRing} from './bits';
import {Chip} from './text';
import {LightHead, Trail} from './streak';

export type City = {name: string; lon: number; lat: number; at: number};
const K = 0.02;
const OX = 450;
const OZ = -190;
const OY = 580;
export const toWorld = (px: number, py: number): [number, number] => [(px - OX) * K, OZ + (py - OY) * K];

export const cityWorld = (c: City): Vector3 => {
  const [px, py] = project(c.lon, c.lat);
  const [x, z] = toWorld(px, py);
  return new Vector3(x, 0, z);
};

const ARC = 24;
const HS = 0.62;
const arcPoint = (a: Vector3, b: Vector3, t: number) => new Vector3(a.x + (b.x - a.x) * t, 0.3 + Math.sin(Math.PI * t) * (0.7 + a.distanceTo(b) * 0.12), a.z + (b.z - a.z) * t);

/** Light-head position at frame f, flying in arcs from city to city. */
export const headAt = (f: number, cities: City[]): Vector3 => {
  const w = cities.map(cityWorld);
  if (f <= cities[0].at) return new Vector3(w[0].x, 0.3, w[0].z);
  for (let i = 0; i < cities.length - 1; i++) {
    if (f <= cities[i + 1].at) return arcPoint(w[i], w[i + 1], inOut((f - cities[i].at) / (cities[i + 1].at - cities[i].at)));
  }
  const l = w[w.length - 1];
  return new Vector3(l.x, 0.3, l.z);
};

const TOWERS = [
  {dx: 0, dz: 0, h: 2.4, w: 0.5, c: C.copper},
  {dx: 0.55, dz: 0.2, h: 1.4, w: 0.38, c: C.navy},
  {dx: -0.5, dz: 0.25, h: 1.0, w: 0.36, c: C.navy},
  {dx: 0.2, dz: -0.5, h: 1.7, w: 0.34, c: C.copperDark},
  {dx: -0.3, dz: -0.45, h: 0.8, w: 0.3, c: C.navy}
];

export const MapWorld: React.FC<{f: number; cities: City[]; start: number}> = ({f, cities, start}) => {
  const ref = useRef<InstancedMesh>(null);
  const world = useMemo(() => cities.map(cityWorld), [cities]);
  const shape = useMemo(() => {
    const s = new Shape();
    outlinePoints.forEach(([px, py], i) => {
      const [x, z] = toWorld(px, py);
      if (i === 0) s.moveTo(x, -z);
      else s.lineTo(x, -z);
    });
    s.closePath();
    return s;
  }, []);
  const slab = useMemo(() => new ExtrudeGeometry(shape, {depth: 0.45, bevelEnabled: false, curveSegments: 1}), [shape]);
  const outline = useMemo(() => outlinePoints.map(([px, py]) => {
    const [x, z] = toWorld(px, py);
    return new Vector3(x, 0.02, z);
  }), []);

  const outlineLine = useMemo(() => new Line(new BufferGeometry().setFromPoints(outline.concat(outline[0])), new LineBasicMaterial({color: C.copper})), [outline]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    const col = new Color();
    DOTS.forEach((d, i) => {
      const [x, z] = toWorld(d.x, d.y);
      let lit = 0;
      cities.forEach((c, ci) => {
        if (f >= c.at) {
          const dist = Math.hypot(world[ci].x - x, world[ci].z - z);
          if (dist < 1.9) lit = Math.max(lit, 1 - dist / 1.9);
        }
      });
      const appear = prog(f, start + (d.y / 1160) * 30, 12);
      o.position.set(x, 0.03 + lit * 0.12, z);
      o.scale.setScalar(Math.max(0.001, appear) * (1 + lit * 0.7));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      col.set('#d3cabe').lerp(new Color(C.copper), Math.min(1, lit * 1.3));
      m.setColorAt(i, col);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  // trail through visited cities up to the head
  const trailPts = useMemo(() => {
    if (f < cities[0].at) return [] as Vector3[];
    const pts: Vector3[] = [];
    for (let i = 0; i < cities.length - 1; i++) {
      if (f < cities[i].at) break;
      const t = Math.min(1, inOut((f - cities[i].at) / (cities[i + 1].at - cities[i].at)));
      const n = Math.max(2, Math.ceil(t * ARC));
      for (let k = 0; k <= n; k++) pts.push(arcPoint(world[i], world[i + 1], (k / n) * t));
      if (t < 1) break;
    }
    return pts;
  }, [f, cities, world]);
  const head = headAt(f, cities);
  const showHead = f >= cities[0].at - 12;

  return (
    <group>
      <mesh geometry={slab} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <meshBasicMaterial attach="material-0" color="#f4ece1" toneMapped={false} />
        <meshStandardMaterial attach="material-1" color={C.copperDark} roughness={0.6} />
      </mesh>
      <primitive object={outlineLine} />
      <instancedMesh ref={ref} args={[undefined, undefined, DOTS.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {cities.map((c, i) => {
        const a = sp(f, c.at, 9, 120);
        if (f < c.at) return null;
        return (
          <group key={c.name} position={[world[i].x, 0, world[i].z]}>
            {TOWERS.map((t, k) => (
              <mesh key={k} position={[t.dx, (t.h * HS * a) / 2, t.dz]} scale={[1, Math.max(0.001, a), 1]}>
                <boxGeometry args={[t.w, t.h * HS, t.w]} />
                <meshStandardMaterial color={t.c} metalness={0.2} roughness={0.5} />
              </mesh>
            ))}
            <Billboard position={[0, 2.1 * Math.max(0.2, a), 0]} scale={Math.max(0.01, a)}>
              <Chip text={c.name} fill={C.navy} ink="#ffffff" unit={0.0046} />
            </Billboard>
            <PingRing position={[0, 0.05, 0]} t={prog(f, c.at, 34, (t) => t)} size={4} />
          </group>
        );
      })}

      <Trail points={trailPts} radius={0.07} />
      {showHead && <LightHead position={head.toArray() as [number, number, number]} size={0.2} />}
    </group>
  );
};
