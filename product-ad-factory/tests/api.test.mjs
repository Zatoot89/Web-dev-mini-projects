import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildApp} from '../app/server.mjs';

test('Public quote, authenticated intake and admin review lifecycle',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'factory-http-'));
  const adminKey='admin-testing-key-minimum-32-characters';
  const workerKey='worker-testing-key-minimum-32-characters';
  const app=await buildApp({
    logger:false,dataDir:dir,adminKey,workerKey,
    merchantAllowlist:['noon.com'],assetAllowlist:['f.nooncdn.com'],
  });
  try {
    const price=await app.inject({url:'/api/prices'});
    assert.equal(price.statusCode,200);
    assert.equal(price.json().packages.single.totalAed,249);
    const denied=await app.inject({url:'/api/admin/orders',headers:{'x-admin-key':'invalid'}});
    assert.equal(denied.statusCode,401);
    const payload={
      clientName:'Demo Business',clientEmail:'team@shop.example',brandName:'Demo Store',
      productUrl:'https://www.noon.com/uae-en/item/p',imageUrl:'',
      title:'Wireless over-ear headphones',claims:['Wireless listening','Comfortable over-ear design'],
      language:'en',packageKey:'single',color:'#2563eb',extraLanguage:false,rightsConfirmed:true,
      rightsNote:'We own or have permission to use the source product photos and brand',
      termsAccepted:true,
    };
    const created=await app.inject({method:'POST',url:'/api/orders',payload});
    assert.equal(created.statusCode,201,created.body);
    const {orderId,trackingToken}=created.json();
    assert.ok(orderId && trackingToken);
    const unauthorized=await app.inject({url:'/api/orders/'+orderId});
    assert.equal(unauthorized.statusCode,404);
    const tracking=await app.inject({url:'/api/orders/'+orderId,headers:{'x-tracking-token':trackingToken}});
    assert.equal(tracking.statusCode,200);
    assert.equal(tracking.json().status,'pending_review');
    assert.ok(!tracking.body.includes('clientEmail'));
    const workerDenied=await app.inject({url:'/api/worker/orders/'+orderId+'/manifest',headers:{Authorization:'Bearer '+workerKey}});
    assert.equal(workerDenied.statusCode,403);
    const approvalDenied=await app.inject({method:'POST',url:'/api/admin/orders/'+orderId+'/approve',headers:{'x-admin-key':adminKey},payload:{
      title:'Wireless headphones',claims:['Approved claim'],imageUrl:'https://f.nooncdn.com/photo.jpg',rightsNote:'permission granted'
    }});
    assert.equal(approvalDenied.statusCode,422);
    const admin=await app.inject({url:'/api/admin/orders',headers:{'x-admin-key':adminKey}});
    assert.equal(admin.statusCode,200);
    assert.equal(admin.json().orders[0].status,'pending_review');
    const wrongHost=await app.inject({method:'POST',url:'/api/orders',payload:{...payload,productUrl:'https://127.0.0.1/internal'}});
    assert.equal(wrongHost.statusCode,422);
  } finally {await app.close();rmSync(dir,{recursive:true,force:true});}
});
