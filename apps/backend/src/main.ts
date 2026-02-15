import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

import {
  SERVER_PORT,
  FRONTEND_PORT,
  CORS_MAX_AGE,
} from './common/constants/app.constants';

/**
 * Setup security middleware
 * @param app - NestJS application instance
 */
function setupMiddleware(app: INestApplication): void {
  const configService = app.get(ConfigService);

  // Security: HTTP headers
  app.use(helmet());

  // Security: CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', `http://localhost:${FRONTEND_PORT}`),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: CORS_MAX_AGE,
  });

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');
}

/**
 * Setup Swagger documentation
 * @param app - NestJS application instance
 */
function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Quiz Platform API')
      .setDescription('Enterprise-grade Quiz Platform API with comprehensive features')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Quiz', 'Quiz management endpoints')
      .addTag('Dad Jokes', 'Dad jokes endpoints')
      .addTag('Riddles', 'Riddles endpoints')
      .addTag('Image Riddles', 'Image-based riddles and visual puzzles')
      .addTag('Admin - Image Riddles', 'Admin panel for managing image riddles')
      .addTag('Users', 'User management endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
}

/**
 * Start the server
 * @param app - NestJS application instance
 * @param port - Port to listen on
 */
async function startServer(app: INestApplication, port: number): Promise<void> {
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  await app.listen(port);

  // Console box padding constant for consistent alignment
  const BOX_PADDING_WIDTH = 43;

  logger.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║          AI Quiz Platform - Enterprise Backend            ║
  ╠═══════════════════════════════════════════════════════════╣
  ║  Environment: ${(configService.get('NODE_ENV') || 'development').padEnd(BOX_PADDING_WIDTH)}║
  ║  API Server:  http://localhost:${port}/api                    ║
  ║  Swagger UI:  http://localhost:${port}/api/docs               ║
  ║  Health:      http://localhost:${port}/api/health             ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  setupMiddleware(app);
  setupSwagger(app);

  const port = configService.get('PORT', SERVER_PORT);
  await startServer(app, port);
}

bootstrap();
