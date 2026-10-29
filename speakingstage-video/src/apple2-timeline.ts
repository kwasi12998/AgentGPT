import voscript from './voscript-apple2.json';
import voData from './vo-apple2.json';
import {buildTimeline, type BeatCfg, type VoSegs} from './timeline';

export const TL = buildTimeline(voscript.scenes as unknown as BeatCfg[], voData as unknown as VoSegs);
export const B = TL.byId;
