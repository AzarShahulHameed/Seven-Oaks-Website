import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from './prisma.service';

export interface UsageLimit { label: string; unit: string; freeMonthly: number; dailyLimit: number; pricePer1000: number; note: string }
export type UsageLimits = Record<'maps' | 'email', UsageLimit>;
export const DEFAULT_LIMITS: UsageLimits = {
  maps: { label: 'Google Maps', unit: 'map loads', freeMonthly: 10000, dailyLimit: 0, pricePer1000: 7, note: 'Google gives 10,000 free map loads per month for the Maps JavaScript API, then charges about US$7 per 1,000. Check your own prices in Google Cloud → Billing.' },
  email: { label: 'Email (Resend)', unit: 'emails', freeMonthly: 3000, dailyLimit: 100, pricePer1000: 0, note: 'Set these to your Resend plan. The free plan allows about 3,000 emails a month and 100 a day. Paid plans cost a fixed monthly fee, so leave the price at 0.' },
};
const day = (d = new Date()) => d.toISOString().slice(0, 10);

/** Counts calls to paid or limited services and warns at 80 / 90 / 100 % of the allowance. */
@Injectable()
export class UsageService {
  private log = new Logger('Usage');
  constructor(private db: PrismaService, private notes: NotificationsService) {}

  async limits(): Promise<UsageLimits> {
    const r = await this.db.siteSetting.findUnique({ where: { key: 'usage.limits' } });
    const v = (r?.value ?? {}) as Partial<UsageLimits>;
    return { maps: { ...DEFAULT_LIMITS.maps, ...(v.maps ?? {}) }, email: { ...DEFAULT_LIMITS.email, ...(v.email ?? {}) } };
  }
  async saveLimits(l: UsageLimits) {
    await this.db.siteSetting.upsert({ where: { key: 'usage.limits' }, update: { value: l as any }, create: { key: 'usage.limits', value: l as any } });
    return { ok: true };
  }

  /** Never throws: counting must not break a map load or an email. */
  async track(provider: 'maps' | 'email', n = 1) {
    try {
      const d = day();
      const row = await this.db.apiUsage.upsert({ where: { provider_day_metric: { provider, day: d, metric: 'calls' } }, update: { count: { increment: n } }, create: { provider, day: d, metric: 'calls', count: n } });
      if (provider === 'email' || row.count % 20 === 0) await this.alert(provider);
    } catch (e) { this.log.warn(`track failed: ${(e as Error).message}`); }
  }

  private async monthTotal(provider: string, ym = day().slice(0, 7)) {
    const r = await this.db.apiUsage.aggregate({ _sum: { count: true }, where: { provider, metric: 'calls', day: { startsWith: ym } } });
    return r._sum.count ?? 0;
  }

  private async alert(provider: 'maps' | 'email') {
    const lim = (await this.limits())[provider];
    if (!lim.freeMonthly) return;
    const ym = day().slice(0, 7), used = await this.monthTotal(provider, ym), pct = (used / lim.freeMonthly) * 100;
    for (const t of [100, 90, 80]) {
      if (pct >= t) {
        await this.notes.notify({ type: 'system', severity: t === 100 ? 'error' : 'warning', title: t === 100 ? `${lim.label}: free allowance used up` : `${lim.label} usage at ${t}%`, body: `${used.toLocaleString()} of ${lim.freeMonthly.toLocaleString()} ${lim.unit} used this month.${t === 100 && lim.pricePer1000 ? ' Extra use is billed by the provider.' : ''}`, link: '/admin/usage', dedupeKey: `usage-${provider}-${t}-${ym}` });
        break;
      }
    }
    if (provider === 'email' && lim.dailyLimit) {
      const today = (await this.db.apiUsage.findUnique({ where: { provider_day_metric: { provider, day: day(), metric: 'calls' } } }))?.count ?? 0;
      if (today >= lim.dailyLimit * 0.9) await this.notes.notify({ type: 'system', severity: 'warning', title: 'Email: daily sending limit almost reached', body: `${today} of ${lim.dailyLimit} emails today.`, link: '/admin/usage', dedupeKey: `usage-email-daily-${day()}` });
    }
  }

  async todayCount(provider: 'maps' | 'email') {
    return (await this.db.apiUsage.findUnique({ where: { provider_day_metric: { provider, day: day(), metric: 'calls' } } }))?.count ?? 0;
  }

  async summary() {
    const lim = await this.limits();
    const since = day(new Date(Date.now() - 29 * 864e5));
    const rows = await this.db.apiUsage.findMany({ where: { metric: 'calls', day: { gte: since } }, orderBy: { day: 'asc' } });
    const ym = day().slice(0, 7);
    const out: Record<string, any> = {};
    for (const p of ['maps', 'email'] as const) {
      const l = lim[p], used = await this.monthTotal(p, ym);
      const billable = Math.max(0, used - l.freeMonthly);
      out[p] = {
        ...l, used, today: await this.todayCount(p), pct: l.freeMonthly ? Math.min(100, Math.round((used / l.freeMonthly) * 1000) / 10) : 0, remaining: Math.max(0, l.freeMonthly - used),
        estimatedCost: Math.round((billable / 1000) * l.pricePer1000 * 100) / 100,
        daily: Array.from({ length: 30 }, (_, k) => { const d = day(new Date(Date.now() - (29 - k) * 864e5)); return { day: d, count: rows.find((r) => r.provider === p && r.day === d)?.count ?? 0 }; }),
      };
    }
    return out;
  }
}
