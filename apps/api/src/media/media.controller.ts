import { Body, Controller, Delete, Get, HttpCode, Module, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { Secured } from '../common/security';
import { config } from '../config';
import { MediaService } from './media.service';

const folder = z.string().max(60).regex(/^\/[a-z0-9\-\/]*$/).default('/');
const alt = z.string().max(300).default('');
const uploadSchema = z.object({ altEn: alt, altAr: alt, folder, showsChild: z.enum(['true', 'false']).default('false').transform((v) => v === 'true') });
const updateSchema = z.object({ altText: z.object({ en: alt, ar: alt }).optional(), folder: folder.optional(), showsChild: z.boolean().optional() });
const consentSchema = z.object({ granted: z.boolean(), note: z.string().max(300).default('') });
const id = z.string().regex(/^[a-f0-9]{24}$/);

@Controller('admin/media')
export class MediaController {
  constructor(private m: MediaService) {}

  @Get() @Secured('media:read')
  list(@Query('folder') f?: string, @Query('kind') kind?: string) { return this.m.list({ folder: f, kind: kind === 'DOCUMENT' ? 'DOCUMENT' : kind === 'VIDEO' ? 'VIDEO' : 'IMAGE' }); }

  @Post('video/ticket') @HttpCode(200) @Secured('media:create')
  ticket(@Body() b: unknown) { const d = z.object({ name: z.string().max(200), size: z.number().int().min(1) }).parse(b); return this.m.videoTicket(d.name, d.size); }

  @Post('video/register') @HttpCode(201) @Secured('media:create')
  register(@Body() b: unknown) { const d = z.object({ id, altEn: alt, altAr: alt, folder, showsChild: z.boolean().default(false), filename: z.string().max(200).default('') }).parse(b); return this.m.videoRegister(d.id, d); }

  @Post() @HttpCode(201) @Secured('media:create')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: unknown) {
    return this.m.upload(file, uploadSchema.parse(body) as any);
  }

  @Put(':id') @Secured('media:update')
  update(@Param('id') i: string, @Body() b: unknown) { return this.m.update(id.parse(i), updateSchema.parse(b)); }

  @Post(':id/consent') @HttpCode(200) @Secured('media:update')
  consent(@Param('id') i: string, @Body() b: unknown) {
    const d = consentSchema.parse(b);
    return this.m.setConsent(id.parse(i), d.granted, d.note);
  }

  @Get(':id/usage') @Secured('media:read')
  usage(@Param('id') i: string) { return this.m.usage(id.parse(i)); }

  @Delete(':id') @Secured('media:delete')
  remove(@Param('id') i: string) { return this.m.remove(id.parse(i)); }
}

@Module({ controllers: [MediaController], providers: [MediaService], exports: [MediaService] })
export class MediaModule {}
