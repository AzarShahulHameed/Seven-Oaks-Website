import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { config } from '../config';
import { NotificationsService } from './notifications.service';
import { UsageService } from './usage.service';
import { auditStore } from './audit-context';

export interface RefreshResult { ok: boolean; reason?: string }

/** Tells the Next.js site to refresh cached content after an admin change (no redeploy needed). The result is remembered for the current request so the admin can be warned when the live site could not be refreshed. */
@Injectable()
export class RevalidateService {
  private log = new Logger('Revalidate');
  async run(tags: ('content' | 'bootstrap')[] = ['content', 'bootstrap']): Promise<RefreshResult> {
    const r = await this.ping(tags);
    if (!r.ok) this.log.warn(r.reason);
    const st = auditStore.getStore();
    if (st && (!r.ok || !st.refresh)) st.refresh = r;
    return r;
  }
  /** Sends the refresh call and explains in plain words why it failed. */
  async ping(tags: ('content' | 'bootstrap')[]): Promise<RefreshResult> {
    const url = `${config.WEB_URL.replace(/\/$/, '')}/api/revalidate`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-revalidate-secret': config.REVALIDATE_SECRET }, body: JSON.stringify({ tags }), signal: AbortSignal.timeout(8000) });
      if (res.ok) return { ok: true };
      if (res.status === 401) return { ok: false, reason: 'The website refused the refresh because REVALIDATE_SECRET is different on the website and on the API. Make both values identical.' };
      return { ok: false, reason: `The website answered ${res.status} when asked to refresh (${url}).` };
    } catch (e) {
      return { ok: false, reason: `The API could not reach the website at ${config.WEB_URL} to refresh it (${(e as Error).message}). Check WEB_URL on the API.` };
    }
  }
}

export { PrismaService };

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [PrismaService, RevalidateService, NotificationsService, UsageService],
  exports: [PrismaService, RevalidateService, NotificationsService, UsageService, JwtModule],
})
export class CommonModule {}
