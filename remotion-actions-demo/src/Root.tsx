import {Composition} from 'remotion';
import {SmokeVideo} from './SmokeVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RemotionSmoke"
        component={SmokeVideo}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
