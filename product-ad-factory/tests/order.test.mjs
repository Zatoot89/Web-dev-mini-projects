import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {quote} from '../app/pricing.mjs';
import {makeStore,checkTracking,customerView} from '../app/db.mjs';
test('Pricing is deterministic and upsells are explicit',()=>{
  assert.equal(quote('single').amountAed,249);
  assert.equal(quote('growth',true).amountAed,1598);
  assert.equal(quote('scale').videos,24);
  assert.throws(()=>quote('unknown'));
});
test('Orders do not expose tracking tokens or customer PII in status response',()=>{
  const folder=mkdtempSync(join(tmpdir(),'factory-'));
  const store=makeStore(join(folder,'orders.db'));
  try {
    const {order,trackingToken}=store.create({
      clientName:'Client',clientEmail:'merchant@example.com',brandName:'Merchant',
      productUrl:'https://noon.com/p',imageUrl:'',title:'Example product',
      claims:['One clear claim'],language:'en',packageKey:'single',
      color:'#2563eb',extraLanguage:false,rightsConfirmed:true,rightsNote:'I own the images and can use them',
    },quote('single'));
    assert.ok(checkTracking(order,trackingToken));
    assert.equal(checkTracking(order,'wrong'),false);
    assert.equal(order.status,'pending_review');
    const customer=customerView(order);
    assert.ok(!('client_email' in customer));
    assert.ok(!JSON.stringify(customer).includes(trackingToken));
    store.update(order.id,{status:'approved',approved_title:'Approved name',
      approved_claims_json:JSON.stringify(['Verified claim']),rights_reviewed:1});
    assert.equal(store.byId(order.id).status,'approved');
  } finally {store.close();rmSync(folder,{recursive:true,force:true});}
});
