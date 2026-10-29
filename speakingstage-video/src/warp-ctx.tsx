import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import type {Warp} from './warp';

export const WarpCtx = createContext<Warp | null>(null);

/** Current frame in native ("logical") time. Equals the real frame unless the voice-over warp is active. */
export const useLF = () => {
  const raw = useCurrentFrame();
  const w = useContext(WarpCtx);
  return w ? w.logical(raw) : raw;
};
