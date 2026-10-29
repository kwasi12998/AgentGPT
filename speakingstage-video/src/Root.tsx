import React from 'react';
import {Audio, Composition, AbsoluteFill, staticFile} from 'remotion';
import T from './timing.json';
import {FPS} from './theme';
import {Background} from './Background';
import {Intro} from './Intro';
import {PhoneScene} from './Phone';
import {MapScene} from './MapScene';
import {StageScene} from './StageScene';
import {ClaimScene} from './ClaimScene';
import {SpeakerV2, SpeakerV2VO, SpeakerV2VOWide, SpeakerV2Wide} from './V2';
import {VO_WARP} from './vo-warp';
import T2 from './timing2.json';
import T3 from './timing3.json';
import {ShowreelChris, ShowreelChrisVO} from './showreel/Showreel';
import {SR_WARP} from './showreel/vo-warp';
import {PitchChris} from './pitch/Pitch';
import {TL as PITCH_TL} from './pitch-timeline';

const Speaker: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Intro />
    <PhoneScene />
    <MapScene />
    <StageScene />
    <ClaimScene />
    <Audio src={staticFile('audio/music.wav')} volume={0.55} />
    <Audio src={staticFile('audio/sfx.wav')} volume={0.9} />
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
  <Composition id="SpeakerV2" component={SpeakerV2} durationInFrames={T2.total} fps={FPS} width={1080} height={1920} />
  <Composition id="PitchChris" component={PitchChris} durationInFrames={PITCH_TL.total} fps={FPS} width={1080} height={1080} />
  <Composition id="ShowreelChrisVO" component={ShowreelChrisVO} durationInFrames={SR_WARP.total} fps={FPS} width={1080} height={1080} />
  <Composition id="ShowreelChris" component={ShowreelChris} durationInFrames={T3.total} fps={FPS} width={1080} height={1080} />
  <Composition id="SpeakerV2VO" component={SpeakerV2VO} durationInFrames={VO_WARP.total} fps={FPS} width={1080} height={1920} />
  <Composition id="SpeakerV2VOWide" component={SpeakerV2VOWide} durationInFrames={VO_WARP.total} fps={FPS} width={1920} height={1080} />
  <Composition id="SpeakerV2Wide" component={SpeakerV2Wide} durationInFrames={T2.total} fps={FPS} width={1920} height={1080} />
  <Composition id="Speaker" component={Speaker} durationInFrames={T.total} fps={FPS} width={1080} height={1920} />
  </>
);
