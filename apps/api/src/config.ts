import dotenv from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Local development only; in production the platform (Render) injects real env vars.
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(10),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().min(1),
  WEB_URL: z.string().url(),
  REVALIDATE_SECRET: z.string().min(16),
  ACCESS_TTL_MIN: z.coerce.number().default(30),
  REFRESH_TTL_DAYS: z.coerce.number().default(30),
  /** How long "trust this browser" skips the authenticator code (0 turns the option off). */
  TRUSTED_DEVICE_DAYS: z.coerce.number().int().min(0).max(90).default(30),
  MAX_FAILED_LOGINS: z.coerce.number().default(5),
  LOCKOUT_MIN: z.coerce.number().default(15),
  // Encrypts integration keys (Cloudinary, Resend) and 2FA seeds stored in the database. Falls back to JWT_ACCESS_SECRET if unset.
  SECRETS_ENCRYPTION_KEY: z.string().min(32, 'SECRETS_ENCRYPTION_KEY must be at least 32 characters').optional(),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  MAX_VIDEO_MB: z.coerce.number().default(100),
});

// Fail fast at boot if anything is missing or weak. An empty value (KEY="") counts as "not set".
const parsed = schema.safeParse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '')));
if (!parsed.success) {
  console.error('\nInvalid environment configuration (check your .env, or run: npm run doctor):');
  for (const i of parsed.error.issues) console.error(`  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  console.error('');
  process.exit(1);
}
export const config = parsed.data;
export const isProd = config.NODE_ENV === 'production';
export const allowedOrigins = new Set(
  [...config.CORS_ORIGINS.split(','), config.WEB_URL].map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
);
