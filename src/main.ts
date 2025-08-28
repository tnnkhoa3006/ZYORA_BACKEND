import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Set memory limits and logging for production
  const isProduction = process.env.NODE_ENV === 'production';

  const configService = new ConfigService();
  const port = configService.get<number>('PORT') || 8000;

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug'],
  });

  app.enableCors({
    origin:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Backend Server chạy tại http://localhost:${port}`);
}

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 200 * 1024 * 1024) {
    // 200MB threshold
    console.warn('High memory usage:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
    });
  }
}, 30000); // Check every 30 seconds

void bootstrap();
