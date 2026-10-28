import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {Easing} from 'remotion';
import {PerspectiveCamera} from 'three';

export type V3 = [number, number, number];
export type Pose = {pos: V3; target: V3; roll: number; fov: number};
export type Key = {f: number; pos: V3; target: V3; roll?: number; fov?: number; ease?: (t: number) => number; cut?: boolean};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const ease = {
  inOut: Easing.inOut(Easing.cubic),
  inOutQuint: Easing.inOut(Easing.poly(5)),
  inOutSine: Easing.inOut(Easing.sin),
  out: Easing.out(Easing.cubic),
  inQuint: Easing.in(Easing.poly(5)),
  lin: (t: number) => t
};

/** Keyframe sampler: eases between keys; a key marked `cut` jumps instead of interpolating into it. */
export const sampleKeys = (f: number, keys: Key[]): Pose => {
  if (f <= keys[0].f) return {pos: keys[0].pos, target: keys[0].target, roll: keys[0].roll ?? 0, fov: keys[0].fov ?? 36};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      if (b.cut) return {pos: a.pos, target: a.target, roll: a.roll ?? 0, fov: a.fov ?? 36};
      const t = (b.ease ?? ease.inOutSine)((f - a.f) / (b.f - a.f));
      return {
        pos: lerp3(a.pos, b.pos, t),
        target: lerp3(a.target, b.target, t),
        roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
        fov: lerp(a.fov ?? 36, b.fov ?? 36, t)
      };
    }
  }
  const l = keys[keys.length - 1];
  return {pos: l.pos, target: l.target, roll: l.roll ?? 0, fov: l.fov ?? 36};
};

export const shake = (f: number, amp: number): V3 => [
  (Math.sin(f * 1.7) + Math.sin(f * 2.9 + 1)) * 0.5 * amp,
  (Math.sin(f * 2.3 + 2) + Math.sin(f * 3.7)) * 0.5 * amp,
  0
];

export const CameraRig: React.FC<{pose: Pose}> = ({pose}) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = pose.fov;
    camera.position.set(...pose.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...pose.target);
    camera.rotateZ((pose.roll * Math.PI) / 180);
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};
