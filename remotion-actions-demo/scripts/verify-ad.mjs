import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, statSync, writeFileSync} from 'node:fs';

const file = 'out/crusher-evo-vertical.mp4';
const reportPath = 'out/crusher-verification.json';
mkdirSync('out', {recursive:true});
let report;
try {
  assert.ok(existsSync(file), 'MP4 missing');
  const sizeBytes = statSync(file).size;
  assert.ok(sizeBytes > 180000, 'Suspiciously small video');
  const r = spawnSync('ffprobe',
    ['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,r_frame_rate','-of','json',file],
    {encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const info = JSON.parse(r.stdout);
  const video = info.streams.find(s=>s.codec_type==='video');
  const audio = info.streams.find(s=>s.codec_type==='audio');
  assert.ok(video, 'No video stream');
  assert.ok(audio, 'No music/audio track');
  assert.equal(video.codec_name,'h264');
  assert.equal(video.width,1080);
  assert.equal(video.height,1920);
  assert.equal(video.r_frame_rate,'30/1');
  const duration=Number(info.format.duration);
  assert.ok(duration>=15.85 && duration<=16.15,`Bad duration: ${duration}`);
  report = {passed:true,video:file,format:'9:16 vertical',resolution:'1080x1920',fps:30,durationSeconds:duration,videoCodec:video.codec_name,audioCodec:audio.codec_name,bytes:sizeBytes};
  console.log('PASS: Crusher Evo promotional video verified!',report);
} catch(error) {
  report = {passed:false,error:String(error)};
  console.error('FAIL:', error);
  process.exitCode=1;
}
writeFileSync(reportPath, JSON.stringify(report,null,2)+'\n');
