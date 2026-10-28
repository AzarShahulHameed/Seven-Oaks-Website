import { Body, Controller, Delete, Get, HttpCode, Module, Post, Put, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { AuthedRequest, AuthGuard, ACCESS_COOKIE, REFRESH_COOKIE } from '../common/security';
import { config, isProd } from '../config';
import { AuthService } from './auth.service';
import { UsersController, UsersService, AuditController } from './users.controller';

const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) });
const secondSchema = z.object({ ticket: z.string().min(10).max(2000), code: z.string().min(6).max(20), trust: z.boolean().default(false) });
const TRUST_COOKIE = 'so_td';
const codeSchema = z.object({ code: z.string().min(6).max(20) });
const reauthSchema = z.object({ password: z.string().min(1).max(256), code: z.string().min(6).max(20) });
const changePwSchema = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(1).max(256), code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from the email') });
const emailStartSchema = z.object({ newEmail: z.string().trim().email().max(254), password: z.string().min(1).max(256) });
const sixDigits = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from the email') });
const profileSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, 'Phone may only contain digits, spaces, + ( ) -').nullable().optional(), locale: z.enum(['en', 'ar']).optional() });
const forgotSchema = z.object({ email: z.string().email().max(254) });
const resetSchema = z.object({ token: z.string().min(10).max(2000), password: z.string().min(1).max(256), invite: z.boolean().default(false) });

function setCookies(res: Response, t: { access: string; refresh: string }) {
  const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const };
  res.cookie(ACCESS_COOKIE, t.access, { ...base, path: '/', maxAge: config.ACCESS_TTL_MIN * 60_000 });
  res.cookie(REFRESH_COOKIE, t.refresh, { ...base, path: '/api/auth', maxAge: config.REFRESH_TTL_DAYS * 86_400_000 });
}
const clearCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
};
const ua = (req: AuthedRequest) => req.headers['user-agent'];

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: unknown, @Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const { email, password } = loginSchema.parse(body);
    const r = await this.auth.login(email, password, req.ip, ua(req), req.cookies?.[TRUST_COOKIE]);
    if (r.status === '2fa') return { status: '2fa', ticket: r.ticket, canTrust: config.TRUSTED_DEVICE_DAYS > 0, trustDays: config.TRUSTED_DEVICE_DAYS };
    setCookies(res, r);
    // A trusted browser stays trusted while it is used: renew the window on every sign-in so people are not asked for a code again every month.
    if (req.cookies?.[TRUST_COOKIE]) { const tok = await this.auth.trustToken(r.userId); if (tok) res.cookie(TRUST_COOKIE, tok, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/api/auth', maxAge: config.TRUSTED_DEVICE_DAYS * 86_400_000 }); }
    return { status: 'ok' };
  }

  @Post('login/2fa') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login2fa(@Body() body: unknown, @Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const { ticket, code, trust } = secondSchema.parse(body);
    const t = await this.auth.verifySecondFactor(ticket, code, req.ip, ua(req));
    setCookies(res, t);
    if (trust) { const tok = await this.auth.trustToken(t.userId); if (tok) res.cookie(TRUST_COOKIE, tok, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/api/auth', maxAge: config.TRUSTED_DEVICE_DAYS * 86_400_000 }); }
    return { status: 'ok' };
  }

  @Post('refresh') @HttpCode(200) @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException();
    setCookies(res, await this.auth.refresh(token, req.ip, ua(req)));
    return { ok: true };
  }

  @Post('logout') @HttpCode(200)
  async logout(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    clearCookies(res);
    return { ok: true };
  }

  @Post('logout-all') @HttpCode(200) @UseGuards(AuthGuard)
  async logoutAll(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.revokeAll(req.user!.sub);
    clearCookies(res);
    return { ok: true };
  }

  @Get('me') @UseGuards(AuthGuard)
  async me(@Req() req: AuthedRequest) {
    return { ...(await this.auth.me(req.user!.sub)), roles: req.user!.roles, perms: req.user!.perms };
  }

  @Put('me') @UseGuards(AuthGuard)
  updateMe(@Body() body: unknown, @Req() req: AuthedRequest) { return this.auth.updateProfile(req.user!.sub, profileSchema.parse(body)); }

  @Put('me/avatar') @UseGuards(AuthGuard) @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  setAvatar(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: AuthedRequest) { return this.auth.setAvatar(req.user!.sub, file); }

  @Delete('me/avatar') @UseGuards(AuthGuard)
  removeAvatar(@Req() req: AuthedRequest) { return this.auth.removeAvatar(req.user!.sub); }

  @Post('password') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(@Body() body: unknown, @Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const d = changePwSchema.parse(body);
    setCookies(res, await this.auth.changePassword(req.user!.sub, d.currentPassword, d.newPassword, d.code, req.ip, ua(req)));
    return { ok: true };
  }

  @Post('password/code') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 3, ttl: 60_000 } })
  passwordCode(@Req() req: AuthedRequest) { return this.auth.startPasswordChange(req.user!.sub); }

  @Post('email/start') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 3, ttl: 60_000 } })
  emailStart(@Body() body: unknown, @Req() req: AuthedRequest) { const d = emailStartSchema.parse(body); return this.auth.startEmailChange(req.user!.sub, d.newEmail, d.password); }

  @Post('email/verify-current') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 8, ttl: 60_000 } })
  emailVerifyCurrent(@Body() body: unknown, @Req() req: AuthedRequest) { return this.auth.verifyCurrentEmail(req.user!.sub, sixDigits.parse(body).code); }

  @Post('email/confirm') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async emailConfirm(@Body() body: unknown, @Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    setCookies(res, await this.auth.confirmEmailChange(req.user!.sub, sixDigits.parse(body).code, req.ip, ua(req)));
    return { ok: true };
  }

  @Post('forgot') @HttpCode(200) @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgot(@Body() body: unknown) {
    await this.auth.forgot(forgotSchema.parse(body).email);
    return { ok: true };
  }

  @Post('reset') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reset(@Body() body: unknown) {
    const d = resetSchema.parse(body);
    return this.auth.resetWithToken(d.invite ? 'invite' : 'reset', d.token, d.password);
  }

  // two-factor
  @Post('2fa/setup') @HttpCode(200) @UseGuards(AuthGuard)
  setup(@Req() req: AuthedRequest) { return this.auth.twoFactorSetup(req.user!.sub); }

  @Post('2fa/enable') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 10, ttl: 60_000 } })
  enable(@Body() body: unknown, @Req() req: AuthedRequest) { return this.auth.twoFactorEnable(req.user!.sub, codeSchema.parse(body).code); }

  @Post('2fa/disable') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  disable(@Body() body: unknown, @Req() req: AuthedRequest) { const d = reauthSchema.parse(body); return this.auth.twoFactorDisable(req.user!.sub, d.password, d.code); }

  @Post('2fa/recovery') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  recovery(@Body() body: unknown, @Req() req: AuthedRequest) { const d = reauthSchema.parse(body); return this.auth.regenerateRecovery(req.user!.sub, d.password, d.code); }
}

@Module({ controllers: [AuthController, UsersController, AuditController], providers: [AuthService, UsersService] })
export class AuthModule {}
