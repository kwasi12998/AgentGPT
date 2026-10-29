import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  PMREMGenerator,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useThree} from '@react-three/fiber';
import {staticFile} from 'remotion';
import {C} from '../theme';
import {loadImage, useTexture} from '../three/tex';
import {roundedRectShape} from '../three/PhoneModel';
import {clamp01, ease, lcg, sampleParts, type Part} from '../apple/objects';
import {PANEL} from '../apple/objects';

// ------------------------------------------------------------------ image based light (glints on metal and glass)
export const Env: React.FC<{intensity: number}> = ({intensity}) => {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => {
    const pm = new PMREMGenerator(gl);
    const rt = pm.fromScene(new RoomEnvironment(), 0.04);
    pm.dispose();
    return rt;
  }, [gl]);
  scene.environment = env.texture;
  (scene as unknown as {environmentIntensity: number}).environmentIntensity = intensity;
  useLayoutEffect(() => () => {
    scene.environment = null;
  }, [scene]);
  return null;
};

// ------------------------------------------------------------------ parts (render AND sample)
const placeAt = (p: Part, M: Matrix4): Part => {
  const local = new Matrix4().compose(new Vector3(...p.pos), new Quaternion().setFromEuler(new Euler(...(p.rot ?? [0, 0, 0]))), new Vector3(1, 1, 1));
  const w = M.clone().multiply(local);
  const pos = new Vector3();
  const q = new Quaternion();
  w.decompose(pos, q, new Vector3());
  const e = new Euler().setFromQuaternion(q);
  return {...p, pos: [pos.x, pos.y, pos.z], rot: [e.x, e.y, e.z]};
};

type RPart = Part & {wire?: boolean};
const fit = (parts: RPart[], N: number): RPart[] => {
  const sum = parts.reduce((s, p) => s + (p.wire ? 0 : p.n), 0);
  const out = parts.map((p) => ({...p, n: p.wire ? 0 : Math.round((p.n * N) / sum)}));
  const diff = N - out.reduce((s, p) => s + p.n, 0);
  const big = out.reduce((bi, p, i) => (p.n > out[bi].n ? i : bi), 0);
  out[big].n += diff;
  return out;
};

const LEATHER = '#ebe3d8';
const N_POINTS = 5200;

export const CHAIR2 = (): RPart[] => {
  const legs: RPart[] = ([[-0.4, -0.36, 0.06], [0.4, -0.36, -0.06], [-0.4, 0.36, 0.05], [0.4, 0.36, -0.05]] as [number, number, number][]).map(([x, z, r]) => ({
    geo: new CylinderGeometry(0.034, 0.022, 0.98, 20),
    pos: [x, 0.49, z],
    rot: [0, 0, r],
    color: C.copper,
    metal: 0.95,
    rough: 0.2,
    n: 300
  }));
  return fit(
    [
      {geo: new RoundedBoxGeometry(0.98, 0.15, 0.94, 5, 0.06), pos: [0, 1.04, 0], color: LEATHER, metal: 0.05, rough: 0.42, n: 1300},
      {geo: new RoundedBoxGeometry(0.88, 0.05, 0.84, 3, 0.02), pos: [0, 0.94, 0], color: C.copper, metal: 0.95, rough: 0.22, n: 300},
      {geo: new RoundedBoxGeometry(0.94, 0.84, 0.11, 5, 0.05), pos: [0, 1.66, -0.4], rot: [-0.12, 0, 0], color: LEATHER, metal: 0.05, rough: 0.42, n: 1300},
      {geo: new RoundedBoxGeometry(0.98, 0.88, 0.04, 3, 0.02), pos: [0, 1.66, -0.47], rot: [-0.12, 0, 0], color: C.copper, metal: 0.95, rough: 0.22, n: 300},
      ...legs,
      {geo: new CylinderGeometry(0.015, 0.015, 0.8, 12), pos: [0, 0.3, 0.36], rot: [0, 0, Math.PI / 2], color: C.copper, metal: 0.95, rough: 0.2, n: 160},
      {geo: new CylinderGeometry(0.015, 0.015, 0.8, 12), pos: [0, 0.3, -0.36], rot: [0, 0, Math.PI / 2], color: C.copper, metal: 0.95, rough: 0.2, n: 160}
    ],
    N_POINTS
  );
};

const CHROME = '#d3d8df';
export const MIC2 = (): RPart[] => {
  const head = new Matrix4().compose(new Vector3(0, 1.8, 0), new Quaternion().setFromEuler(new Euler(0, 0, 0.3)), new Vector3(1, 1, 1));
  const h = (p: RPart): RPart => placeAt(p, head);
  return fit(
    [
      {geo: new CylinderGeometry(0.4, 0.43, 0.06, 56), pos: [0, 0.03, 0], color: '#262c35', metal: 0.9, rough: 0.28, n: 520},
      {geo: new CylinderGeometry(0.022, 0.022, 1.62, 20), pos: [0, 0.86, 0], color: CHROME, metal: 1, rough: 0.16, n: 360},
      {geo: new CylinderGeometry(0.05, 0.05, 0.2, 24), pos: [0, 1.72, 0], color: CHROME, metal: 1, rough: 0.16, n: 160},
      h({geo: new CylinderGeometry(0.075, 0.05, 0.62, 40), pos: [0, 0.02, 0], color: '#2a3039', metal: 0.7, rough: 0.32, n: 1100}),
      h({geo: new SphereGeometry(0.118, 40, 28), pos: [0, 0.4, 0], color: '#dfe3e8', metal: 0.95, rough: 0.26, n: 1800}),
      h({geo: new SphereGeometry(0.121, 20, 14), pos: [0, 0.4, 0], color: '#4a525e', metal: 0.4, rough: 0.6, n: 0, wire: true}),
      h({geo: new TorusGeometry(0.083, 0.014, 14, 40), pos: [0, 0.285, 0], rot: [Math.PI / 2, 0, 0], color: C.copper, metal: 0.95, rough: 0.22, n: 340}),
      h({geo: new CylinderGeometry(0.052, 0.045, 0.06, 28), pos: [0, -0.31, 0], color: CHROME, metal: 1, rough: 0.18, n: 140})
    ],
    N_POINTS
  );
};

const renderParts = (parts: RPart[], opacity: number, ghost: boolean) =>
  parts.map((p, i) => (
    <mesh key={i} geometry={p.geo} position={p.pos} rotation={p.rot} renderOrder={ghost ? -1 : 0}>
      {p.wire ? (
        <meshBasicMaterial color={p.color} wireframe transparent opacity={0.55 * opacity} depthWrite={false} />
      ) : (
        <meshStandardMaterial color={p.color} metalness={p.metal} roughness={p.rough} transparent={opacity < 1 || ghost} opacity={opacity} depthWrite={opacity >= 1 && !ghost} envMapIntensity={1.2} />
      )}
    </mesh>
  ));

export const Chair2: React.FC<{opacity?: number; ghost?: boolean}> = ({opacity = 1, ghost = false}) => {
  const parts = useMemo(CHAIR2, []);
  if (opacity <= 0.003) return null;
  return <group>{renderParts(parts, opacity, ghost)}</group>;
};
export const Mic2: React.FC<{opacity?: number; ghost?: boolean}> = ({opacity = 1, ghost = false}) => {
  const parts = useMemo(MIC2, []);
  if (opacity <= 0.003) return null;
  return <group>{renderParts(parts, opacity, ghost)}</group>;
};
export const Mirror: React.FC<{children: React.ReactNode}> = ({children}) => <group scale={[1, -1, 1]}>{children}</group>;

// ------------------------------------------------------------------ morph chair -> shards of light -> microphone
const SHARDS = 1000;
export const Morph: React.FC<{t: number; glow: number; shard: number; ghost?: boolean}> = ({t, glow, shard, ghost = false}) => {
  const data = useMemo(() => {
    const rng = lcg(23);
    const a = sampleParts(CHAIR2().filter((p) => !p.wire), rng);
    const b = sampleParts(MIC2().filter((p) => !p.wire), rng);
    const n = a.pos.length / 3;
    const dir = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    const axis = new Float32Array(SHARDS * 3);
    const size = new Float32Array(SHARDS);
    for (let i = 0; i < n; i++) {
      const th = rng() * Math.PI * 2;
      const ph = Math.acos(2 * rng() - 1);
      dir.set([Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th) * 0.8, Math.cos(ph)], i * 3);
      delay[i] = (1 - i / n) * 0.3 + rng() * 0.05;
    }
    for (let j = 0; j < SHARDS; j++) {
      const v = new Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
      axis.set([v.x, v.y, v.z], j * 3);
      size[j] = 0.6 + rng() * 0.9;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new BufferAttribute(new Float32Array(n * 3), 3));
    return {a, b, dir, delay, axis, size, n, geo};
  }, []);
  const shardRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const {a, b, dir, delay, axis, size, n, geo} = data;
    const P = geo.getAttribute('position') as BufferAttribute;
    const Cc = geo.getAttribute('color') as BufferAttribute;
    const stride = Math.floor(n / SHARDS);
    const m = new Matrix4();
    const q = new Quaternion();
    const ax = new Vector3();
    const pos = new Vector3();
    const sc = new Vector3();
    const col = new Color();
    for (let i = 0; i < n; i++) {
      const u = clamp01((t - delay[i]) / 0.7);
      const e = ease(u);
      const bump = Math.sin(Math.PI * e);
      const ix = i * 3;
      let x = a.pos[ix] * (1 - e) + b.pos[ix] * e;
      let y = a.pos[ix + 1] * (1 - e) + b.pos[ix + 1] * e;
      let z = a.pos[ix + 2] * (1 - e) + b.pos[ix + 2] * e;
      const amp = 2.0 * bump;
      x += dir[ix] * amp;
      y += dir[ix + 1] * amp;
      z += dir[ix + 2] * amp;
      const ang = bump * 1.4;
      const cs = Math.cos(ang);
      const sn = Math.sin(ang);
      const rx = x * cs - z * sn;
      const rz = x * sn + z * cs;
      P.setXYZ(i, rx, y, rz);
      const cr = a.col[ix] * (1 - e) + b.col[ix] * e;
      const cg = a.col[ix + 1] * (1 - e) + b.col[ix + 1] * e;
      const cb = a.col[ix + 2] * (1 - e) + b.col[ix + 2] * e;
      Cc.setXYZ(i, cr, cg, cb);
      if (i % stride === 0 && i / stride < SHARDS && shardRef.current) {
        const j = i / stride;
        ax.set(axis[j * 3], axis[j * 3 + 1], axis[j * 3 + 2]);
        q.setFromAxisAngle(ax, bump * 7 + j);
        pos.set(rx, y, rz);
        const s = size[j] * Math.min(1, bump * 2.2);
        sc.set(0.1 * s, 0.014 * s, 0.07 * s);
        m.compose(pos, q, sc);
        shardRef.current.setMatrixAt(j, m);
        col.setRGB(cr * 1.3 + 0.12, cg * 1.2 + 0.1, cb * 1.15 + 0.08);
        shardRef.current.setColorAt(j, col);
      }
    }
    P.needsUpdate = true;
    Cc.needsUpdate = true;
    if (shardRef.current) {
      shardRef.current.instanceMatrix.needsUpdate = true;
      if (shardRef.current.instanceColor) shardRef.current.instanceColor.needsUpdate = true;
    }
  });

  const sGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  return (
    <group scale={ghost ? [1, -1, 1] : [1, 1, 1]}>
      {glow > 0.003 && (
        <points geometry={data.geo} frustumCulled={false} renderOrder={ghost ? -1 : 0}>
          <pointsMaterial size={0.05} vertexColors transparent opacity={glow} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
        </points>
      )}
      {!ghost && shard > 0.003 && (
        <instancedMesh ref={shardRef} args={[sGeo, undefined, SHARDS]} frustumCulled={false}>
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.18} envMapIntensity={1.6} emissive="#a7643c" emissiveIntensity={0.35} />
        </instancedMesh>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ hall: rows of empty chairs, floor, beams, bokeh, haze
export const Crowd: React.FC = () => {
  const geo = useMemo(() => {
    const bx = (w: number, h: number, d: number, x: number, y: number, z: number) => new BoxGeometry(w, h, d).translate(x, y, z);
    return mergeGeometries([bx(0.9, 0.1, 0.85, 0, 0.55, 0), bx(0.9, 0.85, 0.08, 0, 1.05, -0.4), bx(0.06, 0.55, 0.06, -0.4, 0.27, -0.36), bx(0.06, 0.55, 0.06, 0.4, 0.27, -0.36), bx(0.06, 0.55, 0.06, -0.4, 0.27, 0.36), bx(0.06, 0.55, 0.06, 0.4, 0.27, 0.36)])!;
  }, []);
  const ref = useRef<InstancedMesh>(null);
  const ROWS = 20;
  const COLS = 7;
  const count = ROWS * COLS * 2;
  useLayoutEffect(() => {
    const m = new Matrix4();
    const rng = lcg(3);
    const col = new Color();
    let k = 0;
    for (let r = 0; r < ROWS; r++) {
      for (const side of [-1, 1]) {
        for (let c = 0; c < COLS; c++) {
          const x = side * (1.4 + c * 1.12);
          const z = 5.4 + r * 1.45;
          const yaw = Math.PI + (rng() - 0.5) * 0.04;
          m.compose(new Vector3(x, 0, z), new Quaternion().setFromEuler(new Euler(0, yaw, 0)), new Vector3(1, 1, 1));
          ref.current!.setMatrixAt(k, m);
          const v = 0.8 + rng() * 0.4;
          col.setRGB(0.2 * v, 0.26 * v, 0.36 * v);
          ref.current!.setColorAt(k, col);
          k++;
        }
      }
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color="#ffffff" metalness={0.25} roughness={0.5} envMapIntensity={0.6} />
    </instancedMesh>
  );
};

export const Floor: React.FC = () => (
  <mesh position={[0, -0.002, 10]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
    <planeGeometry args={[90, 90]} />
    <meshStandardMaterial color="#0a1018" metalness={0.5} roughness={0.35} transparent opacity={0.88} depthWrite={false} envMapIntensity={0.5} />
  </mesh>
);

export const Beam: React.FC<{from: [number, number, number]; to: [number, number, number]; color: string; opacity: number; width?: number}> = ({from, to, color, opacity, width = 2.4}) => {
  const tex = useTexture('apple2-cone', 64, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.2)');
    g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
  });
  const {q, len} = useMemo(() => {
    const d = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    return {len: d.length(), q: new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), d.clone().normalize())};
  }, [from, to]);
  return (
    <group position={from} quaternion={q}>
      <mesh position={[0, -len / 2, 0]}>
        <cylinderGeometry args={[0.12, width, len, 40, 1, true]} />
        <meshBasicMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} fog={false} />
      </mesh>
    </group>
  );
};

export const Bokeh: React.FC<{opacity: number}> = ({opacity}) => {
  const tex = useTexture('apple2-bokeh', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const geo = useMemo(() => {
    const rng = lcg(9);
    const n = 46;
    const g = new BufferGeometry();
    const p = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    const warm = new Color('#e0a074');
    const cool = new Color('#8fa9d6');
    for (let i = 0; i < n; i++) {
      p.set([(rng() - 0.5) * 34, 1 + rng() * 9, -9 - rng() * 14], i * 3);
      const col = (rng() > 0.45 ? warm : cool).clone().multiplyScalar(0.5 + rng() * 0.5);
      c.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute('position', new BufferAttribute(p, 3));
    g.setAttribute('color', new BufferAttribute(c, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={1.5} vertexColors transparent opacity={0.55 * opacity} depthWrite={false} blending={AdditiveBlending} sizeAttenuation fog={false} />
    </points>
  );
};

export const Motes: React.FC<{f: number; opacity: number; box: [number, number, number]; center: [number, number, number]; color: string; size?: number; count?: number; speed?: number}> = ({f, opacity, box, center, color, size = 0.03, count = 260, speed = 0.006}) => {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useLayoutEffect(() => {
    const P = geo.getAttribute('position') as BufferAttribute;
    const rng = lcg(5);
    for (let i = 0; i < count; i++) {
      const x = rng() - 0.5;
      const y0 = rng();
      const z = rng() - 0.5;
      const y = (y0 + (f * speed * (0.5 + (i % 5) * 0.2)) / box[1]) % 1;
      P.setXYZ(i, center[0] + x * box[0], center[1] + (y - 0.5) * box[1], center[2] + z * box[2]);
    }
    P.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={size} color={color} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} sizeAttenuation fog={false} />
    </points>
  );
};

export const ShockRing: React.FC<{p: number; y?: number}> = ({p, y = 0.02}) => {
  const tex = useTexture('apple2-ring', 512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 170, 256, 256, 256);
    g.addColorStop(0, 'rgba(224,160,116,0)');
    g.addColorStop(0.55, 'rgba(255,214,176,0.95)');
    g.addColorStop(0.7, 'rgba(224,160,116,0.35)');
    g.addColorStop(1, 'rgba(224,160,116,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });
  if (p <= 0 || p >= 1) return null;
  const s = 1.2 + 12 * (1 - Math.pow(1 - p, 3));
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={s}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={(1 - p) * 0.9} depthWrite={false} blending={AdditiveBlending} fog={false} />
    </mesh>
  );
};

// ------------------------------------------------------------------ light world: glass cards with photos
const roundedPlane = (w: number, h: number, r: number) => {
  const g = new ExtrudeGeometry(roundedRectShape(w, h, r), {depth: 0.001, bevelEnabled: false, curveSegments: 24});
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
};

export const Card3: React.FC<{src: string; texKey: string; blur?: number; opacity?: number; sweep?: number}> = ({src, texKey, blur = 0, opacity = 1, sweep}) => {
  const body = useMemo(() => new ExtrudeGeometry(roundedRectShape(PANEL.w, PANEL.h, PANEL.r), {depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 4, curveSegments: 28}), []);
  const photoGeo = useMemo(() => roundedPlane(PANEL.w - 0.1, PANEL.h - 0.1, PANEL.r - 0.03), []);
  const tw = blur > 0 ? 480 : 1200;
  const th = blur > 0 ? 600 : 1500;
  const photo = useTexture(texKey, tw, th, async (ctx) => {
    const img = await loadImage(staticFile(src));
    const s = Math.max(tw / img.width, th / img.height);
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(img, (tw - img.width * s) / 2, (th - img.height * s) / 2, img.width * s, img.height * s);
    ctx.filter = 'none';
  });
  const hi = useTexture('apple2-sweep', 512, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(-0.5);
    ctx.fillRect(-90, -420, 180, 840);
    ctx.restore();
  });
  useLayoutEffect(() => {
    if (sweep !== undefined) hi.offset.x = 0.9 - sweep * 1.8;
  });
  if (opacity <= 0.003) return null;
  return (
    <group>
      <mesh geometry={body} position={[0, 0, -0.03]} renderOrder={1}>
        <meshStandardMaterial color="#ffffff" roughness={0.12} metalness={0.1} transparent opacity={0.55 * opacity} envMapIntensity={1.0} />
      </mesh>
      <mesh geometry={photoGeo} position={[0, 0, 0.07]} renderOrder={2}>
        <meshBasicMaterial map={photo} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      {sweep !== undefined && (
        <mesh geometry={photoGeo} position={[0, 0, 0.072]} renderOrder={3}>
          <meshBasicMaterial map={hi} transparent opacity={opacity * 0.6} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

/** soft contact shadow on the floor under a floating card */
export const CardShadow: React.FC<{opacity: number}> = ({opacity}) => {
  const tex = useTexture('apple2-shadow', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(22,33,49,0.34)');
    g.addColorStop(0.6, 'rgba(22,33,49,0.1)');
    g.addColorStop(1, 'rgba(22,33,49,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  if (opacity <= 0.003) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PANEL.w * 1.5, PANEL.w * 1.1]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
};
