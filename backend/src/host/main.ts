import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from '@/host/app.module';
import { HttpExceptionFilter } from '@/shared/Common/filters/http-exception.filter';
import { ResponseInterceptor } from '@/shared/Common/interceptors/response.interceptor';

async function bootstrap() {
  // `rawBody` keeps the unparsed payload alongside the parsed one — payment
  // gateways sign the raw bytes, so webhook verification needs it verbatim.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`CodeAtlas API running on http://localhost:${port}/api/v1`);
}

void bootstrap();
