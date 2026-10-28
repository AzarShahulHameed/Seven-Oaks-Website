import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, Query, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { audit } from '../common/audit-context';
import { Secured } from '../common/security';
import { DEFAULT_LIMITS, UsageService } from '../common/usage.service';
import { socialIconPng } from './email-icon';

const limit = z.object({ freeMonthly: z.number().int().min(0).max(1_000_000_000), dailyLimit: z.number().int().min(0).max(1_000_000_000), pricePer1000: z.number().min(0).max(10_000) });

@Controller('public')
export class PublicAssetsController {
  constructor(private usage: UsageService) {}

  /** Social icons for emails: GET /api/public/email-icon/instagram.png?c=1f4d2b */
  @Get('email-icon/:file') @Throttle({ default: { limit: 600, ttl: 60_000 } })
  async icon(@Param('file') file: string, @Query('c') c: string | undefined, @Res() res: Response) {
    const m = /^([a-z]{1,12})\.png$/.exec(file);
    const png = m ? await socialIconPng(m[1], c ?? '1f4d2b') : null;
    if (!png) throw new NotFoundException();
    res.setHeader('content-type', 'image/png'); res.setHeader('cache-control', 'public, max-age=31536000, immutable'); res.setHeader('cross-origin-resource-policy', 'cross-origin');
    res.send(png);
  }

  /** The website tells us each time the branded Google map is loaded, so the meter in Admin → API usage can count it. */
  @Post('usage/map') @HttpCode(204) @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async map() { await this.usage.track('maps'); }
}

@Controller('admin/usage')
export class UsageController {
  constructor(private usage: UsageService) {}
  @Get() @Secured('integration:read') summary() { return this.usage.summary(); }
  @Put('limits') @Secured('integration:update')
  async save(@Body() b: unknown) {
    const d = z.object({ maps: limit, email: limit }).parse(b);
    const cur = await this.usage.limits();
    const next = { maps: { ...cur.maps, ...d.maps }, email: { ...cur.email, ...d.email } };
    audit({ label: 'API usage allowances', entity: 'admin/usage', before: { maps: cur.maps, email: cur.email }, after: next });
    return this.usage.saveLimits({ maps: { ...DEFAULT_LIMITS.maps, ...next.maps }, email: { ...DEFAULT_LIMITS.email, ...next.email } });
  }
}
