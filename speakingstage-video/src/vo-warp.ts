import voscript from './voscript.json';
import voData from './vo.json';
import T from './timing2.json';
import {buildWarp, type SceneCfg, type VoInfo} from './warp';

export const VO_SCENES = voscript.scenes as unknown as SceneCfg[];
export const VO_WARP = buildWarp(T.total, VO_SCENES, voData as unknown as VoInfo);
