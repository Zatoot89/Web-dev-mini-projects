import React from 'react';
import {
  AbsoluteFill, Audio, Img, interpolate, Sequence, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';

export type AdProps = {
  brand: string;
  title: string;
  claims: string[];
  language: 'en' | 'ar';
  color: string;
  website: string;
  image: string;
};
export const defaultProductProps: AdProps = {
  brand: 'DEMO BRAND',
  title: 'Everyday Ceramic Mug',
  claims: ['Comfortable handle', 'Timeless finish', 'A little joy in every sip'],
  language: 'en',
  color: '#3C82F6',
  website: 'example.com',
  image: 'demo-cup.svg',
};
const C = {dark: '#0A111E',white:'#FFFFFF',cream:'#F6F7FA',muted:'#B9C4D4'};
const intro = (frame: number,fps:number) => spring({frame,fps,config:{damping:18,stiffness:72}});
const fade = (frame:number,length:number) => interpolate(frame,[0,13,length-13,length],[0,1,1,0],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp'
});
const Scene: React.FC<{frames:number;children:React.ReactNode}> = ({frames,children}) => {
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{opacity:fade(frame,frames)}}>{children}</AbsoluteFill>;
};
const Background: React.FC<{accent:string;light?:boolean}> = ({accent,light=false}) => {
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{overflow:'hidden',background:light
    ? 'radial-gradient(circle at 15% 15%,#FFFFFF 0%,#EDF2F9 60%,#E8EEF6 100%)'
    : 'radial-gradient(circle at 72% 24%, #203451 0%, #0B172A 42%, #07101D 90%)'}}>
    <div style={{position:'absolute',width:1060,height:1060,
      top:405+15*Math.sin(frame/25),left:120,borderRadius:'50%',opacity:.2,
      border:'3px solid '+accent,boxShadow:'0 0 180px '+accent}}/>
    <div style={{position:'absolute',width:720,height:720,top:590,left:305,borderRadius:'50%',
      opacity:.13,border:'2px solid '+accent}}/>
    <div style={{position:'absolute',width:500,height:800,top:-420,left:-280,
      background:accent,filter:'blur(260px)',opacity:light?.10:.07}}/>
  </AbsoluteFill>;
};
const Header: React.FC<{brand:string;accent:string;light?:boolean}> = ({brand,accent,light=false}) => (
  <div style={{position:'absolute',left:70,right:70,top:104,display:'flex',
    alignItems:'center',justifyContent:'space-between',fontWeight:900,letterSpacing:4,
    fontSize:29,color:light?C.dark:C.white}}>
    <span style={{maxWidth:650,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{brand.toUpperCase().slice(0,35)}</span>
    <span style={{fontSize:24,color:accent,letterSpacing:3}}>PRODUCT FILM / 01</span>
  </div>
);
const Frame: React.FC<{image:string;top:number;size:number;rotate?:number}> = ({image,top,size,rotate=0}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const appear=intro(frame,fps);
  return <div style={{position:'absolute',left:(1080-size)/2,top,width:size,height:size,
    borderRadius:55,background:'#fff',boxShadow:'0 43px 105px rgba(0,0,0,.40)',
    overflow:'hidden',transform:'translateY('+((1-appear)*120+Math.sin(frame/20)*12)+'px) rotate('+(rotate+Math.sin(frame/50)*1.6)+'deg)'}}>
    <Img src={staticFile(image)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
  </div>;
};
const Arrow: React.FC<{accent:string}> = ({accent}) => (
  <div style={{width:60,height:60,borderRadius:'50%',background:accent,display:'grid',placeItems:'center',fontSize:37,color:'#fff'}}>
    ↗
  </div>
);
const Opening: React.FC<{item:AdProps}> = ({item}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const move=intro(frame,fps);
  const rtl=item.language==='ar';
  return <Scene frames={206}>
    <Background accent={item.color}/>
    <Header brand={item.brand} accent={item.color}/>
    <div style={{position:'absolute',top:320,left:68,right:68,
      transform:'translateY('+((1-move)*100)+'px)',
      textAlign:rtl?'right':'left',direction:rtl?'rtl':'ltr'}}>
      <div style={{color:item.color,fontSize:30,fontWeight:850,letterSpacing:rtl?0:7}}>
        {rtl?'اكتشف الفرق':'DISCOVER SOMETHING BETTER'}
      </div>
      <div style={{color:C.white,fontSize:item.title.length>37?73:96,fontWeight:950,
        lineHeight:1.09,marginTop:28,overflowWrap:'anywhere',letterSpacing:rtl?0:-2}}>
        {item.title}
      </div>
    </div>
    <Frame image={item.image} size={820} top={820} rotate={-3}/>
    <div style={{position:'absolute',bottom:146,left:80,right:80,display:'flex',alignItems:'center',
      justifyContent:'space-between',color:C.muted,fontSize:27,fontWeight:790,letterSpacing:2}}>
      <span>{rtl?'مصمم ليناسب يومك':'MADE FOR YOUR EVERYDAY'}</span>
      <Arrow accent={item.color}/>
    </div>
  </Scene>;
};
const Details: React.FC<{item:AdProps}> = ({item}) => {
  const rtl=item.language==='ar';
  return <Scene frames={212}>
    <Background accent={item.color} light/>
    <Header brand={item.brand} accent={item.color} light/>
    <div style={{position:'absolute',top:330,left:75,right:75,
      direction:rtl?'rtl':'ltr',textAlign:rtl?'right':'left'}}>
      <div style={{fontSize:29,color:item.color,fontWeight:900,letterSpacing:rtl?0:6}}>
        {rtl?'لماذا ستحبه':'WHY YOU’LL LOVE IT'}
      </div>
      <div style={{fontSize:106,lineHeight:1.02,fontWeight:950,color:C.dark,marginTop:35}}>
        {rtl?'التفاصيل تصنع الفرق':'DETAILS MAKE THE DIFFERENCE.'}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:24,marginTop:88}}>
        {item.claims.slice(0,3).map((claim,i)=>(
          <div key={i} style={{minHeight:168,display:'flex',alignItems:'center',gap:26,
            borderRadius:26,background:'#FFF',padding:'25px 31px',
            boxShadow:'0 16px 55px rgba(28,60,105,.09)'}}>
            <div style={{flexShrink:0,width:75,height:75,borderRadius:21,background:item.color,
              color:'#FFF',fontSize:37,fontWeight:900,display:'grid',placeItems:'center'}}>{i+1}</div>
            <div style={{color:C.dark,fontWeight:830,fontSize:claim.length>55?34:40,
              lineHeight:1.18,overflowWrap:'anywhere'}}>{claim}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{position:'absolute',bottom:106,left:74,right:74,height:6,background:item.color,borderRadius:4}}/>
  </Scene>;
};
const Finish: React.FC<{item:AdProps}> = ({item}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const scale=intro(frame,fps);
  const rtl=item.language==='ar';
  return <AbsoluteFill>
    <Background accent={item.color}/>
    <Header brand={item.brand} accent={item.color}/>
    <div style={{position:'absolute',top:317,left:68,right:68,color:item.color,fontSize:31,
      fontWeight:880,letterSpacing:rtl?0:6,direction:rtl?'rtl':'ltr'}}>
      {rtl?'الاختيار لك الآن':'YOUR NEXT FAVORITE'}
    </div>
    <div style={{position:'absolute',top:380,left:70,right:70,fontSize:91,fontWeight:950,
      lineHeight:1.1,color:C.white,overflowWrap:'anywhere',direction:rtl?'rtl':'ltr'}}>
      {item.title}
    </div>
    <Frame image={item.image} size={790} top={760} rotate={3}/>
    <div style={{position:'absolute',bottom:222,left:100,right:100,height:128,
      borderRadius:31,background:item.color,boxShadow:'0 28px 85px rgba(0,0,0,.4)',
      display:'grid',placeItems:'center',transform:'scale('+(0.86+.14*scale)+')'}}>
      <div style={{color:'#FFFFFF',fontSize:55,fontWeight:950,letterSpacing:rtl?0:4}}>
        {rtl?'تسوق الآن':'SHOP NOW'} ↗
      </div>
    </div>
    <div style={{position:'absolute',bottom:129,left:70,right:70,textAlign:'center',
      color:C.muted,fontSize:29,fontWeight:730}}>
      {item.website.replace(/^https?:\/\//,'').replace(/\/.*/,'').slice(0,75)}
    </div>
  </AbsoluteFill>;
};
export const ProductAd:React.FC<AdProps> = (item) => (
  <AbsoluteFill style={{background:C.dark,fontFamily:item.language==='ar'
    ? 'Noto Sans Arabic, Arial, sans-serif' : 'Arial, Helvetica, sans-serif'}}>
    <Audio src={staticFile('studio-beat.wav')} volume={.65}/>
    <Sequence from={0} durationInFrames={206}><Opening item={item}/></Sequence>
    <Sequence from={193} durationInFrames={212}><Details item={item}/></Sequence>
    <Sequence from={390} durationInFrames={210}><Finish item={item}/></Sequence>
  </AbsoluteFill>
);
