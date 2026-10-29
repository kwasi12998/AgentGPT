import React from 'react';
import {staticFile} from 'remotion';
import {C} from '../theme';
import {SoftShadow} from '../three/bits';
import {loadImage, rr, useTexture} from '../three/tex';

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

/** Portrait photo card (cover-fit, rounded). `w`/`h` are world units. */
export const PhotoCard: React.FC<{photo: number; w?: number; h?: number; label?: string}> = ({photo, w = 2.6, h = 3.4, label}) => {
  const px = 720;
  const py = Math.round((px * h) / w);
  const tex = useTexture(`chris-photo-${photo}-${label ?? ''}`, px, py, async (ctx) => {
    const img = await loadImage(staticFile(`chris/photo${photo}.jpg`));
    ctx.save();
    rr(ctx, 0, 0, px, py, 52);
    ctx.clip();
    const s = Math.max(px / img.width, py / img.height);
    ctx.drawImage(img, (px - img.width * s) / 2, (py - img.height * s) / 2, img.width * s, img.height * s);
    if (label) {
      const g = ctx.createLinearGradient(0, py * 0.7, 0, py);
      g.addColorStop(0, 'rgba(11,11,12,0)');
      g.addColorStop(1, 'rgba(11,11,12,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, px, py);
    }
    ctx.restore();
    if (label) {
      ctx.fillStyle = '#fff';
      ctx.font = '800 54px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, 40, py - 48);
    }
  });
  return (
    <group>
      <SoftShadow w={w} h={h} />
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Career fact: big copper numeral + two lines of text. */
export const FactCard: React.FC<{big: string; lines: string[]; w?: number; h?: number}> = ({big, lines, w = 2.2, h = 2.8}) => {
  const px = 700;
  const py = Math.round((px * h) / w);
  const tex = useTexture(`fact-${big}-${lines.join('|')}`, px, py, (ctx) => {
    ctx.shadowColor = 'rgba(22,33,49,0.25)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#ffffff';
    rr(ctx, 24, 20, px - 48, py - 56, 56);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.fillStyle = C.copper;
    ctx.font = `800 ${big.length > 3 ? 190 : 270}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(big, px / 2, 330);
    ctx.fillStyle = C.copper;
    ctx.fillRect(px / 2 - 60, 380, 120, 8);
    ctx.fillStyle = C.navy;
    ctx.font = '700 50px Inter, sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, px / 2, 480 + i * 66));
  });
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
};

/** Keynote title card (wraps long titles onto two lines). */
export const KeynoteCard: React.FC<{n: number; title: string; opacity?: number}> = ({n, title, opacity = 1}) => {
  const px = 1500;
  const py = 460;
  const tex = useTexture(`keynote-${n}-${title}`, px, py, (ctx) => {
    ctx.shadowColor = 'rgba(22,33,49,0.3)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#ffffff';
    rr(ctx, 30, 24, px - 60, py - 70, 70);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.fillStyle = C.copper;
    ctx.beginPath();
    ctx.arc(190, py / 2 - 12, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 92px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n).padStart(2, '0'), 190, py / 2 - 8);
    ctx.fillStyle = C.ink;
    ctx.font = '800 76px Inter, sans-serif';
    ctx.textAlign = 'left';
    const lines = wrap(ctx, title, px - 430);
    const lh = 92;
    const y0 = py / 2 - 12 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, 330, y0 + i * lh));
  });
  return (
    <mesh>
      <planeGeometry args={[4.5, (4.5 * py) / px]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};
