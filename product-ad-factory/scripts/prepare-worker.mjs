import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {z} from 'zod';
const base=process.env.FACTORY_PUBLIC_URL;
const token=process.env.WORKER_KEY;
const id=process.env.ORDER_ID;
if (!base || !base.startsWith('https://') || !token || !z.uuid().safeParse(id).success) {
  throw new Error('Require FACTORY_PUBLIC_URL (HTTPS), WORKER_KEY, and validated ORDER_ID');
}
const root=base.replace(/\/+$/,'');
const headers={Authorization:'Bearer '+token};
const get=async(path)=>{
  const res=await fetch(root+path,{headers,signal:AbortSignal.timeout(30000)});
  if(!res.ok)throw new Error('Worker API HTTP '+res.status+' at '+path);
  return res;
};
const order=await (await get('/api/worker/orders/'+id+'/manifest')).json();
if (order.orderId!==id) throw new Error('Mismatched order id');
const valid=z.object({
  orderId:z.uuid(),brand:z.string().min(1).max(90),title:z.string().min(4).max(160),
  claims:z.array(z.string().min(3).max(100)).min(1).max(3),
  language:z.enum(['en','ar']),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  website:z.url(),template:z.literal('kinetic-product-v1')
}).strict().safeParse(order);
if (!valid.success)throw new Error('Approved order manifest invalid');
const image=await get('/api/worker/orders/'+id+'/image');
const mime=(image.headers.get('content-type')||'').split(';')[0];
const extension=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[mime];
if(!extension)throw new Error('Unexpected image type');
const bytes=Buffer.from(await image.arrayBuffer());
if(bytes.length>6000000 || bytes.length<1000) throw new Error('Invalid asset size');
const path='approved-product.'+extension;
mkdirSync('public',{recursive:true});mkdirSync('out',{recursive:true});
writeFileSync(join('public',path),bytes);
const site = new URL(order.website).hostname.replace(/^www\./,'');
const props={brand:order.brand,title:order.title,claims:order.claims,
  language:order.language,color:order.color,website:site,image:path};
writeFileSync('out/job-props.json',JSON.stringify(props,null,2)+'\n');
await import('./make-music.mjs');
console.log('Prepared approved video input for order '+id+'. No customer PII in render props.');
