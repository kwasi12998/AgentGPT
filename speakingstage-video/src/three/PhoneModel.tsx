import React, {useEffect, useMemo, useState} from 'react';
import {useThree} from '@react-three/fiber';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace} from 'three';

export const roundedRectShape = (w: number, h: number, r: number) => {
  const s = new Shape();
  s.moveTo(-w / 2, -h / 2 + r);
  s.lineTo(-w / 2, h / 2 - r);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);
  s.lineTo(w / 2 - r, h / 2);
  s.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
  s.lineTo(w / 2, -h / 2 + r);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2);
  s.lineTo(-w / 2 + r, -h / 2);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2, -h / 2 + r);
  return s;
};

export const PHONE = {w: 2.3, h: 4.9, d: 0.26, r: 0.4, sw: 2.12, sh: 4.6, sr: 0.31, px: 860, py: 1864};

/** 3D smartphone whose screen plays a screen recording (video frames -> CanvasTexture). */
/** Draws frame `index` of a JPEG sequence (public/frames/<seq>/NNNN.jpg) into a CanvasTexture. */
export const useSequenceTexture = (seq: string, index: number) => {
  const [canvas] = useState(() => {
    const c = document.createElement('canvas');
    c.width = PHONE.px;
    c.height = PHONE.py;
    return c;
  });
  const [texture] = useState(() => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  });
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const handle = delayRender(`frame ${seq}/${index}`, {timeoutInMilliseconds: 60000});
    const img = new Image();
    img.onload = () => {
      canvas.getContext('2d')!.drawImage(img, 0, 0, PHONE.px, PHONE.py);
      texture.needsUpdate = true;
      gl.render(scene, camera);
      continueRender(handle);
    };
    img.onerror = () => cancelRender(new Error(`missing frame ${seq}/${index}`));
    img.src = staticFile(`frames/${seq}/${String(index + 1).padStart(4, '0')}.jpg`);
  }, [seq, index, canvas, texture, gl, scene, camera]);
  return texture;
};

/** `frame` is local to the recording (0 = first frame); it is clamped to `count`. */
export const PhoneModel: React.FC<{seq: string; frame: number; count: number; color?: string}> = ({seq, frame, count, color = '#0b0b0c'}) => {
  const bodyGeo = useMemo(() => {
    const g = new ExtrudeGeometry(roundedRectShape(PHONE.w, PHONE.h, PHONE.r), {
      depth: PHONE.d,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 24
    });
    g.translate(0, 0, -PHONE.d / 2);
    return g;
  }, []);
  const screenGeo = useMemo(() => {
    const shape = roundedRectShape(PHONE.sw, PHONE.sh, PHONE.sr);
    const g = new ExtrudeGeometry(shape, {depth: 0.001, bevelEnabled: false, curveSegments: 24});
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / PHONE.sw + 0.5, pos.getY(i) / PHONE.sh + 0.5);
    return g;
  }, []);
  const texture = useSequenceTexture(seq, Math.max(0, Math.min(count - 1, Math.round(frame))));
  return (
    <group>
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.28} />
      </mesh>
      <mesh geometry={screenGeo} position={[0, 0, PHONE.d / 2 + 0.052]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};
