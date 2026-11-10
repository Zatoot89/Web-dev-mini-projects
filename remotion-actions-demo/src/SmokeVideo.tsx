import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const SmokeVideo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const entrance = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  const opacity = interpolate(frame, [0, 12, 76, 89], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slide = interpolate(frame, [0, 24], [55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 20% 15%, #24385e 0%, #0b1022 70%)',
        color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 740,
          height: 740,
          borderRadius: '50%',
          border: '2px solid rgba(108, 178, 255, 0.23)',
          transform: `scale(${0.85 + entrance * 0.15})`,
        }}
      />
      <div style={{textAlign: 'center', transform: `translateY(${slide}px)`, opacity}}>
        <div style={{fontSize: 24, letterSpacing: 8, color: '#7bd7fc', fontWeight: 700}}>
          GITHUB ACTIONS
        </div>
        <div style={{fontSize: 90, fontWeight: 800, marginTop: 26, letterSpacing: -3}}>
          REMOTION
        </div>
        <div style={{fontSize: 32, color: '#cfdaef', marginTop: 12}}>
          Automated video rendering — PASS
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 38,
          fontSize: 18,
          color: '#aac6e8',
          letterSpacing: 2,
        }}
      >
        1280 × 720  ·  30 FPS  ·  3 SECONDS
      </div>
    </AbsoluteFill>
  );
};
