import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {statSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
const file='out/pps-dubai-promo.mp4', report='out/pps-verification.json';
mkdirSync('out',{recursive:true});
let results={passed:false};
try {
  assert.ok(existsSync(file),'video file is missing');
  const bytes=statSync(file).size;
  assert.ok(bytes>100000,'video unexpectedly small');
  const ff=spawnSync('ffprobe',['-v','error','-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate','-of','json',file],{encoding:'utf8'});
  assert.equal(ff.status,0,ff.stderr);
  const info=JSON.parse(ff.stdout);
  const v=info.streams.find(x=>x.codec_type==='video'),a=info.streams.find(x=>x.codec_type==='audio');
  assert.ok(v,'missing video stream'); assert.ok(a,'missing original music');
  assert.equal(v.codec_name,'h264');assert.equal(v.width,1080);assert.equal(v.height,1920);
  assert.equal(v.r_frame_rate,'30/1');
  const duration=Number(info.format.duration);
  assert.ok(duration>=19.85 && duration<=20.15,'Expected 20 seconds; got '+duration);
  results={passed:true,video:file,resolution:'1080x1920',format:'9:16 vertical',
    durationSeconds:duration,fps:30,videoCodec:v.codec_name,audioCodec:a.codec_name,sizeBytes:bytes};
  console.log('PASS - PPS Dubai promotional MP4',results);
}catch(error){
  results={passed:false,error:String(error)};
  console.error('FAIL - PPS Dubai promotional MP4',error);
  process.exitCode=1;
}
writeFileSync(report,JSON.stringify(results,null,2)+'\n');
