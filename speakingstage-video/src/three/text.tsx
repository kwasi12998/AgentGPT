import React from 'react';
import {C} from '../theme';
import {rr, useTexture} from './tex';

type TextProps = {
  text: string;
  fontPx?: number;
  weight?: number;
  color?: string;
  /** world units per canvas pixel */
  unit?: number;
  opacity?: number;
  /** extra stacked copies behind the face give the type a solid 3D thickness */
  layers?: number;
  layerStep?: number;
  layerColor?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

const estWidth = (text: string, fontPx: number, weight: number) => Math.ceil(text.length * fontPx * (weight >= 800 ? 0.62 : 0.58)) + fontPx;

const Face: React.FC<{text: string; fontPx: number; weight: number; color: string; unit: number; z: number; opacity: number}> = ({text, fontPx, weight, color, unit, z, opacity}) => {
  const w = estWidth(text, fontPx, weight);
  const h = Math.ceil(fontPx * 1.5);
  const tex = useTexture(`txt|${text}|${fontPx}|${weight}|${color}`, w, h, (ctx) => {
    ctx.font = `${weight} ${fontPx}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + fontPx * 0.04);
  });
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w * unit, h * unit]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const TextPlane: React.FC<TextProps> = ({text, fontPx = 128, weight = 800, color = C.ink, unit = 0.01, opacity = 1, layers = 1, layerStep = 0.012, layerColor = C.copperDark, position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    {Array.from({length: layers - 1}, (_, i) => (
      <Face key={i} text={text} fontPx={fontPx} weight={weight} color={layerColor} unit={unit} z={-(layers - 1 - i) * layerStep - layerStep} opacity={opacity} />
    ))}
    <Face text={text} fontPx={fontPx} weight={weight} color={color} unit={unit} z={0} opacity={opacity} />
  </group>
);

/** Rounded pill label (floating UI chips). */
export const Chip: React.FC<{text: string; fill?: string; ink?: string; unit?: number; opacity?: number}> = ({text, fill = '#ffffff', ink = C.copper, unit = 0.0055, opacity = 1}) => {
  const fontPx = 64;
  const w = estWidth(text, fontPx, 700) + 90;
  const h = 150;
  const tex = useTexture(`chip|${text}|${fill}|${ink}`, w, h, (ctx) => {
    ctx.shadowColor = 'rgba(22,33,49,0.28)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = fill;
    rr(ctx, 24, 16, w - 48, h - 52, (h - 52) / 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = `700 ${fontPx}px Inter, sans-serif`;
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, 16 + (h - 52) / 2 + 3);
  });
  return (
    <mesh>
      <planeGeometry args={[w * unit, h * unit]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};
