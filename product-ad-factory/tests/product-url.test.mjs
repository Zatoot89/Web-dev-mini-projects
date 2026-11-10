import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMetadata,validatePublicUrl,allowedHost,inspectProduct} from '../app/product-url.mjs';

test('Noon-style product metadata is extracted without trusting claims',()=>{
  const html = '<html><head><meta content="Crusher Evo &amp; More" property="og:title"><meta property="og:image" content="https://f.nooncdn.com/product.jpg"><meta name="description" content="Bass-rich headphones"><title>Fallback</title></head></html>';
  const data=parseMetadata(html,'https://www.noon.com/uae-en/item/p');
  assert.equal(data.title,'Crusher Evo & More');
  assert.equal(data.candidateImageUrl,'https://f.nooncdn.com/product.jpg');
  assert.equal(data.requiresClaimsReview,true);
  assert.equal(data.requiresRightsReview,true);
});
test('JSON-LD can provide metadata if Open Graph is unavailable',()=>{
  const html='<script type="application/ld+json">{"@type":"Product","name":"Handmade cup","image":["https://shop.example.com/photo.png"]}</script>';
  const data=parseMetadata(html,'https://shop.example.com/cup');
  assert.equal(data.title,'Handmade cup');
});
test('Only allowlisted https merchant hosts work',()=>{
  assert.equal(allowedHost('store.myshopify.com',['myshopify.com']),true);
  assert.equal(allowedHost('notmyshopify.com',['myshopify.com']),false);
  assert.throws(()=>validatePublicUrl('http://noon.com/a',['noon.com']));
  assert.throws(()=>validatePublicUrl('https://127.0.0.1/a',['127.0.0.1']));
  assert.throws(()=>validatePublicUrl('https://noon.com.evil.site/a',['noon.com']));
  assert.throws(()=>validatePublicUrl('https://noon.com:8443/a',['noon.com']));
});
test('Inspectable product page via injected fetch and DNS safely',async()=>{
  const fakeFetch=async()=>new Response('<meta property="og:title" content="Demo listing">',{headers:{'content-type':'text/html'}});
  const data=await inspectProduct('https://noon.com/approved/product',{allowlist:['noon.com'],fetcher:fakeFetch,dnsCheck:async()=>{}});
  assert.equal(data.title,'Demo listing');
});
test('Redirects to non-approved hosts are rejected',async()=>{
  const fakeFetch=async()=>new Response(null,{status:302,headers:{location:'https://169.254.169.254/latest/meta-data'}});
  await assert.rejects(()=>inspectProduct('https://noon.com/p',{allowlist:['noon.com'],fetcher:fakeFetch,dnsCheck:async()=>{}}));
});
