import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Organization logos are uploaded as data-URI strings in the JSON body —
  // Express's default 100kb limit is too tight for even a small resized logo.
  app.use(json({ limit: '2mb' }));

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
