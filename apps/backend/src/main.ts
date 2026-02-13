import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security: HTTP headers
  app.use(helmet());

  // Security: CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3010'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 3600,
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

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Quiz Platform API')
      .setDescription('Enterprise-grade Quiz Platform API with comprehensive features')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Quiz', 'Quiz management endpoints')
      .addTag('Dad Jokes', 'Dad jokes endpoints')
      .addTag('Riddles', 'Riddles endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 4000);
  await app.listen(port);

  logger.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║          AI Quiz Platform - Enterprise Backend            ║
  ╠═══════════════════════════════════════════════════════════╣
  ║  Environment: ${(configService.get('NODE_ENV') || 'development').padEnd(43)}║
  ║  API Server:  http://localhost:${port}/api                    ║
  ║  Swagger UI:  http://localhost:${port}/api/docs               ║
  ║  Health:      http://localhost:${port}/api/health             ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();