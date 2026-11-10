import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
const base=process.env.FACTORY_PUBLIC_URL, token=process.env.WORKER_KEY, id=process.env.ORDER_ID;
if(!base?.startsWith('https://') || !token || !z.uuid().safeParse(id).success)
  throw new Error('Worker delivery settings missing');
const bytes=readFileSync('out/product-ad.mp4');
const sha=createHash('sha256').update(bytes).digest('hex');
const resp=await fetch(base.replace(/\/+$/,'')+'/api/worker/orders/'+id+'/result',{
  method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream',
    'X-Content-Sha256':sha},
  body:bytes,signal:AbortSignal.timeout(120000),
});
if(!resp.ok)throw new Error('Delivery HTTP '+resp.status+': '+(await resp.text()).slice(0,200));
const result=await resp.json();
if (result.status!=='ready' || result.sha256!==sha)throw new Error('Worker delivery not acknowledged');
console.log('Order '+id+' rendered and securely staged. Payment approval still required.');
