import type { MetadataRoute } from 'next';
import { getBootstrap } from '@/lib/api';

export const dynamic = 'force-dynamic';
// Crawlers used by AI search and assistants. Allowed by default so the nursery can be found and quoted; switch off in Settings → Search.
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'Meta-ExternalAgent'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  const b = await getBootstrap();
  const allowAi = b?.settings?.['public.seoDefaults']?.blockAiCrawlers !== true;
  const hidden = ['/admin', '/api', '/preview', '/m/'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: hidden },
      ...(allowAi ? [{ userAgent: AI_BOTS, allow: '/', disallow: hidden }] : [{ userAgent: AI_BOTS.filter((x) => x !== 'Bingbot'), disallow: '/' }]),
    ],
    sitemap: site ? `${site}/sitemap.xml` : undefined,
    host: site || undefined,
  };
}
