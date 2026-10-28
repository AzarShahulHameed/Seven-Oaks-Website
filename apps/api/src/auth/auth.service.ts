import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import QRCode from 'qrcode';
import { PrismaService } from '../common/common.module';
import { decryptSecret, encryptSecret, sha256hex } from '../common/crypto';
import { newSecret, otpauthUri, verifyTotp } from '../common/totp';
import { config } from '../config';
import sharp from 'sharp';
import { IntegrationsService } from '../integrations/integrations.service';
import { MailService } from '../integrations/mail.service';
import { EmailTemplatesService } from '../integrations/email-templates.service';
import { NotificationsService } from '../common/notifications.service';

const include = { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } as const;
let dummyHash: string | undefined;
const ISSUER = 'Seven Oaks Admin';

type Purpose = '2fa' | 'reset' | 'invite' | 'td';
export type LoginResult = { status: 'ok'; access: string; refresh: string; userId: string } | { status: '2fa'; ticket: string };

@Injectable()
export class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService, private mail: MailService, private integ: IntegrationsService, private tpl: EmailTemplatesService, private notes: NotificationsService) {}

  // ───────── short-lived signed tokens (2FA ticket, password reset, invite) ─────────
  private secretFor(p: Purpose) { return sha256hex(`${config.JWT_ACCESS_SECRET}:${p}`); }
  /** `fp` ties reset/invite tokens to the current password hash, so they stop working once the password changes (single use). */
  private fingerprint(passwordHash: string) { return sha256hex(passwordHash).slice(0, 20); }
  signToken(p: Purpose, user: { id: string; passwordHash: string }, ttl: string) {
    return this.jwt.signAsync({ sub: user.id, p, fp: p === '2fa' ? undefined : this.fingerprint(user.passwordHash) }, { secret: this.secretFor(p), expiresIn: ttl });
  }
  /** "Trust this browser": a signed token that is only valid while the password and authenticator setup are unchanged. */
  private tdFp(u: { passwordHash: string; totpSecretEnc: string | null }) { return sha256hex(`${u.passwordHash}|${u.totpSecretEnc ?? ''}`).slice(0, 24); }
  async trustToken(userId: string) {
    if (!config.TRUSTED_DEVICE_DAYS) return null;
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true, totpSecretEnc: true } });
    if (!u) return null;
    return this.jwt.signAsync({ sub: u.id, p: 'td', fp: this.tdFp(u) }, { secret: this.secretFor('td'), expiresIn: `${config.TRUSTED_DEVICE_DAYS}d` });
  }
  private async isTrusted(user: { id: string; passwordHash: string; totpSecretEnc: string | null }, token?: string) {
    if (!token || !config.TRUSTED_DEVICE_DAYS) return false;
    try { const d = await this.jwt.verifyAsync<{ sub: string; p: string; fp: string }>(token, { secret: this.secretFor('td') }); return d.p === 'td' && d.sub === user.id && d.fp === this.tdFp(user); } catch { return false; }
  }
  private async readToken(p: Purpose, token: string) {
    try {
      const d = await this.jwt.verifyAsync<{ sub: string; p: string; fp?: string }>(token, { secret: this.secretFor(p) });
      if (d.p !== p) throw new Error();
      return d;
    } catch {
      throw new UnauthorizedException(p === '2fa' ? 'Sign-in session expired. Start again.' : 'This link is invalid or has expired.');
    }
  }

  // ───────── login ─────────
  async login(email: string, password: string, ip?: string, ua?: string, trusted?: string): Promise<LoginResult> {
    const user = await this.db.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null }, include });
    const log = (success: boolean) => this.db.loginHistory.create({ data: { userId: user?.id, email, success, ip, userAgent: ua } });

    if (!user || !user.isActive || (user.lockedUntil && user.lockedUntil > new Date())) {
      dummyHash ??= await argon2.hash('timing-equaliser'); // keep response time similar for unknown users
      await argon2.verify(dummyHash, password).catch(() => false);
      await log(false);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!(await argon2.verify(user.passwordHash, password).catch(() => false))) {
      await this.registerFailure(user.id, user.failedLogins);
      await log(false);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.totpEnabled && user.totpSecretEnc && !(await this.isTrusted(user as any, trusted))) {
      // password is right; do not count as a completed login until the second step passes
      return { status: '2fa', ticket: await this.signToken('2fa', user, '5m') };
    }
    await this.db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    await log(true);
    await this.recordLogin(user, ip, ua);
    return { status: 'ok', ...(await this.issue(user, ip, ua)) };
  }

  private async registerFailure(userId: string, current: number) {
    const failed = current + 1;
    const lock = failed >= config.MAX_FAILED_LOGINS;
    await this.db.user.update({ where: { id: userId }, data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + config.LOCKOUT_MIN * 60_000) : null } });
    if (lock) {
      const u = await this.db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      void this.notes.notify({ type: 'security', severity: 'error', title: `Account locked: ${u?.name ?? 'a user'}`, body: `Too many wrong passwords for ${u?.email ?? ''}. It unlocks automatically in ${config.LOCKOUT_MIN} minutes.`, link: '/admin/audit' });
    }
  }

  private async recordLogin(user: { id: string; name: string }, ip?: string, ua?: string) {
    await this.db.auditLog.create({ data: { actorId: user.id, action: 'login', entity: 'auth', ip, userAgent: ua, diff: { label: 'Signed in' } } }).catch(() => undefined);
    void this.notes.notify({ type: 'login', severity: 'info', title: `${user.name} signed in`, body: ip ? `From ${ip}` : undefined, link: '/admin/audit' });
  }

  /** Second step: a 6-digit authenticator code, or one of the one-time recovery codes. */
  async verifySecondFactor(ticket: string, code: string, ip?: string, ua?: string) {
    const t = await this.readToken('2fa', ticket);
    const user = await this.db.user.findFirst({ where: { id: t.sub, deletedAt: null, isActive: true }, include });
    if (!user || !user.totpEnabled || !user.totpSecretEnc || (user.lockedUntil && user.lockedUntil > new Date())) throw new UnauthorizedException('Invalid code');
    const clean = code.replace(/[\s-]/g, '');
    let ok = false;
    if (/^\d{6}$/.test(clean)) {
      const step = verifyTotp(decryptSecret(user.totpSecretEnc), clean, user.totpLastStep);
      if (step !== null) {
        ok = true;
        await this.db.user.update({ where: { id: user.id }, data: { totpLastStep: step } }); // replay protection
      }
    } else {
      const hashes = (user.recoveryCodes as string[] | null) ?? [];
      const h = sha256hex(clean.toLowerCase());
      if (hashes.includes(h)) {
        ok = true;
        await this.db.user.update({ where: { id: user.id }, data: { recoveryCodes: hashes.filter((x) => x !== h) } });
      }
    }
    if (!ok) {
      await this.registerFailure(user.id, user.failedLogins);
      await this.db.loginHistory.create({ data: { userId: user.id, email: user.email, success: false, ip, userAgent: ua } });
      throw new UnauthorizedException('Invalid code');
    }
    await this.db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    await this.db.loginHistory.create({ data: { userId: user.id, email: user.email, success: true, ip, userAgent: ua } });
    await this.recordLogin(user, ip, ua);
    return this.issue(user, ip, ua);
  }

  /** Rotating refresh tokens; presenting an already-used token revokes every session of that user. */
  async refresh(token: string, ip?: string, ua?: string) {
    const s = await this.db.session.findUnique({ where: { refreshHash: sha256hex(token) } });
    if (!s) throw new UnauthorizedException();
    if (s.revokedAt || s.expiresAt < new Date()) {
      // Two browser requests can present the same token a moment apart (one just rotated it). That is not theft: refuse quietly.
      if (s.revokedAt && Date.now() - s.revokedAt.getTime() < 30_000) throw new UnauthorizedException();
      if (s.revokedAt) await this.db.session.updateMany({ where: { userId: s.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException();
    }
    await this.db.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
    const user = await this.db.user.findFirst({ where: { id: s.userId, isActive: true, deletedAt: null }, include });
    if (!user) throw new UnauthorizedException();
    return this.issue(user, ip, ua);
  }

  async logout(token?: string) {
    if (token) {
      const sess = await this.db.session.findUnique({ where: { refreshHash: sha256hex(token) } });
      if (sess && !sess.revokedAt) await this.db.auditLog.create({ data: { actorId: sess.userId, action: 'logout', entity: 'auth', diff: { label: 'Signed out' } } }).catch(() => undefined);
    }
    if (token) await this.db.session.updateMany({ where: { refreshHash: sha256hex(token), revokedAt: null }, data: { revokedAt: new Date() } });
  }
  revokeAll(userId: string) {
    return this.db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(id: string) {
    const u = await this.db.user.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true, locale: true, totpEnabled: true, recoveryCodes: true } });
    if (!u) throw new UnauthorizedException();
    const { recoveryCodes, ...rest } = u;
    return { ...rest, recoveryCodesLeft: ((recoveryCodes as string[] | null) ?? []).length };
  }

  // ───────── profile ─────────
  async updateProfile(id: string, d: { name?: string; phone?: string | null; locale?: 'en' | 'ar' }) {
    await this.db.user.update({ where: { id }, data: { ...(d.name ? { name: d.name } : {}), ...(d.phone !== undefined ? { phone: d.phone || null } : {}), ...(d.locale ? { locale: d.locale } : {}) } });
    return this.me(id);
  }

  /** Re-encodes the (already cropped) picture to a 512px square WebP, drops all metadata, stores it in Cloudinary. */
  async setAvatar(id: string, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('No picture received');
    const c = await this.integ.cloudinary(); // clear message if Cloudinary is not connected
    let info;
    try { info = await sharp(file.buffer, { limitInputPixels: 40_000_000 }).metadata(); } catch { throw new BadRequestException('That file is not a valid picture'); }
    if (!info.format || !['jpeg', 'png', 'webp', 'gif', 'avif'].includes(info.format)) throw new BadRequestException('Use a JPEG, PNG or WebP picture');
    const out = await sharp(file.buffer, { limitInputPixels: 40_000_000 }).rotate().resize(512, 512, { fit: 'cover' }).webp({ quality: 88 }).toBuffer();
    const up = await this.integ.cloudinaryUpload(out, `av-${id.slice(-8)}-${randomBytes(6).toString('hex')}`, `${c.folder}/avatars`);
    const old = (await this.db.user.findUnique({ where: { id }, select: { avatarUrl: true } }))?.avatarUrl;
    const url = `https://res.cloudinary.com/${up.cloudName}/image/upload/f_auto,q_auto,w_256,h_256,c_fill/${up.publicId}`;
    await this.db.user.update({ where: { id }, data: { avatarUrl: url } });
    await this.dropAvatarFile(old);
    return this.me(id);
  }

  async removeAvatar(id: string) {
    const old = (await this.db.user.findUnique({ where: { id }, select: { avatarUrl: true } }))?.avatarUrl;
    await this.db.user.update({ where: { id }, data: { avatarUrl: null } });
    await this.dropAvatarFile(old);
    return this.me(id);
  }

  private async dropAvatarFile(url?: string | null) {
    const m = url?.match(/\/image\/upload\/[^/]+\/(.+)$/);
    if (m) await this.integ.cloudinaryDestroy(m[1]).catch(() => undefined);
  }

  // ───────── password ─────────
  private checkNewPassword(pw: string) {
    if (pw.length < 12) throw new BadRequestException('Password must be at least 12 characters');
    if (pw.length > 128) throw new BadRequestException('Password is too long');
  }
  private async mustVerifyPassword(userId: string, password: string) {
    const u = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u || !(await argon2.verify(u.passwordHash, password).catch(() => false))) throw new BadRequestException('Current password is incorrect');
    return u;
  }

  // ───────── one-time codes (email change, password change) ─────────
  private codeHash(userId: string, purpose: string, code: string) { return sha256hex(`${userId}:${purpose}:${code}`); }
  private async makeCode(userId: string, purpose: string, payload?: Record<string, string>) {
    await this.db.verificationCode.deleteMany({ where: { userId, purpose, usedAt: null } });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.db.verificationCode.create({ data: { userId, purpose, codeHash: this.codeHash(userId, purpose, code), payload: payload ?? undefined, expiresAt: new Date(Date.now() + 10 * 60_000) } });
    return code;
  }
  private async checkCode(userId: string, purpose: string, code: string) {
    const row = await this.db.verificationCode.findFirst({ where: { userId, purpose, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!row) throw new BadRequestException('That code has expired. Ask for a new one.');
    if (row.attempts >= 5) throw new BadRequestException('Too many wrong attempts. Ask for a new code.');
    if (row.codeHash !== this.codeHash(userId, purpose, code.replace(/\s/g, ''))) {
      await this.db.verificationCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('That code is not correct.');
    }
    await this.db.verificationCode.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    return row;
  }
  private async sendCode(user: { id: string; name: string; locale: string }, to: string, code: string, purpose: string) {
    try { await this.tpl.sendOrThrow('verification', to, { name: user.name, code, minutes: '10', purpose }, user.locale === 'ar' ? 'ar' : 'en'); }
    catch { throw new BadRequestException('The verification email could not be sent. Check that email (Resend) is set up in Admin → Integrations.'); }
  }
  private async person(userId: string) {
    const u = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u) throw new UnauthorizedException();
    return u;
  }
  private async securityEvent(user: { id: string; name: string }, label: string, ip?: string, ua?: string) {
    await this.db.auditLog.create({ data: { actorId: user.id, action: 'security', entity: 'auth/me', ip, userAgent: ua, diff: { label } } }).catch(() => undefined);
    void this.notes.notify({ type: 'security', severity: 'warning', title: `${user.name}: ${label}`, link: '/admin/audit' });
  }

  /** Step 1 of a password change: email a 6-digit code to the signed-in person. */
  async startPasswordChange(userId: string) {
    const u = await this.person(userId);
    await this.sendCode(u, u.email, await this.makeCode(userId, 'password'), 'change your password');
    return { sentTo: u.email.replace(/^(.).*(@.*)$/, '$1•••$2') };
  }
  async changePassword(userId: string, current: string, next: string, code: string, ip?: string, ua?: string) {
    this.checkNewPassword(next);
    const u = await this.mustVerifyPassword(userId, current);
    await this.checkCode(userId, 'password', code);
    await this.db.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(next, { type: argon2.argon2id }) } });
    await this.revokeAll(userId); // signs out every other device
    await this.securityEvent(u, 'changed their password', ip, ua);
    const fresh = await this.db.user.findFirst({ where: { id: u.id }, include });
    return this.issue(fresh, ip, ua);
  }

  // ───────── email change: code to the current address, then code to the new one ─────────
  async startEmailChange(userId: string, newEmailRaw: string, password: string) {
    const u = await this.mustVerifyPassword(userId, password);
    const newEmail = newEmailRaw.trim().toLowerCase();
    if (newEmail === u.email) throw new BadRequestException('That is already your email address.');
    if (await this.db.user.findFirst({ where: { email: newEmail } })) throw new BadRequestException('That email address is already used by another account.');
    await this.sendCode(u, u.email, await this.makeCode(userId, 'email-old', { newEmail }), 'confirm you want to change your email address');
    return { sentTo: u.email.replace(/^(.).*(@.*)$/, '$1•••$2') };
  }
  async verifyCurrentEmail(userId: string, code: string) {
    const u = await this.person(userId);
    const row = await this.checkCode(userId, 'email-old', code);
    const newEmail = String((row.payload as any)?.newEmail ?? '');
    if (!newEmail) throw new BadRequestException('Start the email change again.');
    await this.sendCode(u, newEmail, await this.makeCode(userId, 'email-new', { newEmail }), 'confirm this new email address');
    return { sentTo: newEmail.replace(/^(.).*(@.*)$/, '$1•••$2') };
  }
  async confirmEmailChange(userId: string, code: string, ip?: string, ua?: string) {
    const u = await this.person(userId);
    // the first step must have been completed in the last 30 minutes
    const first = await this.db.verificationCode.findFirst({ where: { userId, purpose: 'email-old', usedAt: { gt: new Date(Date.now() - 30 * 60_000) } }, orderBy: { usedAt: 'desc' } });
    if (!first) throw new BadRequestException('Confirm the code sent to your current email first.');
    const row = await this.checkCode(userId, 'email-new', code);
    const newEmail = String((row.payload as any)?.newEmail ?? '');
    if (!newEmail || newEmail !== String((first.payload as any)?.newEmail)) throw new BadRequestException('Start the email change again.');
    if (await this.db.user.findFirst({ where: { email: newEmail, NOT: { id: userId } } })) throw new BadRequestException('That email address is already used by another account.');
    const oldEmail = u.email;
    await this.db.user.update({ where: { id: userId }, data: { email: newEmail } });
    await this.db.verificationCode.deleteMany({ where: { userId } });
    await this.revokeAll(userId);
    await this.securityEvent(u, `changed their email from ${oldEmail} to ${newEmail}`, ip, ua);
    await this.mail.trySend({ to: oldEmail, subject: 'Your admin email address was changed', ...MailService.layout('Your email address was changed', `The sign-in email for your Seven Oaks admin account was changed to ${newEmail}. If this was not you, contact another administrator immediately.`) });
    const fresh = await this.db.user.findFirst({ where: { id: userId }, include });
    return this.issue(fresh, ip, ua);
  }

  /** Always answers the same, so the form cannot be used to discover which emails have accounts. */
  async forgot(email: string) {
    const user = await this.db.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null, isActive: true } });
    if (!user) return;
    const url = `${config.WEB_URL.replace(/\/$/, '')}/admin/reset?token=${encodeURIComponent(await this.signToken('reset', user, '1h'))}`;
    await this.tpl.send('password-reset', user.email, { name: user.name, link: url }, (user.locale === 'ar' ? 'ar' : 'en'));
  }

  /** Used for both password reset and accepting an invitation. Sessions are revoked; 2FA stays as it was. */
  async resetWithToken(purpose: 'reset' | 'invite', token: string, password: string) {
    this.checkNewPassword(password);
    const t = await this.readToken(purpose, token);
    const user = await this.db.user.findFirst({ where: { id: t.sub, deletedAt: null } });
    if (!user || this.fingerprint(user.passwordHash) !== t.fp) throw new UnauthorizedException('This link is invalid or has expired.');
    await this.db.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }), failedLogins: 0, lockedUntil: null, isActive: true } });
    await this.revokeAll(user.id);
    return { ok: true };
  }

  async inviteUrl(user: { id: string; passwordHash: string }) {
    return `${config.WEB_URL.replace(/\/$/, '')}/admin/reset?invite=1&token=${encodeURIComponent(await this.signToken('invite', user, '72h'))}`;
  }

  // ───────── two-factor ─────────
  /** Step 1: create a pending secret (not active until a valid code is entered). */
  async twoFactorSetup(userId: string) {
    const u = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u) throw new UnauthorizedException();
    if (u.totpEnabled) throw new BadRequestException('Two-factor authentication is already on');
    const secret = newSecret();
    await this.db.user.update({ where: { id: userId }, data: { totpSecretEnc: encryptSecret(secret), totpLastStep: null } });
    const uri = otpauthUri(secret, u.email, ISSUER);
    return { secret, otpauth: uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
  }

  private newRecoveryCodes() {
    const plain = Array.from({ length: 10 }, () => { const h = randomBytes(5).toString('hex'); return `${h.slice(0, 5)}-${h.slice(5)}`; });
    return { plain, hashed: plain.map((c) => sha256hex(c.replace('-', '').toLowerCase())) };
  }

  /** Step 2: confirm with a code from the app. Returns the recovery codes ONCE. */
  async twoFactorEnable(userId: string, code: string) {
    const u = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u?.totpSecretEnc) throw new BadRequestException('Start setup first');
    if (u.totpEnabled) throw new BadRequestException('Two-factor authentication is already on');
    const step = verifyTotp(decryptSecret(u.totpSecretEnc), code.replace(/\s/g, ''));
    if (step === null) throw new BadRequestException('That code is not correct. Check your phone clock and try again.');
    const rc = this.newRecoveryCodes();
    await this.db.user.update({ where: { id: userId }, data: { totpEnabled: true, totpLastStep: step, recoveryCodes: rc.hashed } });
    return { recoveryCodes: rc.plain };
  }

  /** Re-auth for sensitive 2FA changes: password plus a current code (or recovery code). */
  private async reauth(userId: string, password: string, code: string) {
    const u = await this.mustVerifyPassword(userId, password);
    if (!u.totpEnabled || !u.totpSecretEnc) throw new BadRequestException('Two-factor authentication is not on');
    const clean = code.replace(/[\s-]/g, '');
    const okTotp = /^\d{6}$/.test(clean) && verifyTotp(decryptSecret(u.totpSecretEnc), clean, u.totpLastStep) !== null;
    const okRecovery = !okTotp && ((u.recoveryCodes as string[] | null) ?? []).includes(sha256hex(clean.toLowerCase()));
    if (!okTotp && !okRecovery) throw new BadRequestException('The code is not correct');
  }

  async twoFactorDisable(userId: string, password: string, code: string) {
    await this.reauth(userId, password, code);
    await this.db.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecretEnc: null, totpLastStep: null, recoveryCodes: Prisma.DbNull } });
    return { ok: true };
  }

  async regenerateRecovery(userId: string, password: string, code: string) {
    await this.reauth(userId, password, code);
    const rc = this.newRecoveryCodes();
    await this.db.user.update({ where: { id: userId }, data: { recoveryCodes: rc.hashed } });
    return { recoveryCodes: rc.plain };
  }

  // ───────── session issuing ─────────
  private async issue(user: any, ip?: string, ua?: string) {
    const perms = new Set<string>();
    const roles: string[] = [];
    for (const ur of user.roles) {
      roles.push(ur.role.key);
      for (const rp of ur.role.permissions) perms.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
    const access = await this.jwt.signAsync({ sub: user.id, roles, perms: [...perms] }, { secret: config.JWT_ACCESS_SECRET, expiresIn: `${config.ACCESS_TTL_MIN}m` });
    const refresh = randomBytes(48).toString('base64url');
    await this.db.session.create({
      data: { userId: user.id, refreshHash: sha256hex(refresh), ip, userAgent: ua, expiresAt: new Date(Date.now() + config.REFRESH_TTL_DAYS * 86_400_000) },
    });
    return { access, refresh, userId: user.id as string };
  }
}
