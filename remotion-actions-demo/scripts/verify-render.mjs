import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';

const file = process.argv[2] ?? 'out/remotion-smoke.mp4';
const reportFile = 'out/smoke-report.json';

try {
  assert.ok(existsSync(file), `Rendered MP4 not found: ${file}`);
  const sizeBytes = statSync(file).size;
  assert.ok(sizeBytes > 8000, `MP4 looks empty: ${sizeBytes} bytes`);

  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries',
      'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate',
      '-of', 'json', file],
    {encoding: 'utf8'}
  );
  assert.equal(result.status, 0, `ffprobe failed: ${result.stderr}`);

  const metadata = JSON.parse(result.stdout);
  const stream = metadata.streams?.find((candidate) => candidate.codec_type === 'video');
  assert.ok(stream, 'No video stream found');
  assert.equal(stream.codec_name, 'h264', 'Expected H.264 codec');
  assert.equal(stream.width, 1280, 'Unexpected video width');
  assert.equal(stream.height, 720, 'Unexpected video height');
  assert.equal(stream.r_frame_rate, '30/1', 'Expected 30 FPS');

  const duration = Number(metadata.format?.duration);
  assert.ok(duration >= 2.9 && duration <= 3.1,
    `Expected approximately 3 seconds; got ${duration}`);

  const report = {
    passed: true,
    file,
    sizeBytes,
    videoCodec: stream.codec_name,
    resolution: `${stream.width}x${stream.height}`,
    frameRate: stream.r_frame_rate,
    durationSeconds: duration,
  };
  mkdirSync(dirname(reportFile), {recursive: true});
  writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log('PASS - Render verified:', report);
} catch (error) {
  mkdirSync(dirname(reportFile), {recursive: true});
  writeFileSync(reportFile, JSON.stringify({passed: false, error: String(error)}, null, 2) + '\n');
  console.error('FAIL - Remotion render verification:', error);
  process.exitCode = 1;
}
