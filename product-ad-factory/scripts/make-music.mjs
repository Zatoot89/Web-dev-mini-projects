import {writeFileSync,mkdirSync} from 'node:fs';
// Original synthesized instrumental; no external samples or protected compositions.
const rate=44100, seconds=20, count=rate*seconds;
const file=Buffer.alloc(44+count*2);
file.write('RIFF',0);file.writeUInt32LE(file.length-8,4);file.write('WAVE',8);
file.write('fmt ',12);file.writeUInt32LE(16,16);file.writeUInt16LE(1,20);
file.writeUInt16LE(1,22);file.writeUInt32LE(rate,24);
file.writeUInt32LE(rate*2,28);file.writeUInt16LE(2,32);
file.writeUInt16LE(16,34);file.write('data',36);file.writeUInt32LE(count*2,40);
const chord=[164.81,196,220,246.94];
for(let i=0;i<count;i++){
  const t=i/rate, beat=t*2, half=t*4;
  const rhythm=(beat%1), hat=(half%1);
  const phase=(t%0.5);
  const note=chord[Math.floor(t/2)%4];
  const bass=Math.sin(t*note*Math.PI*2)*.115;
  const kick=Math.sin(2*Math.PI*(75*t+11*(1-Math.exp(-23*rhythm))/23))*
    Math.exp(-16*rhythm)*.41;
  const twinkle=(Math.sin(2*Math.PI*note*2*t)+.2*Math.sin(2*Math.PI*note*4*t))*
    .12*Math.exp(-6*phase);
  const n=((Math.imul(i*71+3,16807)>>>0)/2147483648)-1;
  const hiss=n*.05*Math.exp(-42*hat);
  const fade=Math.min(1,t/.4,(seconds-t)/.8);
  const val=Math.tanh((bass+kick+twinkle+hiss)*1.35)*Math.max(0,fade);
  file.writeInt16LE(Math.trunc(val*24500),44+i*2);
}
mkdirSync('public',{recursive:true});
writeFileSync('public/studio-beat.wav',file);
console.log('Generated original 20s instrumental:',file.length,'bytes');
