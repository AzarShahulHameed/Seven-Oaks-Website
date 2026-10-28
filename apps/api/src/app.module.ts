import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.controller';
import { AuthModule } from './auth/auth.controller';
import { CampaignsModule } from './campaigns/campaigns.controller';
import { CommonModule } from './common/common.module';
import { AuditInterceptor, CsrfGuard } from './common/security';
import { EntriesModule } from './entries/entries.controller';
import { EngageModule } from './engage/engage.controller';
import { ContentModule } from './content/content.controller';
import { IntegrationsModule } from './integrations/integrations.controller';
import { MediaModule } from './media/media.controller';

@Controller('health')
class HealthController {
  @Get() ok() { return { ok: true }; }
}

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), CommonModule, IntegrationsModule, AuthModule, ContentModule, MediaModule, AnalyticsModule, EngageModule, CampaignsModule, EntriesModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
