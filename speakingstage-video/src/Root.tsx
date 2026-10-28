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
  <Composition id="Speaker" component={Speaker} durationInFrames={T.total} fps={FPS} width={1080} height={1920} />
);
