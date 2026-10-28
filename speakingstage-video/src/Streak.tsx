import React from 'react';
import {C} from './theme';

/** Copper light-trail (the visual leitmotif). `progress` 0..1 reveals the head along the path. */
export const Streak: React.FC<{
  d: string;
  progress: number;
  tail?: number;
  width?: number;
  id: string;
  opacity?: number;
}> = ({d, progress, tail = 0.35, width = 14, id, opacity = 1}) => {
  const start = progress - tail;
  const dash = `${tail} 3`;
  const offset = -start;
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <path d={d} pathLength={1} fill="none" stroke={C.copperLight} strokeWidth={width * 2.6} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} filter={`url(#${id}-glow)`} opacity={0.75} />
      <path d={d} pathLength={1} fill="none" stroke={C.copper} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} />
      <path d={d} pathLength={1} fill="none" stroke="#ffd7b5" strokeWidth={width * 0.35} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} />
    </g>
  );
};
