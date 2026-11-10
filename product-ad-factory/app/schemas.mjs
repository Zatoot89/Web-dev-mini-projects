import {z} from 'zod';
export const publicOrderSchema=z.object({
  clientName:z.string().trim().min(2).max(90),
  clientEmail:z.email().max(180),
  brandName:z.string().trim().min(2).max(90),
  productUrl:z.url().max(1600),
  imageUrl:z.union([z.url(),z.literal('')]).default(''),
  title:z.string().trim().min(4).max(160),
  claims:z.array(z.string().trim().min(3).max(100)).min(1).max(3),
  language:z.enum(['en','ar']).default('en'),
  packageKey:z.enum(['single','growth','scale']).default('single'),
  color:z.string().regex(/^#[A-Fa-f0-9]{6}$/).default('#2563eb'),
  extraLanguage:z.boolean().default(false),
  rightsConfirmed:z.literal(true),
  rightsNote:z.string().trim().min(12).max(500),
  termsAccepted:z.literal(true),
}).strict();
export const approvalSchema=z.object({
  title:z.string().trim().min(4).max(160),
  claims:z.array(z.string().trim().min(3).max(100)).min(1).max(3),
  imageUrl:z.url().max(1600),
  rightsNote:z.string().trim().min(12).max(500),
  claimsChecked:z.literal(true),
  rightsChecked:z.literal(true),
}).strict();
export const idSchema=z.string().uuid();
