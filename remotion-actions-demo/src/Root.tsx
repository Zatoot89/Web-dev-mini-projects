import {Composition} from 'remotion';
import {SmokeVideo} from './SmokeVideo';
import {CrusherEvoAd} from './CrusherEvoAd';
import {PpsDubaiAd} from './PpsDubaiAd';

export const RemotionRoot = () => (
  <>
    <Composition id="RemotionSmoke" component={SmokeVideo} durationInFrames={90} fps={30} width={1280} height={720}/>
    <Composition id="CrusherEvoAd" component={CrusherEvoAd} durationInFrames={480} fps={30} width={1080} height={1920}/>
    <Composition id="PpsDubaiAd" component={PpsDubaiAd} durationInFrames={600} fps={30} width={1080} height={1920}/>
  </>
);
