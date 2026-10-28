import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://u:p@localhost:5432/x';
process.env.JWT_ACCESS_SECRET = 'x'.repeat(48);
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.WEB_URL = 'http://localhost:3000';
process.env.REVALIDATE_SECRET = 'y'.repeat(20);

test('encrypt/decrypt round trip, random IV, tamper detection', async () => {
  const { encryptSecret, decryptSecret } = await import('../src/common/crypto');
  const a = encryptSecret('cloudinary-secret'), b = encryptSecret('cloudinary-secret');
  assert.notEqual(a, b);
  assert.equal(decryptSecret(a), 'cloudinary-secret');
  assert.ok(!a.includes('cloudinary'));
  const parts = a.split('.'); parts[3] = Buffer.from('tampered').toString('base64url');
  assert.throws(() => decryptSecret(parts.join('.')));
});

test('TOTP matches RFC 6238 SHA-1 vectors (last 6 digits)', async () => {
  const { base32Encode, totpAt } = await import('../src/common/totp');
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  for (const [t, code] of [[59, '287082'], [1111111109, '081804'], [1234567890, '005924'], [2000000000, '279037']] as const)
    assert.equal(totpAt(secret, t * 1000), code);
});

test('TOTP verify allows ±1 step and rejects replay and garbage', async () => {
  const { base32Encode, totpAt, verifyTotp } = await import('../src/common/totp');
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  const now = 1_700_000_000_000;
  const code = totpAt(secret, now);
  const step = verifyTotp(secret, code, null, now);
  assert.equal(step, Math.floor(now / 30000));
  assert.equal(verifyTotp(secret, code, step, now), null); // replay
  assert.notEqual(verifyTotp(secret, totpAt(secret, now - 30000), null, now), null); // previous step ok
  assert.equal(verifyTotp(secret, totpAt(secret, now - 120000), null, now), null); // too old
  assert.equal(verifyTotp(secret, 'abcdef', null, now), null);
});

test('Cloudinary signature matches the documented example', async () => {
  const { IntegrationsService } = await import('../src/integrations/integrations.service');
  const sig = IntegrationsService.sign({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 }, 'abcd');
  assert.equal(sig, 'bfd09f95f331f558cbd1320e67aa8d488770583e');
});

test('audit redaction hides secrets', async () => {
  const src = await import('node:fs').then((f) => f.readFileSync(new URL('../src/common/security.ts', 'file://' + __filename).pathname, 'utf8'));
  const re = new RegExp(/const SECRET_KEY = \/(.*)\/i;/.exec(src)![1], 'i');
  for (const k of ['apiSecret', 'apiKey', 'password', 'newPassword', 'code', 'recoveryCodes', 'ticket']) assert.ok(re.test(k), k);
  assert.ok(!re.test('cloudName'));
});

test('campaign email design: themes, banner, blocks render safely and the schema rejects unsafe input', async () => {
  const { designSchema } = await import('../src/integrations/email-design');
  const { EmailTemplatesService } = await import('../src/integrations/email-templates.service');
  const db: any = { siteSetting: { findUnique: async () => null } };
  const svc = new (EmailTemplatesService as any)(db, {}, { logo: async () => '' }) as InstanceType<typeof EmailTemplatesService>;
  const design = designSchema.parse({
    theme: 'night', headingAlign: 'center', corners: 'round', banner: { url: 'https://img.example/b.jpg', position: 'afterHeading', alt: { en: '<b>x</b>' } },
    button: { shape: 'pill', align: 'center', fullWidth: true }, footer: { style: 'dark', note: { en: 'Note & more' } },
    blocks: [{ type: 'callout', title: { en: 'Hello {{name}} <script>' }, body: { en: 'Body' }, emoji: '🌳' }, { type: 'features', items: [{ emoji: '🎨', title: { en: 'Art' }, text: { en: 'Paint' } }] }, { type: 'image', url: 'https://img.example/a.png', align: 'end', width: 50 }, { type: 'divider', style: 'leaves' }],
  });
  const content = { subject: { en: 'S', ar: 'S' }, heading: { en: 'Big news', ar: 'x' }, body: { en: 'Hi **there**', ar: 'x' }, buttonLabel: { en: 'Go', ar: 'Go' }, buttonUrl: 'https://example.com/{lang}', celebrate: false, design };
  const r = await svc.renderCampaign(content as any, 'en', { name: 'Sara' }, { unsubscribeUrl: '#u' });
  assert.match(r.html, /#26304a/); // night card
  assert.match(r.html, /border-radius:28px/);
  assert.ok(!/<script/i.test(r.html), 'no raw script tags');
  assert.match(r.html, /Hello Sara &lt;script&gt;/);
  assert.match(r.html, /https:\/\/img\.example\/b\.jpg/);
  assert.match(r.text, /Go: https:\/\/example\.com\/en/);
  if (process.env.EMAIL_PREVIEW_OUT) (await import('node:fs')).writeFileSync(process.env.EMAIL_PREVIEW_OUT, r.html);
  // unsafe input is rejected, not escaped into the page
  assert.throws(() => designSchema.parse({ banner: { url: 'javascript:alert(1)' } }));
  assert.throws(() => designSchema.parse({ pageBg: 'red;background:url(x)' }));
  assert.throws(() => designSchema.parse({ blocks: [{ type: 'image', url: 'http://insecure/x.png' }] }));
  assert.throws(() => designSchema.parse({ blocks: Array.from({ length: 13 }, () => ({ type: 'spacer' })) }));
  // an email without a design looks exactly like before (brand colours)
  const plain = await svc.renderCampaign({ ...content, design: undefined } as any, 'en', { name: 'Sara' }, {});
  assert.match(plain.html, /#f3f4f6/);
});

test('RBAC: every permission used by an endpoint exists, and each built-in role has exactly the rights it should', async () => {
  const fs = await import('node:fs'), path = await import('node:path');
  const { permissions, roles } = await import('../../../packages/db/prisma/content');
  const { AREAS } = await import('../src/auth/rbac');
  const all = new Set(permissions.map(([r, a]) => `${r}:${a}`));
  // 1. every @Secured('x:y') / @SecuredAny(...) in the API refers to a permission that is actually seeded
  const files: string[] = []; const walk = (d: string) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : f.name.endsWith('.ts') && files.push(path.join(d, f.name)); };
  walk(path.join(__dirname, '../src'));
  const used = new Set<string>(); let endpoints = 0, open = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/@Secured(?:Any)?\(([^)]*)\)/g)) for (const p of m[1].matchAll(/'([a-z]+:[a-z]+)'/g)) used.add(p[1]);
    endpoints += (src.match(/@(Get|Post|Put|Delete|Patch)\(/g) ?? []).length;
    open += (src.match(/@(Get|Post|Put|Delete|Patch)\([^)]*\)(?![^\n]*@(Secured|SecuredAny|Public|UseGuards))[^\n]*$/gm) ?? []).length;
  }
  for (const p of used) assert.ok(all.has(p), `endpoint needs unknown permission ${p}`);
  for (const a of AREAS) for (const p of Object.values(a.cells)) assert.ok(all.has(p!), `matrix refers to unknown permission ${p}`);
  const R = Object.fromEntries(roles.map((r) => [r.key, new Set(r.perms === 'ALL' ? [...all] : r.perms)]));
  for (const [k, set] of Object.entries(R)) for (const p of set) assert.ok(all.has(p), `${k} has unknown permission ${p}`);
  // 2. what each role may and may not do
  assert.equal(R.SUPER_ADMIN.size, all.size, 'Super Admin has everything');
  for (const p of ['integration:read', 'integration:update', 'audit:read']) assert.ok(!R.ADMIN.has(p), `Admin must not have ${p}`);
  for (const p of ['page:update', 'page:publish', 'entry:publish', 'user:create', 'user:update', 'campaign:send', 'settings:update', 'theme:update']) assert.ok(R.ADMIN.has(p), `Admin needs ${p}`);
  assert.ok(R.EDITOR.has('page:update') && R.EDITOR.has('entry:create') && R.EDITOR.has('entry:update'));
  for (const p of ['page:publish', 'entry:publish', 'entry:delete', 'user:read', 'campaign:send', 'theme:update', 'settings:update', 'integration:read', 'media:delete']) assert.ok(!R.EDITOR.has(p), `Editor must not have ${p}`);
  for (const p of ['campaign:create', 'campaign:update', 'campaign:delete', 'campaign:send', 'email:update']) assert.ok(R.MARKETING.has(p), `Marketing needs ${p}`);
  for (const p of ['page:update', 'entry:create', 'settings:update', 'user:read', 'integration:read', 'lead:update']) assert.ok(!R.MARKETING.has(p), `Marketing must not have ${p}`);
  for (const p of R.VIEWER) assert.ok(p.endsWith(':read'), `Viewer may only read (${p})`);
  assert.equal(R.TEACHER.size + R.PARENT.size, 0);
  assert.ok(endpoints > 100 && open < 40, `endpoint scan sanity (${endpoints} endpoints, ${open} without a guard on the same line)`);
});
