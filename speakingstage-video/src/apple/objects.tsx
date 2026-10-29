import React, {useLayoutEffect, useMemo} from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Matrix4,
  Mesh,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {MeshSurfaceSampler} from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {staticFile} from 'remotion';
import {C} from '../theme';
import {loadImage, rr, useTexture} from '../three/tex';
import {roundedRectShape} from '../three/PhoneModel';

// ------------------------------------------------------------------ deterministic helpers
export const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ------------------------------------------------------------------ hero objects as lists of parts (rendered AND point-sampled)
export type Part = {geo: BufferGeometry; pos: [number, number, number]; rot?: [number, number, number]; color: string; metal: number; rough: number; n: number};

const CHAIR = (): Part[] => [
  {geo: new RoundedBoxGeometry(1.0, 0.1, 0.95, 4, 0.04), pos: [0, 1.0, 0], color: '#efe8de', metal: 0.05, rough: 0.55, n: 1700},
  {geo: new RoundedBoxGeometry(1.0, 0.95, 0.09, 4, 0.04), pos: [0, 1.55, -0.43], rot: [-0.1, 0, 0], color: '#efe8de', metal: 0.05, rough: 0.55, n: 1700},
  ...([[-0.4, -0.38], [0.4, -0.38], [-0.4, 0.38], [0.4, 0.38]] as [number, number][]).map(([x, z]) => ({geo: new CylinderGeometry(0.04, 0.03, 1.0, 16), pos: [x, 0.5, z] as [number, number, number], color: C.copper, metal: 0.85, rough: 0.3, n: 400}))
];

const MIC_TILT: [number, number, number] = [0, 0, 0.2];
const MIC_POS: [number, number, number] = [0, 1.55, 0];
const MIC = (): Part[] => [
  {geo: new SphereGeometry(0.3, 40, 28), pos: [0, 1.15, 0], color: '#cfd3da', metal: 0.9, rough: 0.25, n: 2000},
  {geo: new TorusGeometry(0.24, 0.035, 14, 40), pos: [0, 0.86, 0], rot: [Math.PI / 2, 0, 0], color: C.copper, metal: 0.85, rough: 0.3, n: 500},
  {geo: new CylinderGeometry(0.17, 0.11, 1.5, 36), pos: [0, 0.1, 0], color: '#3a414c', metal: 0.5, rough: 0.35, n: 2000},
  {geo: new CylinderGeometry(0.12, 0.1, 0.18, 28), pos: [0, -0.72, 0], color: '#cfd3da', metal: 0.9, rough: 0.25, n: 500}
];

const partMatrix = (p: Part) => new Matrix4().compose(new Vector3(...p.pos), new Quaternion().setFromEuler(new Euler(...(p.rot ?? [0, 0, 0]))), new Vector3(1, 1, 1));

type Sampled = {pos: Float32Array; col: Float32Array};
export const sampleParts = (parts: Part[], rng: () => number, group?: Matrix4): Sampled => {
  const total = parts.reduce((s, p) => s + p.n, 0);
  const pts: {x: number; y: number; z: number; r: number; g: number; b: number}[] = [];
  const v = new Vector3();
  const c = {r: 0, g: 0, b: 0};
  parts.forEach((p) => {
    // setRandomGenerator exists at runtime but is missing from the type definitions of this three version
    const sampler = (new MeshSurfaceSampler(new Mesh(p.geo)) as unknown as {setRandomGenerator: (f: () => number) => MeshSurfaceSampler}).setRandomGenerator(rng).build();
    const m = partMatrix(p);
    const col = new Color(p.color);
    for (let i = 0; i < p.n; i++) {
      sampler.sample(v);
      v.applyMatrix4(m);
      if (group) v.applyMatrix4(group);
      const k = 0.85 + rng() * 0.3;
      c.r = col.r * k; c.g = col.g * k; c.b = col.b * k;
      pts.push({x: v.x, y: v.y, z: v.z, r: c.r, g: c.g, b: c.b});
    }
  });
  pts.sort((a, b) => a.y - b.y);
  const pos = new Float32Array(total * 3);
  const colr = new Float32Array(total * 3);
  pts.forEach((q, i) => {
    pos.set([q.x, q.y, q.z], i * 3);
    colr.set([q.r, q.g, q.b], i * 3);
  });
  return {pos, col: colr};
};

const meshes = (parts: Part[], opacity: number, ghost: boolean) =>
  parts.map((p, i) => (
    <mesh key={i} geometry={p.geo} position={p.pos} rotation={p.rot}>
      <meshStandardMaterial color={p.color} metalness={p.metal} roughness={p.rough} transparent={opacity < 1 || ghost} opacity={opacity} depthWrite={opacity >= 1 && !ghost} />
    </mesh>
  ));

export const Chair: React.FC<{opacity?: number; ghost?: boolean}> = ({opacity = 1, ghost = false}) => {
  const parts = useMemo(CHAIR, []);
  if (opacity <= 0.003) return null;
  return <group>{meshes(parts, opacity, ghost)}</group>;
};

export const Mic: React.FC<{opacity?: number; ghost?: boolean; spin?: number}> = ({opacity = 1, ghost = false, spin = 0}) => {
  const parts = useMemo(MIC, []);
  if (opacity <= 0.003) return null;
  return (
    <group position={MIC_POS} rotation={[MIC_TILT[0], spin, MIC_TILT[2]]}>
      {meshes(parts, opacity, ghost)}
    </group>
  );
};

/** Mirror image below a floor at y = floorY, faded by a low opacity (soft reflection). */
export const Reflect: React.FC<{floorY: number; children: React.ReactNode}> = ({floorY, children}) => (
  <group scale={[1, -1, 1]} position={[0, 2 * floorY, 0]}>
    {children}
  </group>
);

// ------------------------------------------------------------------ morph: chair -> point cloud -> microphone
export const MorphPoints: React.FC<{t: number; alpha: number; ghost?: boolean}> = ({t, alpha, ghost = false}) => {
  const data = useMemo(() => {
    const rng = lcg(11);
    const a = sampleParts(CHAIR(), rng);
    const micGroup = new Matrix4().compose(new Vector3(...MIC_POS), new Quaternion().setFromEuler(new Euler(...MIC_TILT)), new Vector3(1, 1, 1));
    const b = sampleParts(MIC(), rng, micGroup);
    const n = a.pos.length / 3;
    const dir = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const th = rng() * Math.PI * 2;
      const ph = Math.acos(2 * rng() - 1);
      dir.set([Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th) * 0.7, Math.cos(ph)], i * 3);
      delay[i] = (1 - i / n) * 0.28 + rng() * 0.05;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new BufferAttribute(new Float32Array(n * 3), 3));
    return {a, b, dir, delay, n, geo};
  }, []);

  useLayoutEffect(() => {
    const {a, b, dir, delay, n, geo} = data;
    const P = geo.getAttribute('position') as BufferAttribute;
    const Cc = geo.getAttribute('color') as BufferAttribute;
    for (let i = 0; i < n; i++) {
      const u = clamp01((t - delay[i]) / 0.72);
      const e = ease(u);
      const bump = Math.sin(Math.PI * e);
      const ix = i * 3;
      let x = a.pos[ix] * (1 - e) + b.pos[ix] * e;
      let y = a.pos[ix + 1] * (1 - e) + b.pos[ix + 1] * e;
      let z = a.pos[ix + 2] * (1 - e) + b.pos[ix + 2] * e;
      const amp = 1.25 * bump;
      x += dir[ix] * amp;
      y += dir[ix + 1] * amp;
      z += dir[ix + 2] * amp;
      const ang = bump * 0.9;
      const cs = Math.cos(ang);
      const sn = Math.sin(ang);
      const rx = x * cs - z * sn;
      const rz = x * sn + z * cs;
      P.setXYZ(i, rx, y, rz);
      Cc.setXYZ(i, a.col[ix] * (1 - e) + b.col[ix] * e, a.col[ix + 1] * (1 - e) + b.col[ix + 1] * e, a.col[ix + 2] * (1 - e) + b.col[ix + 2] * e);
    }
    P.needsUpdate = true;
    Cc.needsUpdate = true;
  });

  if (alpha <= 0.003) return null;
  return (
    <points geometry={data.geo} frustumCulled={false} scale={ghost ? [1, -1, 1] : [1, 1, 1]}>
      <pointsMaterial size={0.045} vertexColors transparent opacity={alpha} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
    </points>
  );
};

// ------------------------------------------------------------------ light, floor and atmosphere (dark world)
export const FloorGlow: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const tex = useTexture('apple-floor', 512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(150,175,215,0.32)');
    g.addColorStop(0.5, 'rgba(90,115,160,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });
  const warm = useTexture('apple-pool', 512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(224,160,116,0.55)');
    g.addColorStop(1, 'rgba(224,160,116,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });
  return (
    <group>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial map={warm} transparent opacity={opacity * 0.5} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
};

export const SpotCone: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const tex = useTexture('apple-cone', 64, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
  });
  return (
    <mesh position={[0, 4.6, 0]}>
      <cylinderGeometry args={[0.2, 2.6, 9.2, 48, 1, true]} />
      <meshBasicMaterial map={tex} color="#b9c9e6" transparent opacity={0.16 * opacity} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} />
    </mesh>
  );
};

/** Dark, blurred audience photo far behind the stage (low-res source, so it is blurred and dimmed on purpose). */
export const AudiencePlate: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const tex = useTexture('apple-audience', 1024, 760, async (ctx) => {
    const img = await loadImage(staticFile('apple/audience.jpg'));
    ctx.filter = 'blur(14px) brightness(0.62) saturate(1.15)';
    ctx.drawImage(img, -40, -40, 1104, 840);
    ctx.filter = 'none';
    const v = ctx.createRadialGradient(512, 380, 120, 512, 380, 560);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5,8,13,1)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1024, 760);
  });
  return (
    <mesh position={[0, 4.2, -10]}>
      <planeGeometry args={[24, 17.8]} />
      <meshBasicMaterial map={tex} transparent opacity={0.5 * opacity} depthWrite={false} />
    </mesh>
  );
};

export const Dust: React.FC<{f: number; opacity?: number}> = ({f, opacity = 1}) => {
  const geo = useMemo(() => {
    const rng = lcg(5);
    const n = 280;
    const g = new BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(rng() - 0.5) * 6, rng() * 5.6, (rng() - 0.5) * 6], i * 3);
    g.setAttribute('position', new BufferAttribute(p, 3));
    return g;
  }, []);
  useLayoutEffect(() => {
    const P = geo.getAttribute('position') as BufferAttribute;
    const rng = lcg(5);
    for (let i = 0; i < P.count; i++) {
      const x = (rng() - 0.5) * 6;
      const y0 = rng() * 5.6;
      const z = (rng() - 0.5) * 6;
      P.setXYZ(i, x, (y0 + f * 0.006 * (0.5 + (i % 5) * 0.2)) % 5.6, z);
    }
    P.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.03} color="#f3e6d8" transparent opacity={0.55 * opacity} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
    </points>
  );
};

// ------------------------------------------------------------------ portrait on a floating glass panel (light world)
export const PANEL = {w: 1.8, h: 2.36, r: 0.12};

const roundedPlane = (w: number, h: number, r: number) => {
  const g = new ExtrudeGeometry(roundedRectShape(w, h, r), {depth: 0.001, bevelEnabled: false, curveSegments: 24});
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
};

export const GlassPanel: React.FC<{f: number; opacity?: number; ghost?: boolean; sweep: number}> = ({opacity = 1, ghost = false, sweep}) => {
  const body = useMemo(() => new ExtrudeGeometry(roundedRectShape(PANEL.w, PANEL.h, PANEL.r), {depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 4, curveSegments: 28}), []);
  const photoGeo = useMemo(() => roundedPlane(PANEL.w - 0.1, PANEL.h - 0.1, PANEL.r - 0.03), []);
  const photo = useTexture('apple-portrait', 1200, 1500, async (ctx) => {
    const img = await loadImage(staticFile('chris/photo1.jpg'));
    const s = Math.max(1200 / img.width, 1500 / img.height);
    ctx.drawImage(img, (1200 - img.width * s) / 2, (1500 - img.height * s) / 2, img.width * s, img.height * s);
  });
  const hi = useTexture('apple-sweep', 512, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(-0.5);
    ctx.fillRect(-90, -420, 180, 840);
    ctx.restore();
  });
  if (opacity <= 0.003) return null;
  if (ghost) {
    return (
      <mesh geometry={photoGeo}>
        <meshBasicMaterial map={photo} transparent opacity={opacity * 0.12} depthWrite={false} toneMapped={false} />
      </mesh>
    );
  }
  return (
    <group>
      <mesh geometry={body} position={[0, 0, -0.03]} renderOrder={1}>
        <meshStandardMaterial color="#ffffff" roughness={0.12} metalness={0.1} transparent opacity={0.55 * opacity} />
      </mesh>
      <mesh geometry={photoGeo} position={[0, 0, 0.07]} renderOrder={2}>
        <meshBasicMaterial map={photo} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      <mesh geometry={photoGeo} position={[0, 0, 0.072]} renderOrder={3}>
        <meshBasicMaterial map={hi} transparent opacity={opacity * 0.6} depthWrite={false} toneMapped={false} />
      </mesh>
      <HighlightSweep sweep={sweep} texture={hi} geo={photoGeo} opacity={opacity} />
    </group>
  );
};

/** moving specular band across the glass (the soft highlight of an Apple display) */
const HighlightSweep: React.FC<{sweep: number; texture: any; geo: BufferGeometry; opacity: number}> = ({sweep, texture, geo, opacity}) => {
  useLayoutEffect(() => {
    texture.offset.x = 0.9 - sweep * 1.8;
  });
  return null;
};
