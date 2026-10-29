// Time warp for the voice-over version. Scenes keep their native ("logical") frame numbers; where the voice-over needs
// more time, a scene's stretch zone is slowed down. Flights and cuts keep their native speed. Plain TS (erasable syntax
// only) so scripts/make-audio2.mjs can import it with Node's type stripping.

export type SceneCfg = {id: string; start: number; end: number; voOffset: number; tail: number; zone: [number, number]; text: string};
export type VoInfo = {segments: Record<string, {file: string; dur: number}>};
export type Warp = {
  total: number;
  /** logical (native) frame -> output frame */
  out: (l: number) => number;
  /** output frame -> logical frame */
  logical: (o: number) => number;
  /** output frames at which each voice-over segment starts / its length */
  vo: {id: string; file: string; from: number; frames: number}[];
};

const FPS = 30;

export const buildWarp = (nativeTotal: number, scenes: SceneCfg[], vo: VoInfo | null): Warp => {
  const extras = scenes.map((s) => {
    const seg = vo?.segments[s.id];
    if (!seg) return 0;
    const need = s.voOffset + Math.ceil(seg.dur * FPS) + s.tail;
    return Math.max(0, need - (s.end - s.start));
  });
  // knots: [logical, out]
  const knots: [number, number][] = [[0, 0]];
  let acc = 0;
  scenes.forEach((s, i) => {
    const [a, b] = s.zone;
    knots.push([a, a + acc]);
    acc += extras[i];
    knots.push([b, b + acc]);
  });
  knots.push([nativeTotal, nativeTotal + acc]);
  const interp = (x: number, from: 0 | 1) => {
    const to = from === 0 ? 1 : 0;
    if (x <= knots[0][from]) return knots[0][to] + (x - knots[0][from]);
    for (let i = 0; i < knots.length - 1; i++) {
      const [p, q] = [knots[i], knots[i + 1]];
      if (x <= q[from]) {
        const span = q[from] - p[from];
        return span <= 0 ? q[to] : p[to] + ((x - p[from]) / span) * (q[to] - p[to]);
      }
    }
    const l = knots[knots.length - 1];
    return l[to] + (x - l[from]);
  };
  const out = (l: number) => interp(l, 0);
  const logical = (o: number) => interp(o, 1);
  return {
    total: Math.round(nativeTotal + acc),
    out,
    logical,
    vo: scenes
      .filter((s) => vo?.segments[s.id])
      .map((s) => ({id: s.id, file: vo!.segments[s.id].file, from: Math.round(out(s.start + s.voOffset)), frames: Math.ceil(vo!.segments[s.id].dur * FPS)}))
  };
};
