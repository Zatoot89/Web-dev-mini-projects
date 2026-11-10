import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const C = {orange: '#ff5c27', cream: '#fff5e6', muted: '#b9b9c5'};

const fade = (f: number, total: number) =>
  interpolate(f, [0, 12, total - 14, total], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Backdrop: React.FC<{accent?: boolean}> = ({accent = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% ${40 + 6 * Math.sin(f / 45)}%, #292329 0%, #121217 44%, #050508 85%)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 920,
          height: 920,
          border: `2px solid ${accent ? 'rgba(255,92,39,0.23)' : 'rgba(255,255,255,0.13)'}`,
          borderRadius: '50%',
          top: 420 + Math.sin(f / 22) * 14,
          left: 80,
          boxShadow: accent ? '0 0 200px rgba(255,92,39,0.13)' : 'none',
        }}
      />
      <div style={{position: 'absolute', width: 700, height: 700, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', top: 530, left: 190}} />
      <div style={{position: 'absolute', inset: 0, opacity: 0.11, background: 'repeating-linear-gradient(0deg, transparent, transparent 7px, #ffffff 8px)', mixBlendMode: 'overlay'}} />
      <div style={{position: 'absolute', top: 100, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontSize: 24, fontWeight: 800, letterSpacing: 6}}>
        <span>SKULLCANDY</span>
        <span style={{color: C.orange}}>CRUSHER EVO</span>
      </div>
      <div style={{position: 'absolute', bottom: 110, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, letterSpacing: 4, color: '#9b9da6'}}>
        <span>TRUE BLACK</span>
        <span>WIRELESS / OVER-EAR</span>
      </div>
    </AbsoluteFill>
  );
};

const Label: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 310}) => (
  <div style={{position: 'absolute', top, left: 70, right: 70, fontWeight: 800, fontSize: 24, letterSpacing: 9, color: C.orange, textAlign: 'center'}}>{children}</div>
);

const Headphone: React.FC<{type?: 'main' | 'angle'; top?: number; width?: number; rotate?: number}> = ({
  type = 'main', top = 590, width = 850, rotate = 0,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({fps, frame: f, config: {damping: 17, stiffness: 75}, durationInFrames: 25});
  return (
    <Img
      src={staticFile(type === 'main' ? 'headphones-main.png' : 'headphones-angle.png')}
      style={{
        position: 'absolute',
        top,
        width,
        height: width,
        left: (1080 - width) / 2,
        objectFit: 'contain',
        transform: `translateY(${(1 - enter) * 145 + 18 * Math.sin(f / 19)}px) rotate(${rotate + Math.sin(f / 32) * 2}deg) scale(${0.88 + enter * 0.12})`,
        filter: 'drop-shadow(0 42px 74px rgba(0,0,0,0.85))',
      }}
    />
  );
};

const Scene: React.FC<{total: number; children: React.ReactNode}> = ({total, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: fade(f, total)}}>{children}</AbsoluteFill>;
};

const Intro = () => {
  const f = useCurrentFrame();
  const move = interpolate(f, [0, 30], [80, 0], {extrapolateRight: 'clamp'});
  return (
    <Scene total={96}>
      <Backdrop />
      <Label>FEEL WHAT YOU HEAR</Label>
      <div style={{position: 'absolute', top: 375, width: '100%', textAlign: 'center', transform: `translateY(${move}px)`, color: C.cream, fontWeight: 950, fontSize: 124, letterSpacing: -7, lineHeight: 0.99}}>
        FEEL THE<br/><span style={{color: C.orange}}>BASS.</span>
      </div>
      <Headphone top={680} width={920} rotate={-6} />
      <div style={{position: 'absolute', bottom: 355, left: 80, right: 80, textAlign: 'center', color: C.muted, fontSize: 32, fontWeight: 600, letterSpacing: 3}}>NOT JUST SOUND. A SENSATION.</div>
    </Scene>
  );
};

const Hero = () => (
  <Scene total={97}>
    <Backdrop />
    <Label>THE ICONIC WIRELESS EXPERIENCE</Label>
    <div style={{position: 'absolute', top: 370, width: '100%', textAlign: 'center', color: C.cream, fontWeight: 950, fontSize: 118, lineHeight: 1.02}}>CRUSHER<br/><span style={{color: C.orange}}>EVO</span></div>
    <Headphone top={690} width={950} />
    <div style={{position: 'absolute', bottom: 350, width: '100%', color: '#fff', textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: 4}}>YOUR MUSIC. AMPLIFIED.</div>
  </Scene>
);

const Bass = () => {
  const f = useCurrentFrame();
  return (
    <Scene total={100}>
      <Backdrop />
      <Label>MAKE EVERY BEAT YOURS</Label>
      <div style={{position: 'absolute', top: 385, left: 76, right: 76, color: C.cream, fontWeight: 950, fontSize: 95, lineHeight: 1.05, textAlign: 'center'}}>ADJUSTABLE<br/><span style={{color: C.orange}}>SENSORY BASS</span></div>
      <Headphone type="angle" top={680} width={830} rotate={-5} />
      <div style={{position: 'absolute', bottom: 340, left: 112, right: 112, height: 26, borderRadius: 20, background: '#393942', boxShadow: '0 0 28px rgba(255,92,39,.4)'}}>
        <div style={{width: `${35 + 51 * Math.sin(f / 35) ** 2}%`, height: '100%', background: `linear-gradient(90deg, #ff902c, ${C.orange})`, borderRadius: 22}} />
        <div style={{position: 'absolute', left: `calc(${35 + 51 * Math.sin(f / 35) ** 2}% - 18px)`, top: -10, width: 44, height: 44, borderRadius: '50%', background: '#fff', boxShadow: '0 0 18px rgba(255,255,255,.7)'}} />
      </div>
      <div style={{position: 'absolute', bottom: 273, width: '100%', textAlign: 'center', color: C.muted, fontSize: 29, fontWeight: 700, letterSpacing: 3}}>DIAL IT IN. FEEL THE DIFFERENCE.</div>
    </Scene>
  );
};

const Battery = () => {
  const f = useCurrentFrame();
  const charge = interpolate(f, [0, 60], [0.02, 1], {extrapolateRight: 'clamp'});
  return (
    <Scene total={100}>
      <Backdrop />
      <Label>MORE PLAY. LESS WAIT.</Label>
      <div style={{position: 'absolute', top: 370, width: '100%', textAlign: 'center', fontWeight: 950, fontSize: 135, color: C.cream}}>40 <span style={{color: C.orange}}>HRS</span></div>
      <div style={{position: 'absolute', top: 534, width: '100%', textAlign: 'center', fontSize: 40, color: '#fff', fontWeight: 800, letterSpacing: 4}}>OF BATTERY LIFE</div>
      <Headphone top={700} width={760} rotate={6} />
      <div style={{position: 'absolute', bottom: 363, width: 550, height: 115, left: 252, border: '9px solid white', borderRadius: 18, padding: 13}}>
        <div style={{height: '100%', width: `${charge * 100}%`, background: `linear-gradient(90deg, #ffb56d, ${C.orange})`, borderRadius: 4}} />
        <div style={{position: 'absolute', right: -29, width: 22, height: 43, top: 27, borderRadius: '0 7px 7px 0', background: '#fff'}} />
      </div>
      <div style={{position: 'absolute', bottom: 255, width: '100%', textAlign: 'center', fontSize: 31, fontWeight: 700, color: C.cream}}>10 MIN CHARGE = 4 HRS PLAY</div>
    </Scene>
  );
};

const Sound = () => (
  <Scene total={98}>
    <Backdrop accent={false} />
    <div style={{position: 'absolute', top: 250, left: 100, right: 100, height: 970, borderRadius: 34, overflow: 'hidden', border: '2px solid rgba(255,255,255,.13)'}}>
      <Img src={staticFile('headphones-lifestyle.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center'}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.04) 0%, rgba(0,0,0,.15) 45%, rgba(0,0,0,.96) 100%)'}}/>
    </div>
    <div style={{position: 'absolute', top: 1335, width: '100%', textAlign: 'center', fontSize: 98, fontWeight: 950, lineHeight: 1.1, color: C.cream}}>
      PERSONAL<br/><span style={{color: C.orange}}>SOUND.</span>
    </div>
    <div style={{position: 'absolute', top: 1625, width: '100%', textAlign: 'center', fontSize: 30, letterSpacing: 2, color: C.muted}}>A LISTENING PROFILE FOR YOU</div>
  </Scene>
);

const CTA = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: f, fps, config: {damping: 14, stiffness: 115}});
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', color: C.cream, fontSize: 107, lineHeight: 1.04, fontWeight: 950}}>CRUSH THE<br/><span style={{color: C.orange}}>ORDINARY.</span></div>
      <Headphone top={650} width={850} rotate={-5} />
      <div style={{position: 'absolute', bottom: 295, left: 155, right: 155, height: 122, borderRadius: 28, background: C.orange, color: '#fff', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 51, letterSpacing: 5, transform: `scale(${0.85 + pop * 0.15})`, boxShadow: '0 24px 65px rgba(255,92,39,.4)'}}>SHOP ON NOON</div>
      <div style={{position: 'absolute', bottom: 218, width: '100%', textAlign: 'center', fontSize: 24, color: C.muted}}>CRUSHER EVO · TRUE BLACK</div>
    </AbsoluteFill>
  );
};

export const CrusherEvoAd: React.FC = () => (
  <AbsoluteFill style={{fontFamily: 'Arial, Helvetica, sans-serif', background: '#050508'}}>
    <Audio src={staticFile('crusher-beat.wav')} volume={0.70} />
    <Sequence from={0} durationInFrames={96}><Intro /></Sequence>
    <Sequence from={82} durationInFrames={97}><Hero /></Sequence>
    <Sequence from={165} durationInFrames={100}><Bass /></Sequence>
    <Sequence from={253} durationInFrames={100}><Battery /></Sequence>
    <Sequence from={340} durationInFrames={98}><Sound /></Sequence>
    <Sequence from={425} durationInFrames={55}><CTA /></Sequence>
  </AbsoluteFill>
);
