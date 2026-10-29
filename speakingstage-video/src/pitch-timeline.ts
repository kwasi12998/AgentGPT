import voscript from './voscript-pitch.json';
import voData from './vo-pitch.json';
import {buildTimeline, type BeatCfg, type VoSegs} from './timeline';

export const TL = buildTimeline(voscript.scenes as unknown as BeatCfg[], voData as unknown as VoSegs);
export const B = TL.byId;
