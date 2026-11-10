import {mkdirSync, writeFileSync} from 'node:fs';

const rate = 44100;
const duration = 16;
const size = duration * rate;
const out = Buffer.alloc(44 + size * 2);
const rand = (i) => {
  let a = (i * 16807 + 120834) % 2147483647;
  return a / 1073741824 - 1;
};
let peak = 0;
const samples = new Float32Array(size);
for (let i = 0; i < size; i++) {
  const t = i / rate;
  const beatPosition = (t * 2) % 1;
  const halfBeat = (t * 4) % 1;
  const noteIdx = Math.floor(t / 0.5) % 8;
  const notes = [55,55,65.41,55,73.42,65.41,49,49];
  const bassFreq = notes[noteIdx];
  const env = Math.exp(-beatPosition * 5);
  const bass = (Math.sin(t * bassFreq * Math.PI * 2) * 0.75 + Math.sin(t * bassFreq * Math.PI * 4) * 0.18) * env;
  const kick = Math.sin(2 * Math.PI * (58 * beatPosition / 2 + 30 * (1 - Math.exp(-20 * beatPosition)) / 20)) * Math.exp(-beatPosition * 16);
  const snarePhase = (t + 0.5) % 1;
  const snare = rand(i) * Math.exp(-snarePhase * 28) * 0.28;
  const hat = rand(i * 7 + 3) * Math.exp(-halfBeat * 48) * 0.07;
  const shimmer = Math.sin(2 * Math.PI * (220 + 0.4 * Math.sin(t * 2)) * t) * 0.018;
  const fade = Math.min(1, t / 0.32, (duration - t) / 0.55);
  const value = (0.33 * bass + 0.40 * kick + 0.21 * snare + hat + shimmer) * Math.max(0, fade);
  samples[i] = Math.tanh(value * 1.15);
  peak = Math.max(peak, Math.abs(samples[i]));
}
out.write('RIFF',0);
out.writeUInt32LE(out.length - 8,4);
out.write('WAVE',8);
out.write('fmt ',12);
out.writeUInt32LE(16,16);
out.writeUInt16LE(1,20);
out.writeUInt16LE(1,22);
out.writeUInt32LE(rate,24);
out.writeUInt32LE(rate * 2,28);
out.writeUInt16LE(2,32);
out.writeUInt16LE(16,34);
out.write('data',36);
out.writeUInt32LE(size * 2,40);
for (let i=0; i<size; i++) out.writeInt16LE(Math.trunc(samples[i] * 25000),44+i*2);
mkdirSync('public', {recursive:true});
writeFileSync('public/crusher-beat.wav',out);
console.log('Original 16-second electronic beat created. Peak:',peak.toFixed(3));
