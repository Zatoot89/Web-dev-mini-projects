import React from 'react';
import {
  AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';

const NAVY = '#061D3D';
const BLUE = '#176AB8';
const GOLD = '#F1C66D';
const WHITE = '#F6F9FE';

const blend = (f: number, frames: number) =>
  interpolate(f, [0, 13, frames - 19, frames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const AnimatedScene: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: blend(frame, frames), overflow: 'hidden'}}>{children}</AbsoluteFill>;
};

const Mark: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
    <div style={{width: 77, height: 77, borderRadius: 22, border: `3px solid ${GOLD}`,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize: 29, fontWeight: 950,
      color: dark ? NAVY : '#fff', background: dark ? '#F3F7FD' : 'rgba(9,33,69,.80)'}}>
      PPS
    </div>
    <div style={{lineHeight: 1.1, letterSpacing: 3, color: dark ? NAVY : '#fff',
      fontSize: 27, fontWeight: 900}}>PPS DUBAI<div style={{fontSize: 14, letterSpacing: 2.8,
      fontWeight: 750, color: dark ? '#406083' : '#D7E3F2', marginTop: 6}}>PHILADELPHIA PRIVATE SCHOOL</div></div>
  </div>
);

const Header: React.FC<{dark?: boolean}> = ({dark}) => (
  <div style={{position:'absolute', top:100, left:64, right:64, display:'flex', alignItems:'center',
    justifyContent:'space-between'}}>
    <Mark dark={dark}/>
    <div style={{width:64, height:5, borderRadius:8, background:GOLD}}/>
  </div>
);

const Tag: React.FC<{children: React.ReactNode; dark?: boolean}> = ({children,dark}) => (
  <div style={{fontSize: 24, fontWeight: 900, letterSpacing: 7, color: dark ? BLUE : GOLD,
    textTransform:'uppercase', marginBottom: 28}}>{children}</div>
);

const Photo: React.FC<{image:'pps-campus-1.jpg'|'pps-campus-2.jpg'; style?: React.CSSProperties}> = ({image, style}) => {
  const frame=useCurrentFrame();
  const zoom=1.045+interpolate(frame,[0,110],[0,.095],{extrapolateRight:'clamp'});
  return <Img src={staticFile(image)} style={{position:'absolute',width:'100%',height:'100%',
    objectFit:'cover', objectPosition:'50% 48%',
    transform:`scale(${zoom})`,...style}} />;
};

const Sparkles: React.FC<{gold?: boolean}> = ({gold = true}) => {
  const f=useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    {Array.from({length:16},(_,i)=>{
      const left=(i*137+19)%101;
      const top=(i*227+11)%96;
      const size=i%3===0?8:4;
      return <div key={i} style={{position:'absolute',left:`${left}%`,top:`${top}%`,
        width:size,height:size,borderRadius:'50%',background:gold?GOLD:'#5FB4ED',
        opacity:.16+.20*Math.sin(f/23+i),transform:`translateY(${-f*(.08+i%4*.02)}px)`}}/>;
    })}
  </AbsoluteFill>;
};

const Welcome = () => {
  const f=useCurrentFrame();
  const {fps}=useVideoConfig();
  const entrance=spring({fps,frame:f,config:{stiffness:78,damping:19}});
  return <AnimatedScene frames={114}>
    <AbsoluteFill style={{background:NAVY}}/>
    <div style={{position:'absolute',left:0,right:0,top:0,height:1190,overflow:'hidden'}}>
      <Photo image="pps-campus-1.jpg"/>
      <AbsoluteFill style={{background:'linear-gradient(180deg, rgba(4,22,48,.50) 0%, rgba(4,22,48,.13) 34%, rgba(6,29,61,.25) 61%, #061D3D 100%)'}}/>
    </div>
    <Sparkles/>
    <Header/>
    <div style={{position:'absolute',top:1020,left:66,right:66,
      transform:`translateY(${(1-entrance)*125}px)`}}>
      <Tag>WELCOME TO A WORLD OF POSSIBILITIES</Tag>
      <div style={{fontSize:111,fontWeight:950,color:WHITE,lineHeight:.99,letterSpacing:-4}}>
        LEARN.<br/>GROW.<br/><span style={{color:GOLD}}>BELONG.</span>
      </div>
      <div style={{width:150,height:7,background:GOLD,marginTop:40,borderRadius:5}}/>
    </div>
    <div style={{position:'absolute',bottom:200,left:70,color:'#D0E3F6',fontSize:31,fontWeight:700,letterSpacing:2}}>
      PHILADELPHIA PRIVATE SCHOOL · DUBAI
    </div>
  </AnimatedScene>;
};

const Vision = () => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const go=spring({frame:f,fps,config:{damping:18,stiffness:70}});
  return <AnimatedScene frames={113}>
    <AbsoluteFill style={{background:'radial-gradient(circle at 85% 18%, #BDE6FF 0%, #EEF5FB 42%, #FCF9F1 100%)'}}/>
    <div style={{position:'absolute',width:970,height:970,border:'2px solid rgba(23,106,184,.11)',
      borderRadius:'50%',left:410,top:360,transform:`scale(${1+f/1300})`}}/>
    <div style={{position:'absolute',width:580,height:580,border:'3px solid rgba(23,106,184,.15)',
      borderRadius:'50%',left:600,top:550}}/>
    <Header dark/>
    <div style={{position:'absolute',top:375,left:76,right:76,transform:`translateY(${(1-go)*90}px)`}}>
      <Tag dark>OUR PHILOSOPHY</Tag>
      <div style={{fontSize:105,fontWeight:950,color:NAVY,lineHeight:1.02,letterSpacing:-3}}>
        EVERY<br/><span style={{color:BLUE}}>LEARNER</span><br/>MATTERS.
      </div>
      <div style={{marginTop:66,width:840,fontSize:50,lineHeight:1.35,color:'#285176',fontWeight:750}}>
        One happy learner<br/>at a time.
      </div>
    </div>
    <div style={{position:'absolute',bottom:290,left:88,right:88,padding:'42px 48px',
      borderRadius:35,background:'#fff',boxShadow:'0 23px 100px rgba(32,78,125,.12)'}}>
      <div style={{color:BLUE,fontSize:28,letterSpacing:5,fontWeight:850}}>STUDENT-DRIVEN LEARNING</div>
      <div style={{color:NAVY,fontSize:41,fontWeight:900,marginTop:14}}>A COMMUNITY WHERE YOU THRIVE.</div>
    </div>
  </AnimatedScene>;
};

const Programs = () => {
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  const slide=spring({fps,frame:f,config:{damping:16,stiffness:74}});
  return <AnimatedScene frames={113}>
    <AbsoluteFill style={{background:'linear-gradient(158deg, #03152E 0%, #103E75 60%, #0A2549 100%)'}}/>
    <Sparkles/>
    <Header/>
    <div style={{position:'absolute',top:356,left:70,right:70,transform:`translateY(${(1-slide)*80}px)`}}>
      <Tag>PATHWAYS TO THE FUTURE</Tag>
      <div style={{fontSize:101,fontWeight:950,color:'#fff',letterSpacing:-3,lineHeight:1.04}}>
        A WORLD<br/>OF <span style={{color:GOLD}}>CHOICE.</span>
      </div>
      <div style={{marginTop:82,display:'flex',flexDirection:'column',gap:28}}>
        {[['AMERICAN','CURRICULUM','FOUNDATIONS FOR SUCCESS'],['IB DIPLOMA','PROGRAMME','GLOBAL-MINDED LEARNING']].map(([a,b,c],i)=>(
          <div key={a} style={{height:288,borderRadius:34,padding:'43px 46px',
            background:i===0?'rgba(255,255,255,.12)':'rgba(241,198,109,.16)',
            border:'2px solid rgba(255,255,255,.25)',
            transform:`translateX(${(1-slide)*(i?160:-160)}px)`}}>
            <div style={{fontSize:23,color:GOLD,fontWeight:800,letterSpacing:6}}>{c}</div>
            <div style={{fontSize:65,fontWeight:950,color:'#fff',lineHeight:1.02,marginTop:24}}>{a}<br/>{b}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{position:'absolute',bottom:225,left:73,right:73,fontSize:44,
      color:'#F3F6FC',fontWeight:850,letterSpacing:2}}>PRE-KG  →  GRADE 12</div>
    <div style={{position:'absolute',bottom:190,left:73,right:73,height:4,background:GOLD}}/>
  </AnimatedScene>;
};

const Icon: React.FC<{kind:'science'|'tech'|'sport'}> = ({kind}) => (
  <svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke={BLUE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
    {kind==='science' ? <><path d="M43 15h34M53 15v31L26 93q-6 13 12 13h44q18 0 12-13L67 46V15"/><path d="M37 82h46"/><circle cx="55" cy="91" r="4" fill={GOLD}/></>
    : kind==='tech' ? <><rect x="15" y="21" width="90" height="65" rx="9"/><path d="M45 105h30M60 86v19M30 48h21M30 60h43"/><circle cx="82" cy="57" r="8" fill={GOLD}/></>
    : <><circle cx="60" cy="60" r="43"/><path d="M19 60h82M60 17c-30 20-30 66 0 86M60 17c30 20 30 66 0 86"/><path d="M29 30c20 29 40 29 62 0M29 90c20-29 40-29 62 0"/></>}
  </svg>
);

const Facilities = () => {
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  return <AnimatedScene frames={113}>
    <AbsoluteFill style={{background:'linear-gradient(135deg, #FFFDF7, #EBF5FD 85%)'}}/>
    <Header dark/>
    <div style={{position:'absolute',top:360,left:70,right:70}}>
      <Tag dark>LEARNING BEYOND THE ORDINARY</Tag>
      <div style={{fontSize:99,fontWeight:950,color:NAVY,lineHeight:1.05,letterSpacing:-3}}>
        ROOM TO<br/><span style={{color:BLUE}}>EXPLORE.</span>
      </div>
      <div style={{marginTop:90,display:'flex',flexDirection:'column',gap:25}}>
        {[
          {kind:'science' as const,head:'DISCOVER',sub:'Science laboratories'},
          {kind:'tech' as const,head:'CREATE',sub:'Connected classrooms'},
          {kind:'sport' as const,head:'PLAY',sub:'Sports & activities'},
        ].map(({kind,head,sub},i)=>{
          const move=spring({fps,frame:Math.max(0,f-i*9),config:{damping:17,stiffness:75}});
          return <div key={head} style={{display:'flex',alignItems:'center',gap:45,height:252,
            padding:'0 35px',borderRadius:34,background:'#fff',boxShadow:'0 15px 55px rgba(21,64,110,.10)',
            transform:`translateY(${(1-move)*130}px)`}}>
              <div style={{width:160,height:160,display:'grid',placeItems:'center',background:'#EBF5FF',borderRadius:32}}><Icon kind={kind}/></div>
              <div><div style={{fontSize:52,color:NAVY,fontWeight:950,letterSpacing:1}}>{head}</div>
              <div style={{fontSize:28,color:'#4A6C90',fontWeight:720,marginTop:7}}>{sub}</div></div>
            </div>;
        })}
      </div>
    </div>
    <div style={{position:'absolute',bottom:160,left:72,right:72,fontSize:26,color:'#517093',fontWeight:700,letterSpacing:2}}>
      CURIOUS MINDS. REAL POSSIBILITIES.
    </div>
  </AnimatedScene>;
};

const Values = () => {
  const f=useCurrentFrame();
  return <AnimatedScene frames={113}>
    <AbsoluteFill style={{background:'radial-gradient(circle at 15% 15%, #2365A1, #051A37 67%)'}}/>
    <Sparkles/>
    <Header/>
    <div style={{position:'absolute',top:370,left:72,right:72}}>
      <Tag>GROWING WITH PURPOSE</Tag>
      <div style={{fontSize:101,fontWeight:950,color:'#fff',letterSpacing:-2,lineHeight:1.03}}>
        MORE THAN<br/><span style={{color:GOLD}}>ACADEMICS.</span>
      </div>
      <div style={{color:'#D7E7F7',fontSize:38,lineHeight:1.36,marginTop:48,fontWeight:700}}>
        Values that shape confident,<br/>compassionate learners.
      </div>
    </div>
    <div style={{position:'absolute',top:970,left:75,right:75,display:'flex',flexDirection:'column',gap:19}}>
      {[
        ['P','PERSEVERANCE'],['A','AGILITY'],['C','CLARITY'],['E','EMPATHY'],['R','RESPECT']
      ].map(([letter,word],i)=>{
        const progress=interpolate(f,[i*7,i*7+24],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
        return <div key={letter} style={{display:'flex',alignItems:'center',height:121,gap:29,opacity:progress,
          transform:`translateX(${(1-progress)*80}px)`,borderBottom:'1px solid rgba(255,255,255,.2)'}}>
          <div style={{width:83,height:83,background:GOLD,color:NAVY,borderRadius:17,
            fontSize:48,fontWeight:950,display:'grid',placeItems:'center'}}>{letter}</div>
          <div style={{fontSize:39,color:'#fff',fontWeight:850,letterSpacing:3}}>{word}</div>
        </div>;
      })}
    </div>
    <div style={{position:'absolute',bottom:120,left:76,color:'#BACEDD',fontSize:25,letterSpacing:3,fontWeight:700}}>PPS PACER VALUES</div>
  </AnimatedScene>;
};

const Ending = () => {
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  const appear=spring({frame:f,fps,config:{damping:16,stiffness:76}});
  return <AbsoluteFill style={{background:NAVY}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:1070,overflow:'hidden'}}>
      <Photo image="pps-campus-2.jpg"/>
      <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(5,28,58,.3),rgba(5,28,58,.1) 35%,#061D3D 100%)'}}/>
    </div>
    <Sparkles/>
    <Header/>
    <div style={{position:'absolute',top:1040,left:65,right:65,transform:`translateY(${(1-appear)*110}px)`}}>
      <Tag>YOUR NEXT CHAPTER STARTS HERE</Tag>
      <div style={{fontSize:104,color:'#fff',fontWeight:950,letterSpacing:-2,lineHeight:1.02}}>
        DISCOVER<br/><span style={{color:GOLD}}>PPS DUBAI.</span>
      </div>
      <div style={{fontSize:40,color:'#D9E8F5',fontWeight:720,lineHeight:1.35,marginTop:36}}>
        Where we measure success<br/>one happy learner at a time.
      </div>
      <div style={{background:GOLD,padding:'31px 27px',borderRadius:27,
        textAlign:'center',marginTop:65,boxShadow:'0 20px 70px rgba(241,198,109,.15)'}}>
        <div style={{fontSize:53,fontWeight:950,letterSpacing:2,color:NAVY}}>ppsdubai.org</div>
      </div>
      <div style={{fontSize:30,fontWeight:750,color:'#ECF4FF',textAlign:'center',marginTop:34,letterSpacing:3}}>
        EXPLORE ADMISSIONS
      </div>
    </div>
    <div style={{position:'absolute',bottom:88,left:0,right:0,fontSize:24,
      letterSpacing:4,color:'#A8C5E2',textAlign:'center'}}>PHILADELPHIA PRIVATE SCHOOL · DUBAI</div>
  </AbsoluteFill>;
};

export const PpsDubaiAd: React.FC = () =>
  <AbsoluteFill style={{background:NAVY,fontFamily:'Arial, Helvetica, sans-serif'}}>
    <Audio src={staticFile('pps-original-music.wav')} volume={.78}/>
    <Sequence from={0} durationInFrames={114}><Welcome/></Sequence>
    <Sequence from={100} durationInFrames={113}><Vision/></Sequence>
    <Sequence from={199} durationInFrames={113}><Programs/></Sequence>
    <Sequence from={298} durationInFrames={113}><Facilities/></Sequence>
    <Sequence from={397} durationInFrames={113}><Values/></Sequence>
    <Sequence from={498} durationInFrames={102}><Ending/></Sequence>
  </AbsoluteFill>;
