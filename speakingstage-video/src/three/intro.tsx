import React, {useMemo} from 'react';
import {staticFile} from 'remotion';
import {ExtrudeGeometry, Shape} from 'three';
import {C, prog, sp} from '../theme';
import markPoints from './markShape.json';
import {loadImage, useTexture} from './tex';
import {Trail, LightHead} from './streak';
import {Vector3} from 'three';

const MARK = 2.3;

export const IntroWorld: React.FC<{f: number; hit: number; wordmark: number}> = ({f, hit, wordmark}) => {
  const geo = useMemo(() => {
    const shape = new Shape();
    markPoints.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x * MARK, y * MARK) : shape.lineTo(x * MARK, y * MARK)));
    shape.closePath();
    const g = new ExtrudeGeometry(shape, {depth: 0.9, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 5, curveSegments: 1});
    g.translate(0, 0, -0.45);
    return g;
  }, []);
  const wm = useTexture('wordmark', 1800, 300, async (ctx) => {
    ctx.drawImage(await loadImage(staticFile('wordmark.png')), 0, 0);
  });
  const s = sp(f, hit - 14, 12, 90);
  const rotY = -1.5 + s * 1.5 + Math.sin(f / 26) * 0.12;
  const rise = prog(f, wordmark - 6, 22);
  const reveal = prog(f, wordmark, 22);
  const W = 3.9;
  const H = 0.65;
  // the light trail that "draws" the logo into place
  const trailP = prog(f, 2, 30);
  const pts = useMemo(() => {
    const out: Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      out.push(new Vector3(-14 + 14 * t + Math.sin(t * 3) * 1.2, -7 + 7 * t + Math.cos(t * 4) * 1.5, 8 - 8 * t));
    }
    return out;
  }, []);
  const shown = pts.slice(0, Math.max(0, Math.floor(trailP * pts.length)));
  const tail = shown.slice(Math.max(0, shown.length - 22));
  const fade = 1 - prog(f, 30, 8);
  if (wm) wm.repeat.x = Math.max(0.001, reveal);
  return (
    <group>
      {fade > 0.02 && tail.length > 1 && (
        <>
          <Trail points={tail} radius={0.11 * fade} />
          <LightHead position={tail[tail.length - 1].toArray() as [number, number, number]} size={0.3 * fade} />
        </>
      )}
      <group position={[0, 0.5 + rise * 1.15, 0]} rotation={[0.08, rotY, 0]} scale={Math.max(0.001, s) * (1 - rise * 0.25)}>
        <mesh geometry={geo}>
          <meshStandardMaterial color={C.ink} metalness={0.35} roughness={0.32} />
        </mesh>
      </group>
      <mesh position={[-W / 2 + (W * reveal) / 2, -0.55, 0]} visible={reveal > 0.01}>
        <planeGeometry args={[W * reveal, H]} />
        <meshBasicMaterial map={wm} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};
