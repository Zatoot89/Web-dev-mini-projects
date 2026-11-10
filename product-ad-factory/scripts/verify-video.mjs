import {spawnSync} from 'node:child_process';
import {statSync,mkdirSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import assert from 'node:assert/strict';
const input=process.argv[2]||'out/demo.mp4';
mkdirSync('out',{recursive:true});
let report;
try {
  const size=statSync(input).size;
  assert.ok(size>25000,'Empty video');
  const ff=spawnSync('ffprobe',['-v','error','-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate',
    '-of','json',input],{encoding:'utf8'});
  assert.equal(ff.status,0,ff.stderr);
  const info=JSON.parse(ff.stdout);
  const video=info.streams.find(s=>s.codec_type==='video');
  const audio=info.streams.find(s=>s.codec_type==='audio');
  assert.ok(video && audio,'Video and audio streams required');
  assert.equal(video.codec_name,'h264');
  assert.equal(video.width,1080);assert.equal(video.height,1920);
  assert.equal(video.r_frame_rate,'30/1');
  const duration=Number(info.format.duration);
  assert.ok(duration>=19.8&&duration<=20.3,'Must be a 20-second creative');
  report={passed:true,file:basename(input),bytes:size,durationSeconds:duration,resolution:'1080x1920',
    fps:30,videoCodec:video.codec_name,audioCodec:audio.codec_name};
  console.log('PASS:',report);
} catch (e) {
  report={passed:false,error:String(e)};
  console.error('FAIL:',e);
  process.exitCode=1;
}
writeFileSync('out/video-qa.json',JSON.stringify(report,null,2)+'\n');
