import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const isProduction = configService.get('NODE_ENV') === 'production';

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // In production, only allow the configured frontend URL
      if (isProduction) {
        if (!origin || origin === frontendUrl) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
        return;
      }

      // In development, allow any localhost origin (any port)
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Enable cookie parser
  app.use(cookieParser());

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get('BACKEND_PORT', 4000);
  await app.listen(port);

  console.log(`🚀 Backend API running on http://localhost:${port}`);
  console.log(`📝 API base: http://localhost:${port}/api/v1`);
}
bootstrap();
