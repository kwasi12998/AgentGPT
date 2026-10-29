import React, {useLayoutEffect, useRef} from 'react';
import {InstancedMesh, Object3D} from 'three';
import {C} from '../theme';
import {SoftShadow} from '../three/bits';
import {rr, useTexture} from '../three/tex';

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
};

type CardStyle = {fill: string; ink: string; subInk?: string; border?: string; dashed?: boolean; accent?: string};
export const STYLE = {
  gray: {fill: '#eceff3', ink: '#6b7380', subInk: '#8a919c', border: '#d5dae1'} as CardStyle,
  white: {fill: '#ffffff', ink: C.ink, subInk: C.gray, border: C.line} as CardStyle,
  copper: {fill: C.copper, ink: '#ffffff', subInk: '#f6e6da', border: C.copperDark} as CardStyle,
  slot: {fill: '#faf3ed', ink: C.copper, subInk: C.copper, border: C.copper, dashed: true} as CardStyle
};

/** Flat label card drawn to a canvas. `w`/`h` are world units. Never animates by itself. */
/** canvas px that render as `screenPx` on screen for a card `w` units wide at the usual viewing distance (~9.3, fov 34, 1080 px) */
export const fontFor = (screenPx: number, w: number) => Math.round((screenPx * 1500) / (w * 190));

export const LabelCard: React.FC<{text: string; sub?: string; w: number; h: number; style: CardStyle; font?: number; screenPx?: number; opacity?: number; check?: boolean}> = ({text, sub, w, h, style, font: fontProp, screenPx = 48, opacity = 1, check}) => {
  const font = fontProp ?? fontFor(screenPx, w);
  const px = 1500;
  const py = Math.round((px * h) / w);
  const tex = useTexture(`lc|${text}|${sub ?? ''}|${w}|${h}|${style.fill}|${style.ink}|${font}|${check ? 1 : 0}`, px, py, (ctx) => {
    ctx.shadowColor = 'rgba(22,33,49,0.22)';
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = style.fill;
    rr(ctx, 28, 22, px - 56, py - 66, 64);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = style.dashed ? 8 : 4;
    ctx.strokeStyle = style.border ?? C.line;
    if (style.dashed) ctx.setLineDash([36, 24]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const left = check ? 210 : 100;
    if (check) {
      ctx.fillStyle = style.ink;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(120, py / 2 - 22, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = style.fill;
      ctx.font = '800 64px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', 120, py / 2 - 20);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = style.ink;
    ctx.font = `800 ${font}px Inter, sans-serif`;
    const lines = wrap(ctx, text, px - left - 100);
    const lh = font * 1.12;
    const blockH = lines.length * lh + (sub ? font * 1.0 : 0);
    let y = (py - 44) / 2 - blockH / 2 + lh / 2;
    lines.forEach((l) => {
      ctx.fillText(l, left, y);
      y += lh;
    });
    if (sub) {
      ctx.fillStyle = style.subInk ?? style.ink;
      ctx.font = `600 ${Math.round(font * 0.72)}px Inter, sans-serif`;
      const sl = wrap(ctx, sub, px - left - 100);
      sl.forEach((l) => {
        ctx.fillText(l, left, y + font * 0.1);
        y += font * 0.8;
      });
    }
  });
  return (
    <group>
      <SoftShadow w={w} h={h} opacity={0.12} />
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Card with a problem on its front (gray) and the solution on its back (copper). `flip` 0..1 turns it over. */
export const FlipCard: React.FC<{pain: string; title: string; sub: string; w: number; h: number; flip: number}> = ({pain, title, sub, w, h, flip}) => (
  <group rotation={[0, flip * Math.PI, 0]}>
    <LabelCard text={pain} sub="Das Problem" w={w} h={h} style={STYLE.gray} screenPx={48} />
    <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.01]}>
      <LabelCard text={title} sub={sub} w={w} h={h} style={STYLE.copper} screenPx={44} />
    </group>
  </group>
);

const COLS = 5;
const ROWS = 4;
export const HERO_CELL = {c: 2, r: 1};
export const crowdCell = (c: number, r: number): [number, number] => [(c - (COLS - 1) / 2) * 1.08, -r * 1.2];

/** A neat grid of identical people (instanced). Rows pop in one after another. */
export const Crowd: React.FC<{f: number; start: number; color: string}> = ({f, start, color}) => {
  const heads = useRef<InstancedMesh>(null);
  const bodies = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new Object3D();
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c === HERO_CELL.c && r === HERO_CELL.r) continue;
        const [x, z] = crowdCell(c, r);
        const t = Math.min(1, Math.max(0, (f - (start + r * 7 + c * 1.2)) / 12));
        const s = 0.0001 + (1 - Math.pow(1 - t, 3)) * 0.62;
        o.position.set(x, 0, z);
        o.scale.setScalar(s);
        o.updateMatrix();
        bodies.current?.setMatrixAt(i, o.matrix);
        heads.current?.setMatrixAt(i, o.matrix);
        i++;
      }
    }
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
  });
  const n = COLS * ROWS - 1;
  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, n]} frustumCulled={false} position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.34, 0.5, 6, 14]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, n]} frustumCulled={false} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.28, 20, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </instancedMesh>
    </group>
  );
};

/** One person, same proportions as the crowd. */
export const Person: React.FC<{color: string; scale?: number; emissive?: string}> = ({color, scale = 0.62, emissive}) => (
  <group scale={scale}>
    <mesh position={[0, 0.5, 0]}>
      <capsuleGeometry args={[0.34, 0.5, 6, 14]} />
      <meshStandardMaterial color={color} roughness={0.7} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.35 : 0} />
    </mesh>
    <mesh position={[0, 1.5, 0]}>
      <sphereGeometry args={[0.28, 20, 16]} />
      <meshStandardMaterial color={color} roughness={0.7} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.35 : 0} />
    </mesh>
  </group>
);
