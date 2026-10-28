// `npm run doctor`: checks the local setup and tells you what to fix. Safe to run any time (read-only).
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const bad = (m, fix) => { problems++; console.log(`  \x1b[31m✘\x1b[0m ${m}${fix ? `\n      → ${fix}` : ''}`); };
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
let problems = 0;

console.log('\nSeven Oaks: setup check\n');
const [maj, min] = process.versions.node.split('.').map(Number);
maj > 20 || (maj === 20 && min >= 6) ? ok(`Node ${process.versions.node}`) : bad(`Node ${process.versions.node} is too old`, 'Install Node 20.6 or newer (https://nodejs.org)');

const envFile = resolve(root, '.env');
if (!existsSync(envFile)) {
  bad('.env not found at the project root', 'Copy .env.example to .env and fill it in');
  process.exit(1);
}
ok('.env found');
dotenv.config({ path: envFile });
const e = process.env;
const need = ['DATABASE_URL', 'DIRECT_URL', 'JWT_ACCESS_SECRET', 'REVALIDATE_SECRET', 'CORS_ORIGINS', 'WEB_URL', 'API_URL', 'SITE_URL', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];
for (const k of need) if (!e[k]) bad(`${k} is empty`, 'Set it in .env');
if (e.JWT_ACCESS_SECRET && e.JWT_ACCESS_SECRET.length < 32) bad('JWT_ACCESS_SECRET is shorter than 32 characters', 'Run: openssl rand -base64 48   (or any long random text)');
if (e.JWT_ACCESS_SECRET?.startsWith('change-me')) bad('JWT_ACCESS_SECRET is still the example value', 'Replace it with a long random string');
if (e.REVALIDATE_SECRET && e.REVALIDATE_SECRET.length < 16) bad('REVALIDATE_SECRET is shorter than 16 characters');
if (e.SEED_ADMIN_PASSWORD?.startsWith('use-a-strong')) bad('SEED_ADMIN_PASSWORD is still the example value', 'Choose your own admin password (12+ characters)');
if (e.SEED_ADMIN_PASSWORD && e.SEED_ADMIN_PASSWORD.length < 12) bad('SEED_ADMIN_PASSWORD is shorter than 12 characters');
if (e.DATABASE_URL && !/^postgres(ql)?:\/\//.test(e.DATABASE_URL)) bad('DATABASE_URL must start with postgresql://');
if (e.DATABASE_URL?.includes('USER:PASSWORD')) bad('DATABASE_URL still contains the example placeholder', 'Paste your Neon (or local Postgres) connection string');
if (need.every((k) => e[k]) && !problems) ok('Required variables are set');
if (!e.SECRETS_ENCRYPTION_KEY) warn('SECRETS_ENCRYPTION_KEY not set: Cloudinary/Resend keys will be encrypted with JWT_ACCESS_SECRET instead (set a separate value for production)');
else if (e.SECRETS_ENCRYPTION_KEY.length < 32 || /change-me/i.test(e.SECRETS_ENCRYPTION_KEY)) bad('SECRETS_ENCRYPTION_KEY must be a real random value of 32+ characters');

// Database
if (!problems) {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient();
    await db.$queryRaw`SELECT 1`;
    ok('Database connection works');
    try {
      const users = await db.user.count();
      const pages = await db.page.count();
      users && pages ? ok(`Database is migrated and seeded (${users} user, ${pages} pages)`) : bad('Tables exist but are empty', 'Run: npm run db:seed');
    } catch {
      bad('Database is reachable but has no tables yet', 'Run: npm run db:migrate -- --name init   then   npm run db:seed');
    }
    await db.$disconnect();
  } catch (err) {
    const msg = String(err.message ?? err);
    if (/did not initialize yet|prisma generate/i.test(msg)) bad('Prisma client not generated', 'Run: npm run db:generate');
    else bad(`Cannot connect to the database: ${msg.split('\n').filter(Boolean).pop()}`, 'Check DATABASE_URL (Neon: copy the connection string again; local: is Postgres running?)');
  }
}

// Running services (informational)
for (const [name, url] of [['API', `${e.API_URL ?? 'http://localhost:4000'}/api/health`], ['Website', e.SITE_URL ?? 'http://localhost:3000']]) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(2500) }); r.ok ? ok(`${name} is running (${url})`) : warn(`${name} answered ${r.status} at ${url}`); }
  catch { warn(`${name} is not running yet (${url}); that's fine if you haven't started it`); }
}

console.log(problems ? `\n${problems} problem(s) to fix, see → above.\n` : '\nAll good.\n');
process.exit(problems ? 1 : 0);
