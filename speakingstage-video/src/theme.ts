import {interpolate, spring, Easing} from 'remotion';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const C = {
  bg: '#ffffff',
  ink: '#0b0b0c',
  navy: '#162131',
  cream: '#f7f3ee',
  copper: '#a7643c',
  copperLight: '#e0a074',
  copperDark: '#7e4824',
  gray: '#8a8f98',
  line: '#e8e2da'
};

export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const fontsReady = Promise.all(
  (
    [
      ['Medium', 500],
      ['SemiBold', 600],
      ['Bold', 700],
      ['ExtraBold', 800]
    ] as const
  ).map(([name, weight]) => loadFont({family: 'Inter', url: staticFile(`fonts/Inter-${name}.otf`), weight: String(weight)}))
);

export const FPS = 30;

/** 0→1 progress between start and start+dur */
export const prog = (frame: number, start: number, dur: number, easing = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  });

export const sp = (frame: number, start: number, damping = 14, stiffness = 120, mass = 0.8) =>
  spring({frame: frame - start, fps: FPS, config: {damping, stiffness, mass}});

export const inOut = Easing.inOut(Easing.cubic);
