import { Body, Controller, Delete, Get, HttpCode, Module, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MenuLocation } from '@prisma/client';
import { z } from 'zod';
import { AuthedRequest, Secured } from '../common/security';
import { MediaModule } from '../media/media.controller';
import { ContentService } from './content.service';
import { menuSchema, pageCreateSchema, pageSaveSchema, redirectSchema, settingSchema, themeSchema } from './schemas';

const locSchema = z.nativeEnum(MenuLocation);

@Controller('public')
@Throttle({ default: { limit: 600, ttl: 60_000 } }) // called server-side by the website from a few shared IPs
export class PublicController {
  constructor(private c: ContentService) {}
  @Get('bootstrap') bootstrap() { return this.c.bootstrap(); }
  @Get('page') page(@Query('locale') locale = 'en', @Query('slug') slug = '') {
    return this.c.resolvePage(z.enum(['en', 'ar']).parse(locale), slug);
  }
  @Get('sitemap') sitemap() { return this.c.sitemap(); }
  @Get('redirect') redirect(@Query('path') path = '') { return this.c.lookupRedirect(z.string().max(300).parse(path)); }
}

@Controller('admin')
export class AdminController {
  constructor(private c: ContentService) {}

  @Get('theme') @Secured('theme:read') getTheme() { return this.c.getTheme().then((tokens) => ({ tokens })); }
  @Put('theme') @Secured('theme:update') setTheme(@Body() b: unknown) { return this.c.setTheme(themeSchema.parse(b).tokens); }

  @Get('settings') @Secured('settings:read') settings() { return this.c.listSettings(); }
  @Put('settings/:key') @Secured('settings:update') setSetting(@Param('key') key: string, @Body() b: unknown) {
    return this.c.setSetting(key, settingSchema.parse(b).value);
  }

  /** Is the link from this API to the live website working? Shown in Settings and on the dashboard. */
  @Get('site-link') @Secured('settings:read') siteLink() { return this.c.siteLink(); }
  @Post('site-refresh') @HttpCode(200) @Secured('settings:update') siteRefresh() { return this.c.siteRefresh(); }

  @Get('menus/:location') @Secured('menu:read') getMenu(@Param('location') l: string) { return this.c.getMenu(locSchema.parse(l)); }
  @Put('menus/:location') @Secured('menu:update') setMenu(@Param('location') l: string, @Body() b: unknown) {
    return this.c.setMenu(locSchema.parse(l), menuSchema.parse(b).items);
  }

  @Get('seo/overview') @Secured('seo:read') seoOverview() { return this.c.seoOverview(); }
  @Get('redirects') @Secured('seo:read') listRedirects() { return this.c.listRedirects(); }
  @Post('redirects') @HttpCode(201) @Secured('seo:update') addRedirect(@Body() b: unknown) { return this.c.saveRedirect(null, redirectSchema.parse(b)); }
  @Put('redirects/:id') @Secured('seo:update') editRedirect(@Param('id') id: string, @Body() b: unknown) { return this.c.saveRedirect(z.string().cuid().parse(id), redirectSchema.parse(b)); }
  @Delete('redirects/:id') @Secured('seo:update') delRedirect(@Param('id') id: string) { return this.c.deleteRedirect(z.string().cuid().parse(id)); }

  @Get('pages') @Secured('page:read') listPages() { return this.c.listPages(); }
  @Post('pages') @HttpCode(201) @Secured('page:update') createPage(@Body() b: unknown) {
    const d = pageCreateSchema.parse(b);
    return this.c.createPage(d.key, d.title);
  }
  @Get('pages/:key') @Secured('page:read') getPage(@Param('key') key: string) { return this.c.getPage(key); }
  @Put('pages/:key') @Secured('page:update') savePage(@Param('key') key: string, @Body() b: unknown) {
    return this.c.savePage(key, pageSaveSchema.parse(b) as any);
  }
  @Post('pages/:key/publish') @HttpCode(200) @Secured('page:publish') publish(@Param('key') key: string, @Req() req: AuthedRequest) {
    return this.c.publish(key, req.user!.sub);
  }
  @Post('pages/:key/unpublish') @HttpCode(200) @Secured('page:publish') unpublish(@Param('key') key: string) { return this.c.unpublish(key); }
  @Post('pages/:key/restore/:version') @HttpCode(200) @Secured('page:publish')
  restore(@Param('key') key: string, @Param('version', ParseIntPipe) version: number) { return this.c.restore(key, version); }
}

@Module({ imports: [MediaModule], controllers: [PublicController, AdminController], providers: [ContentService] })
export class ContentModule {}
