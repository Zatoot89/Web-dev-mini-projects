import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

const PRIVATE_IPV4 = [
  /^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^192\.0\.0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^198\.(1[89])\./, /^224\./, /^2(2[4-9]|[3-5]\d)\./
];
const publicIp = (address) => {
  if (isIP(address) === 4) return !PRIVATE_IPV4.some(r => r.test(address)) && address !== '255.255.255.255';
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower.includes(':ffff:')) {
      const v4 = lower.slice(lower.lastIndexOf(':') + 1);
      if (isIP(v4) === 4) return publicIp(v4);
    }
    return !(lower === '::1' || lower === '::' || lower.startsWith('fe80:') ||
      lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('ff'));
  }
  return false;
};
export function allowedHost(host, entries) {
  return entries.some(suffix => {
    const base = suffix.trim().toLowerCase();
    return base && (host.toLowerCase() === base || host.toLowerCase().endsWith('.' + base));
  });
}
export function validatePublicUrl(input, allowedHosts) {
  const value = new URL(input);
  if (value.protocol !== 'https:' || value.username || value.password || value.port) {
    throw new Error('Only public HTTPS addresses without credentials or custom ports are accepted');
  }
  if (isIP(value.hostname) || value.hostname === 'localhost' || !allowedHost(value.hostname, allowedHosts)) {
    throw new Error('Merchant hostname not enabled. Contact support to approve this storefront.');
  }
  value.hash = '';
  return value;
}
const getHosts = (kind) => (process.env[kind] || '').split(',').map(s => s.trim()).filter(Boolean);
export const merchantHosts = () => getHosts('ALLOWED_MERCHANT_HOSTS');
export const assetHosts = () => getHosts('ALLOWED_ASSET_HOSTS');
async function checkDns(host) {
  const records = await lookup(host, {all: true, verbatim: true});
  if (!records.length || records.some(record => !publicIp(record.address))) {
    throw new Error('Blocked non-public DNS address');
  }
}
export async function fetchPublic(input, allowedHosts, maxBytes, contentType, fetchImpl=fetch, dnsCheck=checkDns) {
  let url = validatePublicUrl(input, allowedHosts);
  for (let i = 0; i < 3; i++) {
    await dnsCheck(url.hostname);
    const response = await fetchImpl(url, {
      redirect: 'manual',
      headers: {'User-Agent': 'ProductAdFactoryPilot/0.1 (+merchant-authorized inspection)','Accept': contentType === 'image' ? 'image/*' : 'text/html'},
      signal: AbortSignal.timeout(10000),
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      url = validatePublicUrl(new URL(location,url).href, allowedHosts);
      continue;
    }
    if (!response.ok) throw new Error('Merchant refused metadata access (HTTP ' + response.status + ')');
    const mime = response.headers.get('content-type') || '';
    if (contentType === 'html' && !/text\/html/i.test(mime)) throw new Error('Not an HTML product page');
    if (contentType === 'image' && !/^image\/(jpeg|png|webp)(?:;|$)/i.test(mime)) throw new Error('Invalid image MIME type');
    const declared = Number(response.headers.get('content-length') || '0');
    if (declared > maxBytes) throw new Error('Source too large');
    if (!response.body) throw new Error('Missing response body');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > maxBytes) {await response.body.cancel().catch(()=>{}); throw new Error('Source too large');}
      chunks.push(chunk);
    }
    return {body: Buffer.concat(chunks), mime: mime.split(';')[0].toLowerCase(), finalUrl: url.href};
  }
  throw new Error('Too many redirects');
}
const decode = (s) => (s || '')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&#(\d+);/g, (_,code)=>String.fromCodePoint(Number(code)));
const strip = (s) => decode(s.replace(/<[^>]*>/g, '')).trim();
export function parseMetadata(html, url) {
  const tags = new Map();
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = {};
    const attrRe = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let m;
    while ((m=attrRe.exec(tag))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
    if (attrs.content && (attrs.property || attrs.name)) {
      tags.set((attrs.property || attrs.name).toLowerCase(),strip(attrs.content));
    }
  }
  let product = {};
  for (const [,raw] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(raw);
      const options = Array.isArray(data) ? data : [data];
      const flat = options.flatMap(o => Array.isArray(o['@graph']) ? o['@graph'] : [o]);
      const match = flat.find(o => String(o['@type'] || '').toLowerCase().includes('product'));
      if (match) {product = match; break;}
    } catch {}
  }
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const image = product.image && (Array.isArray(product.image) ? product.image[0] : product.image);
  const candidate = tags.get('og:image') || (typeof image === 'string' ? image : image?.url) || '';
  let candidateImageUrl = '';
  try {candidateImageUrl = candidate ? new URL(candidate,url).href : '';} catch {}
  return {
    title: String(tags.get('og:title') || product.name || (titleTag && strip(titleTag[1])) || '').slice(0,160),
    description: String(tags.get('og:description') || product.description || tags.get('description') || '').slice(0,500),
    candidateImageUrl,
    sourceUrl: url,
    source: 'merchant_metadata_unverified',
    requiresRightsReview: true,
    requiresClaimsReview: true,
  };
}
export async function inspectProduct(input, opts={}) {
  const origin=validatePublicUrl(input,opts.allowlist || merchantHosts());
  const page=await fetchPublic(origin.href, opts.allowlist || merchantHosts(), 1500000,'html',opts.fetcher,opts.dnsCheck);
  return parseMetadata(page.body.toString('utf8'),page.finalUrl);
}
export async function downloadImage(input, opts={}) {
  const img=await fetchPublic(input, opts.allowlist || assetHosts(), 6000000,'image',opts.fetcher,opts.dnsCheck);
  const signatures = {
    'image/jpeg': img.body[0] === 0xff && img.body[1] === 0xd8 && img.body[2] === 0xff,
    'image/png': img.body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/webp': img.body.subarray(0,4).toString() === 'RIFF' && img.body.subarray(8,12).toString() === 'WEBP'
  };
  if (!signatures[img.mime]) throw new Error('Unsupported image data');
  return {bytes:img.body, ext:({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[img.mime],finalUrl:img.finalUrl};
}
