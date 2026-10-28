import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../common/common.module';
import { AuthedRequest, Secured } from '../common/security';
import { EmailTemplatesService } from '../integrations/email-templates.service';
import { AuthService } from './auth.service';
import { AREAS, BRIEFS, COLUMNS } from './rbac';

const createSchema = z.object({ email: z.string().trim().email().max(254), name: z.string().trim().min(1).max(100), roleKey: z.string().regex(/^[A-Z_]{2,30}$/) });
const updateSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), roleKey: z.string().regex(/^[A-Z_]{2,30}$/).optional(), isActive: z.boolean().optional() });
const idSchema = z.string().min(5).max(40).regex(/^[a-z0-9]+$/i);

@Injectable()
export class UsersService {
  constructor(private db: PrismaService, private auth: AuthService, private tpl: EmailTemplatesService) {}

  private present(u: any) {
    return {
      id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl ?? null, isActive: u.isActive, totpEnabled: u.totpEnabled, createdAt: u.createdAt,
      roles: u.roles.map((r: any) => r.role.key), lockedUntil: u.lockedUntil,
    };
  }
  private isSuper = (actor: { roles: string[] }) => actor.roles.includes('SUPER_ADMIN');

  async list() {
    const rows = await this.db.user.findMany({ where: { deletedAt: null }, include: { roles: { include: { role: true } } }, orderBy: { createdAt: 'asc' } });
    const last = await this.db.loginHistory.groupBy({ by: ['userId'], where: { success: true }, _max: { createdAt: true } });
    const lm = new Map(last.map((l) => [l.userId, l._max.createdAt]));
    return rows.map((u) => ({ ...this.present(u), lastLogin: lm.get(u.id) ?? null }));
  }

  /** What every role can do, read from the database so the screen shows exactly what the server enforces. */
  async matrix() {
    const rows = await this.db.role.findMany({ orderBy: { key: 'asc' }, include: { permissions: { include: { permission: true } } } });
    const order = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MARKETING', 'ADMISSIONS', 'VIEWER', 'TEACHER', 'PARENT'];
    const roles = rows
      .sort((a, b) => (order.indexOf(a.key) + 99) % 99 - (order.indexOf(b.key) + 99) % 99)
      .map((r) => ({ key: r.key, name: r.name, all: r.key === 'SUPER_ADMIN', perms: r.permissions.map((p) => `${p.permission.resource}:${p.permission.action}`), brief: BRIEFS[r.key] ?? null }));
    return { columns: COLUMNS, areas: AREAS, roles };
  }

  async roles(actor: { roles: string[] }) {
    const rows = await this.db.role.findMany({ orderBy: { key: 'asc' } });
    return rows.filter((r) => r.key !== 'SUPER_ADMIN' || this.isSuper(actor)).map((r) => ({ key: r.key, name: r.name }));
  }

  private async role(key: string, actor: { roles: string[] }) {
    if (key === 'SUPER_ADMIN' && !this.isSuper(actor)) throw new ForbiddenException('Only a Super Admin can grant the Super Admin role');
    const r = await this.db.role.findUnique({ where: { key } });
    if (!r) throw new BadRequestException('Unknown role');
    return r;
  }

  private async target(id: string, actor: { sub: string; roles: string[] }) {
    const u = await this.db.user.findFirst({ where: { id, deletedAt: null }, include: { roles: { include: { role: true } } } });
    if (!u) throw new NotFoundException();
    if (u.roles.some((r) => r.role.key === 'SUPER_ADMIN') && !this.isSuper(actor)) throw new ForbiddenException('Only a Super Admin can change a Super Admin');
    return u;
  }

  private async assertAnotherSuper(exceptId: string) {
    const n = await this.db.user.count({ where: { id: { not: exceptId }, isActive: true, deletedAt: null, roles: { some: { role: { key: 'SUPER_ADMIN' } } } } });
    if (n < 1) throw new BadRequestException('There must always be at least one active Super Admin');
  }

  /** Creates the account with an unusable random password and emails an invite link (valid 72h). */
  async invite(d: z.infer<typeof createSchema>, actor: { sub: string; roles: string[] }) {
    const role = await this.role(d.roleKey, actor);
    const email = d.email.toLowerCase();
    if (await this.db.user.findFirst({ where: { email } })) throw new BadRequestException('A user with this email already exists');
    const user = await this.db.user.create({
      data: { email, name: d.name, passwordHash: await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id }), roles: { create: { roleId: role.id } } },
    });
    const url = await this.auth.inviteUrl(user);
    const emailed = await this.tpl.send('welcome', email, { name: d.name, link: url }, 'en');
    // When email is not configured the link is shown once to the inviting admin so they can send it themselves.
    return { id: user.id, emailed, ...(emailed ? {} : { inviteUrl: url }) };
  }

  async update(id: string, d: z.infer<typeof updateSchema>, actor: { sub: string; roles: string[] }) {
    const u = await this.target(id, actor);
    const wasSuper = u.roles.some((r) => r.role.key === 'SUPER_ADMIN');
    if (id === actor.sub && (d.isActive === false || (d.roleKey && d.roleKey !== u.roles[0]?.role.key))) throw new BadRequestException('You cannot change your own role or deactivate yourself');
    if (wasSuper && (d.isActive === false || (d.roleKey && d.roleKey !== 'SUPER_ADMIN'))) await this.assertAnotherSuper(id);
    const role = d.roleKey ? await this.role(d.roleKey, actor) : null;
    await this.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { ...(d.name ? { name: d.name } : {}), ...(d.isActive !== undefined ? { isActive: d.isActive } : {}) } });
      if (role) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: role.id } });
      }
    });
    if (d.isActive === false || role) await this.auth.revokeAll(id); // forces a fresh login with the new permissions
    return { ok: true };
  }

  async reset2fa(id: string, actor: { sub: string; roles: string[] }) {
    await this.target(id, actor);
    await this.db.user.update({ where: { id }, data: { totpEnabled: false, totpSecretEnc: null, totpLastStep: null, recoveryCodes: Prisma.DbNull } });
    await this.auth.revokeAll(id);
    return { ok: true };
  }

  async revokeSessions(id: string, actor: { sub: string; roles: string[] }) {
    await this.target(id, actor);
    await this.auth.revokeAll(id);
    return { ok: true };
  }

  async remove(id: string, actor: { sub: string; roles: string[] }) {
    if (id === actor.sub) throw new BadRequestException('You cannot delete yourself');
    const u = await this.target(id, actor);
    if (u.roles.some((r) => r.role.key === 'SUPER_ADMIN')) await this.assertAnotherSuper(id);
    await this.db.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, email: `deleted+${id}@invalid.local` } });
    await this.auth.revokeAll(id);
    return { ok: true };
  }
}

@Controller('admin/users')
export class UsersController {
  constructor(private u: UsersService) {}
  @Get() @Secured('user:read') list() { return this.u.list(); }
  @Get('roles/matrix') @Secured('user:read') matrix() { return this.u.matrix(); }
  @Get('roles') @Secured('user:read') roles(@Req() r: AuthedRequest) { return this.u.roles(r.user!); }
  @Post() @HttpCode(201) @Secured('user:create') invite(@Body() b: unknown, @Req() r: AuthedRequest) { return this.u.invite(createSchema.parse(b), r.user!); }
  @Put(':id') @Secured('user:update') update(@Param('id') id: string, @Body() b: unknown, @Req() r: AuthedRequest) { return this.u.update(idSchema.parse(id), updateSchema.parse(b), r.user!); }
  @Post(':id/reset-2fa') @HttpCode(200) @Secured('user:update') reset2fa(@Param('id') id: string, @Req() r: AuthedRequest) { return this.u.reset2fa(idSchema.parse(id), r.user!); }
  @Post(':id/revoke-sessions') @HttpCode(200) @Secured('user:update') revoke(@Param('id') id: string, @Req() r: AuthedRequest) { return this.u.revokeSessions(idSchema.parse(id), r.user!); }
  @Delete(':id') @Secured('user:delete') remove(@Param('id') id: string, @Req() r: AuthedRequest) { return this.u.remove(idSchema.parse(id), r.user!); }
}

@Controller('admin/audit')
export class AuditController {
  constructor(private db: PrismaService) {}

  @Get() @Secured('audit:read')
  async audit(@Query('page') page = '1', @Query('entity') entity?: string, @Query('action') action?: string) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const where: any = {};
    if (entity) where.entity = { startsWith: entity.slice(0, 60) };
    if (action) where.action = action.slice(0, 30);
    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p - 1) * 50, take: 50, include: { actor: { select: { email: true, name: true, avatarUrl: true, roles: { select: { role: { select: { key: true, name: true } } } } } } } }),
      this.db.auditLog.count({ where }),
    ]);
    return { total, page: p, pageSize: 50, rows: rows.map((r) => ({ id: r.id, at: r.createdAt, actor: r.actor?.email ?? null, actorName: r.actor?.name ?? null, actorAvatar: r.actor?.avatarUrl ?? null, actorRole: (r.actor as any)?.roles?.map((x: any) => (x.role.name as any)?.en ?? x.role.key).join(', ') || null, action: r.action, entity: r.entity, entityId: r.entityId, ip: r.ip, diff: r.diff })) };
  }

  @Get('logins') @Secured('audit:read')
  async logins(@Query('page') page = '1') {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const [rows, total] = await Promise.all([
      this.db.loginHistory.findMany({ orderBy: { createdAt: 'desc' }, skip: (p - 1) * 50, take: 50 }),
      this.db.loginHistory.count(),
    ]);
    return { total, page: p, pageSize: 50, rows: rows.map((r) => ({ id: r.id, at: r.createdAt, email: r.email, success: r.success, ip: r.ip, userAgent: r.userAgent })) };
  }
}
