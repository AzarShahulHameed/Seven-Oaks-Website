import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface NotifyInput { type: string; severity?: 'info' | 'success' | 'warning' | 'error'; title: string; body?: string; link?: string; dedupeKey?: string }

/** Creates admin notifications. Never throws: a failed notification must not break the action that caused it. */
@Injectable()
export class NotificationsService {
  private log = new Logger('Notifications');
  constructor(private db: PrismaService) {}

  async notify(n: NotifyInput) {
    try {
      if (n.dedupeKey && (await this.db.notification.findUnique({ where: { dedupeKey: n.dedupeKey } }))) return;
      await this.db.notification.create({ data: { type: n.type, severity: n.severity ?? 'info', title: n.title.slice(0, 200), body: n.body?.slice(0, 600), link: n.link, dedupeKey: n.dedupeKey } });
      if (Math.random() < 0.02) await this.db.notification.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86_400_000) } } });
    } catch (e) { this.log.warn(`notify failed: ${(e as Error).message}`); }
  }

  async list(userId: string, limit = 50) {
    const rows = await this.db.notification.findMany({ where: { NOT: { hiddenBy: { has: userId } } }, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 100) });
    return {
      unread: rows.filter((r) => !r.readBy.includes(userId)).length,
      items: rows.map((r) => ({ id: r.id, type: r.type, severity: r.severity, title: r.title, body: r.body, link: r.link, createdAt: r.createdAt, read: r.readBy.includes(userId) })),
    };
  }
  async markRead(userId: string, ids?: string[]) {
    const rows = await this.db.notification.findMany({ where: { NOT: [{ readBy: { has: userId } }, { hiddenBy: { has: userId } }], ...(ids ? { id: { in: ids } } : {}) }, select: { id: true, readBy: true }, take: 500 });
    await Promise.all(rows.map((r) => this.db.notification.update({ where: { id: r.id }, data: { readBy: [...r.readBy, userId] } })));
  }
  async clear(userId: string) {
    const rows = await this.db.notification.findMany({ where: { NOT: { hiddenBy: { has: userId } } }, select: { id: true, hiddenBy: true, readBy: true }, take: 1000 });
    await Promise.all(rows.map((r) => this.db.notification.update({ where: { id: r.id }, data: { hiddenBy: [...r.hiddenBy, userId], readBy: r.readBy.includes(userId) ? r.readBy : [...r.readBy, userId] } })));
  }
}
