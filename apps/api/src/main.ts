import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ZodFilter } from './common/security';
import { auditStore } from './common/audit-context';
import { allowedOrigins, config } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: true });
  app.set('trust proxy', 1); // Render terminates TLS in front of the app
  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: '1mb' });
  app.use(helmet());
  app.use(cookieParser());
  app.use((_req: any, _res: any, next: any) => auditStore.run({}, next));
  app.enableCors({ origin: [...allowedOrigins], credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE'] });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ZodFilter());
  app.enableShutdownHooks();
  await app.listen(config.PORT, '0.0.0.0');
}
bootstrap();
