import React from 'react';
import {staticFile} from 'remotion';
import {C} from '../theme';
import {SoftShadow} from './bits';
import {loadImage, rr, useTexture} from './tex';

export const SPEAKERS = [
  {slug: 'oliver-kahn', name: 'Oliver Kahn', topic: 'Leadership'},
  {slug: 'miriam-meckel', name: 'Miriam Meckel', topic: 'Künstliche Intelligenz'},
  {slug: 'jochen-schweizer', name: 'Jochen Schweizer', topic: 'Mut & Unternehmertum'},
  {slug: 'sandra-navidi', name: 'Sandra Navidi', topic: 'USA & Finanzmärkte'},
  {slug: 'anders-indset', name: 'Anders Indset', topic: 'KI & Leadership'},
  {slug: 'hannes-jaenicke', name: 'Hannes Jaenicke', topic: 'Nachhaltigkeit'},
  {slug: 'nina-ruge', name: 'Nina Ruge', topic: 'Longevity'},
  {slug: 'urs-meier', name: 'Urs Meier', topic: 'Entscheidungen'},
  {slug: 'dani-arnold', name: 'Dani Arnold', topic: 'Motivation & Extremsport'},
  {slug: 'michael-gross', name: 'Michael Groß', topic: 'Motivation'}
];

export const CARD = {w: 2.6, h: 3.5, px: 640, py: 860};

const drawBadge = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
  ctx.font = '700 30px Inter, sans-serif';
  const w = ctx.measureText(text).width + 70;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  rr(ctx, x, y, w, 58, 29);
  ctx.fill();
  ctx.fillStyle = C.copper;
  ctx.beginPath();
  ctx.arc(x + 31, y + 29, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 54, y + 31);
};

export const SpeakerCard: React.FC<{slug: string; name: string; topic: string; opacity?: number}> = ({slug, name, topic, opacity = 1}) => {
  const tex = useTexture(`card|${slug}`, CARD.px, CARD.py, async (ctx) => {
    const img = await loadImage(staticFile(`speakers/${slug}.jpg`));
    ctx.save();
    rr(ctx, 0, 0, CARD.px, CARD.py, 56);
    ctx.clip();
    const s = Math.max(CARD.px / img.width, CARD.py / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, (CARD.px - dw) / 2, (CARD.py - dh) / 2 - 30, dw, dh);
    const g = ctx.createLinearGradient(0, CARD.py * 0.5, 0, CARD.py);
    g.addColorStop(0, 'rgba(11,11,12,0)');
    g.addColorStop(1, 'rgba(11,11,12,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD.px, CARD.py);
    ctx.restore();
    drawBadge(ctx, 'Gelistet', 34, 34);
    ctx.fillStyle = '#fff';
    ctx.font = '800 58px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, 40, CARD.py - 100);
    ctx.fillStyle = C.copperLight;
    ctx.font = '600 36px Inter, sans-serif';
    ctx.fillText(topic, 40, CARD.py - 48);
  });
  return (
    <group>
      <SoftShadow w={CARD.w} h={CARD.h} />
      <mesh>
        <planeGeometry args={[CARD.w, CARD.h]} />
        <meshBasicMaterial map={tex} transparent opacity={opacity} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** The empty slot that asks for the viewer's profile. */
export const GapCard: React.FC<{pulse: number}> = ({pulse}) => {
  const tex = useTexture('gap', CARD.px, CARD.py, (ctx) => {
    ctx.fillStyle = 'rgba(167,100,60,0.07)';
    rr(ctx, 12, 12, CARD.px - 24, CARD.py - 24, 56);
    ctx.fill();
    ctx.setLineDash([36, 26]);
    ctx.lineWidth = 9;
    ctx.strokeStyle = C.copper;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.copper;
    ctx.font = '300 220px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', CARD.px / 2, CARD.py / 2 - 60);
    ctx.font = '800 66px Inter, sans-serif';
    ctx.fillText('Ihr Profil?', CARD.px / 2, CARD.py / 2 + 130);
  });
  return (
    <group>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[CARD.w * (1.35 + pulse * 0.1), CARD.h * (1.3 + pulse * 0.1)]} />
        <meshBasicMaterial color={C.copperLight} transparent opacity={0.1 + pulse * 0.1} depthWrite={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[CARD.w, CARD.h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

/** The viewer's own new profile card. */
export const MyCard: React.FC = () => {
  const tex = useTexture('mycard', CARD.px, CARD.py, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, CARD.py);
    g.addColorStop(0, '#fffdfa');
    g.addColorStop(1, '#f1e4d8');
    ctx.fillStyle = g;
    rr(ctx, 0, 0, CARD.px, CARD.py, 56);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = C.copper;
    rr(ctx, 6, 6, CARD.px - 12, CARD.py - 12, 52);
    ctx.stroke();
    ctx.fillStyle = C.copper;
    ctx.beginPath();
    ctx.arc(CARD.px / 2, 330, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 130px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AB', CARD.px / 2, 340);
    drawBadge(ctx, 'Neu', 34, 34);
    ctx.fillStyle = C.ink;
    ctx.font = '800 60px Inter, sans-serif';
    ctx.fillText('Dr. Anna Berger', CARD.px / 2, CARD.py - 190);
    ctx.fillStyle = C.copper;
    ctx.font = '600 38px Inter, sans-serif';
    ctx.fillText('Zukunft der Arbeit', CARD.px / 2, CARD.py - 120);
  });
  return (
    <group>
      <SoftShadow w={CARD.w} h={CARD.h} opacity={0.3} />
      <mesh>
        <planeGeometry args={[CARD.w, CARD.h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};
