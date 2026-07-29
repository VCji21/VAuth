import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

function parseCorsOrigins(value: string | undefined, fallback: string): string[] {
  if (!value) {
    return [fallback];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const webAppUrl = configService.getOrThrow<string>('WEB_APP_URL');
  const port = configService.get<number>('API_PORT', 8000);

  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('CORS_ORIGINS'), webAppUrl),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
}
bootstrap();
