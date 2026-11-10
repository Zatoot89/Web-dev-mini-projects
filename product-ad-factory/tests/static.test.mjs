import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildApp} from '../app/server.mjs';

test('Sales landing page, operator UI and demo illustration are served',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'factory-static-'));
  const app=await buildApp({
    logger:false,dataDir:dir,
    adminKey:'admin-test-secret-long-enough-123',
    workerKey:'worker-test-secret-long-enough-123',
  });
  try {
    const landing=await app.inject({url:'/'});
    assert.equal(landing.statusCode,200);
    assert.match(landing.body,/PRODUCT AD FACTORY/);
    assert.match(landing.body,/Get started/);
    const admin=await app.inject({url:'/admin.html'});
    assert.equal(admin.statusCode,200);
    assert.match(admin.body,/OPERATOR CONSOLE/);
    const image=await app.inject({url:'/demo-cup.svg'});
    assert.equal(image.statusCode,200);
    assert.match(image.body,/<svg/);
    const prices=await app.inject({url:'/api/prices'});
    assert.equal(prices.json().packages.single.totalAed,249);
  } finally {
    await app.close();
    rmSync(dir,{recursive:true,force:true});
  }
});
