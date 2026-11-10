// Synthesize an original optimistic instrumental soundtrack; no sampled copyrighted music.
import {mkdirSync, writeFileSync} from 'node:fs';
const sampleRate=44100, seconds=20, samples=sampleRate*seconds;
const buffer=Buffer.alloc(44+samples*2);
const notes=[261.63,329.63,392.0,523.25,392,329.63,293.66,349.23,440,587.33,440,349.23];
const bassNotes=[130.81,130.81,146.83,146.83,174.61,174.61,196,196];
const seed=(i)=>(((Math.imul(i, 747796405) ^ (i>>>13))>>>0) / 2147483648)-1;
let max=0;
for(let i=0;i<samples;i++){
  const t=i/sampleRate;
  const beat=2.4*t, phase=beat%1, eighth=(4.8*t)%1;
  const note=Math.floor(t/.416667)%notes.length;
  const pitch=notes[note];
  const a=(1-Math.exp(-29*(t%.416667)))*Math.exp(-3.2*(t%.416667));
  const bell=(Math.sin(2*Math.PI*pitch*t)+0.29*Math.sin(2*Math.PI*pitch*2*t))*a*.19;
  const chord=.058*(Math.sin(2*Math.PI*261.63*t)+Math.sin(2*Math.PI*329.63*t)+Math.sin(2*Math.PI*392*t));
  const kick=Math.sin(2*Math.PI*(68*t + 22*(1-Math.exp(-phase*25))/25)) * Math.exp(-17*phase)*.29;
  const clapPhase=(t+.417)%(.833);
  const clap=seed(i)*Math.exp(-40*clapPhase)*.10;
  const hat=seed(i*3+12)*Math.exp(-40*eighth)*.036;
  const bass=Math.sin(2*Math.PI*bassNotes[Math.floor(t/1.667)%bassNotes.length]*t)*.105;
  const fade=Math.min(1,t/.36,(seconds-t)/.95);
  const v=Math.tanh((bell+chord+kick+clap+hat+bass)*1.3)*Math.max(0,fade);
  max=Math.max(max,Math.abs(v));
  buffer.writeInt16LE(Math.round(v*24500),44+2*i);
}
buffer.write('RIFF',0);
buffer.writeUInt32LE(buffer.length-8,4);
buffer.write('WAVE',8);
buffer.write('fmt ',12);
buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
buffer.writeUInt32LE(sampleRate,24);buffer.writeUInt32LE(sampleRate*2,28);
buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);
buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);
mkdirSync('public',{recursive:true});
writeFileSync('public/pps-original-music.wav',buffer);
console.log("Original PPS instrumental synthesized",seconds,"seconds, peak",max.toFixed(3));
