import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import {fileURLToPath} from 'node:url';
import {join,resolve,extname} from 'node:path';
import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {quote,PRICES} from './pricing.mjs';
import {makeStore,checkTracking,customerView,safeKey} from './db.mjs';
import {validatePublicUrl,merchantHosts,assetHosts,inspectProduct,downloadImage} from './product-url.mjs';
import {publicOrderSchema,approvalSchema,idSchema} from './schemas.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const validId = (str) => idSchema.safeParse(str).success;
const bearer = (req) => /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1] || '';
const secureFileType = (buf, mime) => {
  if (mime === 'image/png' && buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (mime === 'image/jpeg' && buf.length >= 4 && buf[0] === 255 && buf[1] === 216 && buf[2] === 255) return 'jpg';
  if (mime === 'image/webp' && buf.subarray(0,4).toString() === 'RIFF' && buf.subarray(8,12).toString() === 'WEBP') return 'webp';
  throw new Error('Invalid image upload (JPEG, PNG, WebP only)');
};
const fail = (reply,status,message) => reply.code(status).send({error:message});
async function workflowDispatch(orderId, config) {
  if (!config.githubToken || !config.githubRepo || !config.githubRef || !config.publicBaseUrl) {
    return {sent:false,reason:'Rendering connector not configured; order approved for manual dispatch'};
  }
  if (!/^https:\/\//.test(config.publicBaseUrl)) {
    return {sent:false,reason:'FACTORY_PUBLIC_URL must use HTTPS'};
  }
  const [owner,repo] = config.githubRepo.split('/');
  if (!owner || !repo) return {sent:false,reason:'Invalid GitHub repository'};
  const endpoint = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo)
    + '/actions/workflows/product-ad-render.yml/dispatches';
  const resp = await fetch(endpoint,{
    method:'POST',
    headers:{Authorization:'Bearer '+config.githubToken,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
    body:JSON.stringify({ref:config.githubRef,inputs:{order_id:orderId}}),
    signal:AbortSignal.timeout(15000)
  });
  if (resp.status !== 204) return {sent:false,reason:'GitHub refused workflow dispatch (HTTP '+resp.status+')'};
  return {sent:true};
}
export async function buildApp(options={}) {
  const config = {
    dataDir:resolve(options.dataDir || process.env.DATA_DIR || join(root,'.local-data')),
    adminKey:options.adminKey || process.env.ADMIN_KEY,
    workerKey:options.workerKey || process.env.WORKER_KEY,
    githubToken:options.githubToken ?? process.env.GITHUB_TOKEN,
    githubRepo:options.githubRepo ?? process.env.GITHUB_REPO,
    githubRef:options.githubRef ?? process.env.GITHUB_REF,
    publicBaseUrl:options.publicBaseUrl ?? process.env.FACTORY_PUBLIC_URL,
    merchantAllowlist: options.merchantAllowlist || merchantHosts(),
    assetAllowlist: options.assetAllowlist || assetHosts(),
  };
  if (!config.adminKey || config.adminKey.length < 24 || !config.workerKey || config.workerKey.length < 24) {
    throw new Error('ADMIN_KEY and WORKER_KEY must each contain at least 24 random characters');
  }
  mkdirSync(config.dataDir,{recursive:true});
  const store=makeStore(join(config.dataDir,'orders.sqlite3'));
  const app=Fastify({logger:options.logger ?? true,bodyLimit:7_000_000,trustProxy:false});
  await app.register(rateLimit,{global:false});
  await app.register(staticPlugin,{root:join(root,'website'),prefix:'/'});
  app.addContentTypeParser(['image/png','image/jpeg','image/webp','application/octet-stream'],
    {parseAs:'buffer',bodyLimit:100_000_000},(req,body,done)=>done(null,body));
  app.addHook('onSend',async(req,reply,payload)=>{
    reply.header('X-Content-Type-Options','nosniff').header('X-Frame-Options','DENY')
      .header('Referrer-Policy','no-referrer').header('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    if (req.url.startsWith('/api/')) reply.header('Cache-Control','no-store');
    return payload;
  });
  app.addHook('onClose',async()=>store.close());
  const adminAuth = async(req,reply)=>{
    if (!safeKey(req.headers['x-admin-key'],config.adminKey)) return fail(reply,401,'Admin authorization required');
  };
  const workerAuth = async(req,reply)=>{
    if (!safeKey(bearer(req),config.workerKey)) return fail(reply,401,'Worker authorization required');
  };
  const trackAuth = async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row || !checkTracking(row,req.headers['x-tracking-token'])) return fail(reply,404,'Order not found');
    req.order=row;
  };
  app.get('/health',async()=>({status:'ok',service:'Product Ad Factory',version:'0.1.0'}));
  app.get('/api/prices',async()=>({packages:PRICES,extraLanguageAed:99,currency:'AED'}));
  app.post('/api/preview',{config:{rateLimit:{max:8,timeWindow:'1 minute'}}},async(req,reply)=>{
    const input=String(req.body?.productUrl || '');
    if (input.length > 1600) return fail(reply,422,'URL too long');
    try {
      return await inspectProduct(input,{allowlist:config.merchantAllowlist});
    } catch(error) {
      return fail(reply,422,'Automatic preview unavailable: '+String(error.message).slice(0,180)+'. Enter verified details manually.');
    }
  });
  app.post('/api/orders',{config:{rateLimit:{max:4,timeWindow:'1 hour'}}},async(req,reply)=>{
    const parsed=publicOrderSchema.safeParse(req.body);
    if (!parsed.success) return fail(reply,422,'Invalid order. Review contact, rights confirmation, product information and package.');
    const input=parsed.data;
    try {
      validatePublicUrl(input.productUrl,config.merchantAllowlist);
      if (input.imageUrl) validatePublicUrl(input.imageUrl,config.assetAllowlist);
    } catch(error) {return fail(reply,422,error.message);}
    if (input.packageKey !== 'single' || input.extraLanguage) return fail(reply,422,'Online intake currently supports Single Ad only. For managed packages contact the operator.');
    const price=quote(input.packageKey,input.extraLanguage);
    const {order,trackingToken}=store.create(input,price);
    return reply.code(201).send({orderId:order.id,trackingToken,status:order.status,
      quote:price,note:'Awaiting manual verification of marketing claims and image rights. No payment has been taken.'});
  });
  app.get('/api/orders/:id',{preHandler:trackAuth},async(req)=>customerView(req.order));
  app.post('/api/orders/:id/asset',{preHandler:trackAuth,bodyLimit:6_000_000},async(req,reply)=>{
    if (req.order.status !== 'pending_review') return fail(reply,409,'Images can only be submitted before approval');
    if (!Buffer.isBuffer(req.body)) return fail(reply,415,'Upload a JPEG, PNG or WebP image directly');
    let ext;
    try {ext=secureFileType(req.body,String(req.headers['content-type']||'').split(';')[0]);}
    catch(err){return fail(reply,415,err.message);}
    const path=join(config.dataDir,'assets',req.order.id+'.'+ext);
    mkdirSync(join(config.dataDir,'assets'),{recursive:true});
    writeFileSync(path+'.tmp',req.body);renameSync(path+'.tmp',path);
    store.update(req.order.id,{image_path:path});
    return {uploaded:true,bytes:req.body.length,kind:ext,
      note:'Owner rights assertion recorded; a reviewer must still approve publication'};
  });
  app.get('/api/orders/:id/video',{preHandler:trackAuth},async(req,reply)=>{
    if (req.order.status!=='delivered' || !req.order.output_path || !existsSync(req.order.output_path))
      return fail(reply,403,'Payment confirmation and delivery approval required');
    reply.header('Content-Type','video/mp4').header('Content-Disposition','attachment; filename="product-ad.mp4"');
    return reply.send(readFileSync(req.order.output_path));
  });
  app.get('/api/admin/orders',{preHandler:adminAuth},async()=>({orders:store.list()}));
  app.get('/api/admin/orders/:id',{preHandler:adminAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    return row || fail(reply,404,'Order not found');
  });
  app.post('/api/admin/orders/:id/approve',{preHandler:adminAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if (row.status!=='pending_review' && row.status!=='failed') return fail(reply,409,'Order cannot be approved in this state');
    const parsed=approvalSchema.safeParse(req.body);
    if(!parsed.success) return fail(reply,422,'Manual approval requires verified claims, image permission evidence and a valid image URL');
    const data=parsed.data;
    let imagePath=row.image_path;
    if (!imagePath || !existsSync(imagePath)) {
      try {
        validatePublicUrl(data.imageUrl,config.assetAllowlist);
        const image=await downloadImage(data.imageUrl,{allowlist:config.assetAllowlist});
        mkdirSync(join(config.dataDir,'assets'),{recursive:true});
        imagePath=join(config.dataDir,'assets',row.id+'.'+image.ext);
        writeFileSync(imagePath+'.tmp',image.bytes);
        renameSync(imagePath+'.tmp',imagePath);
      } catch(error){return fail(reply,422,'Approved product image could not be acquired: '+error.message);}
    }
    store.update(row.id,{
      approved_title:data.title,
      approved_claims_json:JSON.stringify(data.claims),
      approved_image_url:data.imageUrl,
      rights_note:data.rightsNote,
      rights_reviewed:1,
      image_path:imagePath,
      status:'approved',
      error:null,
    });
    return {status:'approved',orderId:row.id,
      next:'Dispatch the rendering job after confirming payment terms.'};
  });
  app.post('/api/admin/orders/:id/dispatch',{preHandler:adminAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if(row.status!=='approved' && row.status!=='failed') return fail(reply,409,'Order is not approved for rendering');
    if(!row.rights_reviewed || !row.approved_claims_json || !row.image_path || !existsSync(row.image_path))
      return fail(reply,409,'Rights, claims, or staged photo missing');
    let result;
    try {result=await workflowDispatch(row.id,config);}
    catch {return fail(reply,503,'GitHub dispatch unavailable; retry later');}
    if (!result.sent) return fail(reply,503,result.reason);
    store.update(row.id,{status:'rendering',error:null});
    return {status:'rendering',orderId:row.id,via:'github_actions'};
  });
  app.post('/api/admin/orders/:id/deliver',{preHandler:adminAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if(row.status!=='ready') return fail(reply,409,'Rendering must finish before delivery');
    const reference=String(req.body?.paymentReference||'').trim();
    if(reference.length<5 || reference.length>100) return fail(reply,422,'A verified payment reference is required');
    store.update(row.id,{paid_reference:reference,status:'delivered'});
    return {orderId:row.id,status:'delivered',paymentReference:reference};
  });
  app.post('/api/admin/orders/:id/reject',{preHandler:adminAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if(row.status!=='pending_review') return fail(reply,409,'Cannot reject in this state');
    store.update(row.id,{status:'rejected',error:String(req.body?.reason||'Review required').slice(0,250)});
    return {status:'rejected'};
  });
  app.get('/api/worker/orders/:id/manifest',{preHandler:workerAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if (!['approved','rendering','failed'].includes(row.status) || !row.rights_reviewed)
      return fail(reply,403,'Order not approved for rendering');
    return {orderId:row.id,brand:row.brand_name,title:row.approved_title,
      claims:row.approvedClaims,language:row.language,color:row.color,
      website:row.product_url,template:'kinetic-product-v1'};
  });
  app.get('/api/worker/orders/:id/image',{preHandler:workerAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row || !['approved','rendering','failed'].includes(row.status) || !row.rights_reviewed ||
      !row.image_path || !existsSync(row.image_path)) return fail(reply,404,'Approved image not available');
    const ext=extname(row.image_path).slice(1);
    reply.header('Content-Type',({'jpg':'image/jpeg','png':'image/png','webp':'image/webp'})[ext]||'application/octet-stream');
    return reply.send(readFileSync(row.image_path));
  });
  app.put('/api/worker/orders/:id/result',{preHandler:workerAuth,bodyLimit:100_000_000},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if (!['approved','rendering'].includes(row.status)) return fail(reply,409,'Order is not rendering');
    if (!Buffer.isBuffer(req.body) || req.body.length<20_000 || req.body.length>99_000_000)
      return fail(reply,422,'Bad MP4 size');
    if(req.body.subarray(4,8).toString()!=='ftyp') return fail(reply,422,'Not an MP4 file');
    const actual=createHash('sha256').update(req.body).digest('hex');
    if (!safeKey(req.headers['x-content-sha256'],actual)) return fail(reply,422,'Video checksum mismatch');
    mkdirSync(join(config.dataDir,'exports'),{recursive:true});
    const output=join(config.dataDir,'exports',row.id+'.mp4');
    writeFileSync(output+'.tmp',req.body);renameSync(output+'.tmp',output);
    store.update(row.id,{status:'ready',output_path:output,error:null});
    return {status:'ready',sha256:actual};
  });
  app.post('/api/worker/orders/:id/fail',{preHandler:workerAuth},async(req,reply)=>{
    const row=validId(req.params.id) && store.byId(req.params.id);
    if (!row) return fail(reply,404,'Order not found');
    if(!['rendering','approved'].includes(row.status))return fail(reply,409,'Not an active rendering job');
    store.update(row.id,{status:'failed',error:'Renderer failed; inspect CI logs'});
    return {status:'failed'};
  });
  return app;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app=await buildApp();
  const port=Number(process.env.PORT || 3100);
  const host=process.env.HOST || '127.0.0.1';
  await app.listen({port,host});
}
