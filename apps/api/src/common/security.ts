import {
  applyDecorators, CallHandler, CanActivate, Catch, ExceptionFilter, ExecutionContext, ForbiddenException,
  Injectable, NestInterceptor, SetMetadata, UnauthorizedException, UseGuards, ArgumentsHost, HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { tap } from 'rxjs';
import { ZodError } from 'zod';
import { allowedOrigins, config } from '../config';
import { PrismaService } from './common.module';
import { auditStore, diffJson } from './audit-context';

export const ACCESS_COOKIE = 'so_at';
export const REFRESH_COOKIE = 'so_rt';
export interface JwtUser { sub: string; roles: string[]; perms: string[] }
export type AuthedRequest = Request & { user?: JwtUser };

/** Cookie-authenticated, state-changing requests must come from an allow-listed Origin (CSRF defence). */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    if (/\/public\/(collect|usage\/map|unsubscribe)$/.test(req.path)) return true; // anonymous or signed-link requests with no login cookie: nothing to forge
    const origin = (req.headers.origin ?? '').replace(/\/$/, '');
    if (origin && allowedOrigins.has(origin)) return true;
    throw new ForbiddenException('Origin not allowed');
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) throw new UnauthorizedException();
    try {
      req.user = await this.jwt.verifyAsync<JwtUser>(token, { secret: config.JWT_ACCESS_SECRET });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

const PERM_KEY = 'perms';
const ANY_KEY = 'perms-any';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const need = this.reflector.get<string[]>(PERM_KEY, ctx.getHandler()) ?? [];
    const any = this.reflector.get<string[]>(ANY_KEY, ctx.getHandler()) ?? [];
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new UnauthorizedException();
    if (user.roles.includes('SUPER_ADMIN') || (need.every((p) => user.perms.includes(p)) && (any.length === 0 || any.some((p) => user.perms.includes(p))))) return true;
    throw new ForbiddenException('Insufficient permissions');
  }
}

/** Allows the request when the user has AT LEAST ONE of the permissions, e.g. @SecuredAny('page:update', 'email:update'). */
export const SecuredAny = (...perms: string[]) =>
  applyDecorators(SetMetadata(PERM_KEY, []), SetMetadata(ANY_KEY, perms), UseGuards(AuthGuard, PermissionsGuard));

/** Server-side RBAC on every admin endpoint: @Secured('page:update') */
export const Secured = (...perms: string[]) =>
  applyDecorators(SetMetadata(PERM_KEY, perms), UseGuards(AuthGuard, PermissionsGuard));

const SECRET_KEY = /pass|token|secret|hash|code|api_?key|ticket|signature|totp/i;
const redact = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(redact)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_KEY.test(k) ? '[redacted]' : redact(x)]))
  : v;

const VERB: [RegExp, string][] = [[/publish$/, 'publish'], [/restore\//, 'restore'], [/translate/, 'translate'], [/media$|avatar$/, 'upload'], [/export/, 'download'], [/reset-2fa|2fa/, 'security'], [/logout/, 'logout']];
const verbFor = (method: string, path: string) => {
  for (const [re, v] of VERB) if (re.test(path)) return method === 'DELETE' && v === 'upload' ? 'delete' : v;
  return method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';
};

/** Writes an audit log entry for every successful admin mutation, with before/after values when the service supplied them. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private db: PrismaService) {}
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (req.method === 'GET' || !req.user) return next.handle();
    return next.handle().pipe(
      tap(() => {
        const st = auditStore.getStore() ?? {};
        if (st.refresh && !st.refresh.ok) { try { ctx.switchToHttp().getResponse<Response>().setHeader('x-site-refresh', encodeURIComponent(st.refresh.reason ?? 'failed')); } catch { /* headers already sent */ } }
        if (st.skip) return;
        const body = JSON.stringify(redact(req.body ?? {}));
        const path = req.path.replace(/^\/api\//, '');
        const changes = st.before !== undefined || st.after !== undefined ? diffJson(st.before, st.after) : undefined;
        this.db.auditLog
          .create({
            data: {
              actorId: req.user!.sub, action: st.action ?? verbFor(req.method, path), entity: st.entity ?? path.split('/').slice(0, 2).join('/'),
              entityId: st.entityId ?? (req.params as any)?.key ?? (req.params as any)?.location ?? (req.params as any)?.id ?? null,
              diff: (changes ? { label: st.label ?? null, changes } : { label: st.label ?? null, body: body.length < 20000 ? JSON.parse(body) : { note: 'payload too large to store' } }) as any,
              ip: req.ip, userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}

@Catch(ZodError)
export class ZodFilter implements ExceptionFilter {
  catch(e: ZodError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.BAD_REQUEST).json({
      statusCode: 400, message: 'Validation failed', issues: e.issues.map((x) => ({ path: x.path.join('.'), message: x.message })),
    });
  }
}
