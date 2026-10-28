import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {CanvasTexture, SRGBColorSpace} from 'three';
import {fontsReady} from '../theme';

type Entry = {tex: CanvasTexture; ready: boolean; promise: Promise<void>};
const cache = new Map<string, Entry>();

/** Module-level cache so each texture is drawn once per browser tab, even if its group re-mounts. */
export const getTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void | Promise<void>): Entry => {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  const entry: Entry = {tex, ready: false, promise: Promise.resolve()};
  entry.promise = fontsReady
    .then(() => draw(canvas.getContext('2d')!))
    .then(() => {
      entry.ready = true;
      tex.needsUpdate = true;
    })
    .catch((e) => cancelRender(e));
  cache.set(key, entry);
  return entry;
};

/** Texture hook: holds the frame until the texture is drawn, then forces one extra GL render. */
export const useTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void | Promise<void>) => {
  const entry = getTexture(key, w, h, draw);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (entry.ready) return;
    const handle = delayRender(`texture ${key}`, {timeoutInMilliseconds: 60000});
    entry.promise.then(() => {
      gl.render(scene, camera);
      continueRender(handle);
    });
  }, [entry, key, gl, scene, camera]);
  return entry.tex;
};

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image failed: ' + src));
    img.src = src;
  });

export const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
