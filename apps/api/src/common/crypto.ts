import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'crypto';
import { config } from '../config';

/** Key for encrypting secrets stored in the database (API keys, 2FA seeds). Derived with HKDF so the raw env value is never used directly. */
function key(): Buffer {
  const ikm = config.SECRETS_ENCRYPTION_KEY ?? config.JWT_ACCESS_SECRET;
  return Buffer.from(hkdfSync('sha256', ikm, 'sevenoaks-salt-v1', 'sevenoaks-secrets-v1', 32));
}

/** AES-256-GCM. Output format: v1.<iv>.<tag>.<ciphertext> (all base64url). */
export function encryptSecret(plain: string, k: Buffer = key()): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function decryptSecret(blob: string, k: Buffer = key()): string {
  const [v, iv, tag, ct] = blob.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Bad ciphertext');
  const d = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8');
}

export const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
