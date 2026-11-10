import Database from 'better-sqlite3';
import {randomBytes, randomUUID, createHash, timingSafeEqual} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export const hashKey = (token) => createHash('sha256').update(token).digest('hex');
export const safeKey = (given, expected) => {
  if (!given || !expected || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};
const parse = (row) => row ? ({
  ...row,
  claims: JSON.parse(row.claims_json || '[]'),
  approvedClaims: JSON.parse(row.approved_claims_json || '[]'),
  rightsConfirmed: !!row.rights_confirmed,
  rightsReviewed: !!row.rights_reviewed,
}) : null;
export function makeStore(dbPath) {
  mkdirSync(dirname(dbPath), {recursive:true});
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec([
    'CREATE TABLE IF NOT EXISTS orders (',
    'id TEXT PRIMARY KEY, tracking_hash TEXT NOT NULL, client_name TEXT NOT NULL, client_email TEXT NOT NULL,',
    'brand_name TEXT NOT NULL, product_url TEXT NOT NULL, candidate_image_url TEXT, title TEXT NOT NULL,',
    'claims_json TEXT NOT NULL, language TEXT NOT NULL, package_key TEXT NOT NULL, quoted_aed INTEGER NOT NULL,',
    'color TEXT NOT NULL, extra_language INTEGER NOT NULL DEFAULT 0, rights_confirmed INTEGER NOT NULL,',
    'rights_note TEXT NOT NULL DEFAULT \'\', rights_reviewed INTEGER NOT NULL DEFAULT 0,',
    'approved_title TEXT, approved_claims_json TEXT, approved_image_url TEXT, image_path TEXT,',
    'output_path TEXT, paid_reference TEXT, status TEXT NOT NULL, error TEXT,',
    'created_at TEXT NOT NULL, updated_at TEXT NOT NULL',
    ');',
    'CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status,created_at);'
  ].join(' '));
  const insert = db.prepare('INSERT INTO orders (id,tracking_hash,client_name,client_email,brand_name,product_url,candidate_image_url,title,claims_json,language,package_key,quoted_aed,color,extra_language,rights_confirmed,rights_note,status,created_at,updated_at) VALUES (@id,@tracking_hash,@client_name,@client_email,@brand_name,@product_url,@candidate_image_url,@title,@claims_json,@language,@package_key,@quoted_aed,@color,@extra_language,@rights_confirmed,@rights_note,@status,@created_at,@updated_at)');
  function create(input, quote) {
    const trackingToken = randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const row = {
      id: randomUUID(), tracking_hash: hashKey(trackingToken),
      client_name: input.clientName, client_email: input.clientEmail,
      brand_name: input.brandName, product_url: input.productUrl,
      candidate_image_url: input.imageUrl || null, title: input.title,
      claims_json: JSON.stringify(input.claims), language: input.language,
      package_key: input.packageKey, quoted_aed: quote.amountAed, color: input.color,
      extra_language: Number(input.extraLanguage), rights_confirmed: Number(input.rightsConfirmed),
      rights_note: input.rightsNote || '', status: 'pending_review', created_at: now, updated_at: now
    };
    insert.run(row);
    return {order: parse(db.prepare('SELECT * FROM orders WHERE id = ?').get(row.id)), trackingToken};
  }
  const byId = (id) => parse(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  const list = () => db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all().map(parse);
  function update(id, fields) {
    if (!byId(id)) throw new Error('ORDER_NOT_FOUND');
    const entries = Object.entries({...fields,updated_at:new Date().toISOString()});
    if (!entries.length) return byId(id);
    for (const [key] of entries) if (![
      'approved_title','approved_claims_json','approved_image_url','rights_note','rights_reviewed',
      'image_path','output_path','status','error','paid_reference','updated_at',
    ].includes(key)) throw new Error('INVALID_FIELD');
    db.prepare('UPDATE orders SET '+ entries.map(([key])=>key+' = ?').join(', ')+' WHERE id = ?')
      .run(...entries.map(([,value])=>value),id);
    return byId(id);
  }
  function close(){db.close();}
  return {create,byId,list,update,close};
}
export const customerView = (row) => ({
  id: row.id,brand:row.brand_name,productTitle:row.title,
  status:row.status,package:row.package_key,quotedAed:row.quoted_aed,
  videoReady:row.status === 'delivered',
  createdAt:row.created_at,updatedAt:row.updated_at,
});
export function checkTracking(row, token) {
  return !!row && safeKey(hashKey(token || ''), row.tracking_hash);
}
