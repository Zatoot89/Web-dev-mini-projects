import {Composition} from 'remotion';
import {ProductAd, defaultProductProps} from './ProductAd';
export const RemotionRoot = () => (
  <Composition
    id="ProductAd"
    component={ProductAd}
    durationInFrames={600}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaultProductProps}
  />
);
