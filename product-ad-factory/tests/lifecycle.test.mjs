import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildApp} from '../app/server.mjs';

test('Owner upload → manual approval → authenticated worker result → paid delivery', async()=>{
  const dir=mkdtempSync(join(tmpdir(),'factory-lifecycle-'));
  const adminKey='local-admin-key-very-long-test-secret';
  const workerKey='local-worker-key-very-long-test-secret';
  const app=await buildApp({
    dataDir:dir,logger:false,adminKey,workerKey,
    merchantAllowlist:['noon.com'],assetAllowlist:['f.nooncdn.com']
  });
  const adminHeaders={'x-admin-key':adminKey};
  const workerHeaders={authorization:'Bearer '+workerKey};
  try{
    const payload={
      clientName:'Demo Owner',clientEmail:'owner@demo.example',brandName:'Test Product',
      productUrl:'https://noon.com/sample/owner-product',imageUrl:'',
      title:'Handmade ceramic coffee cup',claims:['Original ceramic glaze'],
      language:'en',packageKey:'single',color:'#2366ac',
      extraLanguage:false,rightsConfirmed:true,
      rightsNote:'I created the product illustration and own the image rights.',
      termsAccepted:true
    };
    const created=await app.inject({method:'POST',url:'/api/orders',payload});
    assert.equal(created.statusCode,201,created.body);
    const {orderId,trackingToken}=created.json();
    const publicStatus=()=>app.inject({url:'/api/orders/'+orderId,headers:{'x-tracking-token':trackingToken}});
    const deniedDownload=await app.inject({url:'/api/orders/'+orderId+'/video',
      headers:{'x-tracking-token':trackingToken}});
    assert.equal(deniedDownload.statusCode,403);

    const fakeJpeg=Buffer.alloc(1400,3);
    fakeJpeg[0]=255;fakeJpeg[1]=216;fakeJpeg[2]=255;
    const upload=await app.inject({method:'POST',url:'/api/orders/'+orderId+'/asset',
      payload:fakeJpeg,headers:{'x-tracking-token':trackingToken,'Content-Type':'image/jpeg'}});
    assert.equal(upload.statusCode,200,upload.body);
    assert.equal(upload.json().uploaded,true);

    const approval=await app.inject({method:'POST',url:'/api/admin/orders/'+orderId+'/approve',
      headers:{...adminHeaders,'Content-Type':'application/json'},
      payload:{title:'Approved ceramic cup',claims:['Hand-finished ceramic'],
        imageUrl:'',rightsNote:'I inspected original photo and owner license evidence.',
        claimsChecked:true,rightsChecked:true}});
    assert.equal(approval.statusCode,200,approval.body);
    assert.equal((await publicStatus()).json().status,'approved');

    const manifest=await app.inject({url:'/api/worker/orders/'+orderId+'/manifest',headers:workerHeaders});
    assert.equal(manifest.statusCode,200,manifest.body);
    assert.equal(manifest.json().title,'Approved ceramic cup');
    assert.ok(!manifest.body.includes('owner@demo.example'));
    const image=await app.inject({url:'/api/worker/orders/'+orderId+'/image',headers:workerHeaders});
    assert.equal(image.statusCode,200);
    assert.ok(image.rawPayload.length===1400);

    // Fake bytes exercise API auth/state only; real video validity is tested separately with FFprobe in CI.
    const mockVideo=Buffer.alloc(30000,7);
    Buffer.from('ftyp').copy(mockVideo,4);
    const sha=createHash('sha256').update(mockVideo).digest('hex');
    const result=await app.inject({method:'PUT',url:'/api/worker/orders/'+orderId+'/result',
      headers:{...workerHeaders,'Content-Type':'application/octet-stream','x-content-sha256':sha},
      payload:mockVideo});
    assert.equal(result.statusCode,200,result.body);
    assert.equal((await publicStatus()).json().status,'ready');
    const stillDenied=await app.inject({url:'/api/orders/'+orderId+'/video',
      headers:{'x-tracking-token':trackingToken}});
    assert.equal(stillDenied.statusCode,403);

    const noPayment=await app.inject({method:'POST',url:'/api/admin/orders/'+orderId+'/deliver',
      headers:adminHeaders,payload:{paymentReference:''}});
    assert.equal(noPayment.statusCode,422);
    const delivery=await app.inject({method:'POST',url:'/api/admin/orders/'+orderId+'/deliver',
      headers:adminHeaders,payload:{paymentReference:'MANUAL-PAID-1234'}});
    assert.equal(delivery.statusCode,200,delivery.body);
    const delivered=await app.inject({url:'/api/orders/'+orderId+'/video',
      headers:{'x-tracking-token':trackingToken}});
    assert.equal(delivered.statusCode,200);
    assert.equal(delivered.rawPayload.length,mockVideo.length);
  } finally {await app.close();rmSync(dir,{recursive:true,force:true});}
});
