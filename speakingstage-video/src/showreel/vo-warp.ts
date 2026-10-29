import voscript from '../voscript-showreel.json';
import voData from '../vo-showreel.json';
import T from '../timing3.json';
import {buildWarp, type SceneCfg, type VoInfo} from '../warp';

export const SR_WARP = buildWarp(T.total, voscript.scenes as unknown as SceneCfg[], voData as unknown as VoInfo);
