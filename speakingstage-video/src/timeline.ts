// Audio-first timeline: every beat lasts as long as its voice-over segment needs (plus lead-in and tail), so no scene
// is ever slowed down or stretched. Plain TS (erasable syntax only) so Node scripts can import it directly.

export type BeatCfg = {id: string; pre: number; tail: number; min: number};
export type VoSegs = {segments: Record<string, {file: string; dur: number}>};
export type BeatTime = {id: string; start: number; end: number; v0: number; vFrames: number; file: string};
export type Timeline = {beats: BeatTime[]; total: number; byId: Record<string, BeatTime>};

const FPS = 30;

export const buildTimeline = (cfg: BeatCfg[], vo: VoSegs): Timeline => {
  let t = 0;
  const beats: BeatTime[] = [];
  for (const b of cfg) {
    const seg = vo.segments[b.id];
    const vFrames = Math.ceil(seg.dur * FPS);
    const len = Math.max(b.min, b.pre + vFrames + b.tail);
    beats.push({id: b.id, start: t, end: t + len, v0: t + b.pre, vFrames, file: seg.file});
    t += len;
  }
  return {beats, total: t, byId: Object.fromEntries(beats.map((b) => [b.id, b]))};
};
