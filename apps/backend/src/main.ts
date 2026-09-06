import { ValidationPipe, Logger, INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { SERVER_PORT, FRONTEND_PORT, CORS_MAX_AGE } from './common/constants/app.constants';

/**
 * Setup security middleware
 * @param app - NestJS application instance
 */
function setupMiddleware(app: NestExpressApplication): void {
  const configService = app.get(ConfigService);

  // Security: HTTP headers
  app.use(helmet());

  // Behind a reverse proxy (Dokploy/Traefik/nginx) so rate limiting and
  // brute-force lockout key off real client IPs instead of the proxy IP.
  // TRUST_PROXY=true trusts one hop; a number sets hop count; an IP/string
  // is passed through to express as-is.
  const trustProxy = configService.get('TRUST_PROXY');
  if (trustProxy) {
    app.set('trust proxy', trustProxy === 'true' ? 1 : Number(trustProxy) || trustProxy);
  }

  // JSON body limit: 1mb globally; bulk import endpoints (quiz-mcq, riddle-mcq,
  // dad-jokes, image-riddles, admin bulk) allow 50mb for large CSV/JSON imports.
  const BULK_BODY_LIMIT = '50mb';
  const DEFAULT_BODY_LIMIT = '1mb';
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isBulkImport = /\/bulk(-action)?$/.test(req.path);
    express.json({ limit: isBulkImport ? BULK_BODY_LIMIT : DEFAULT_BODY_LIMIT })(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT }));

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
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Serve uploaded media library files. Files live in <cwd>/public/uploads and
  // are referenced as /uploads/<file>; mount the static root at public/uploads so
  // the /uploads/ prefix strips to the correct directory (bypasses the /api prefix).
  // CORP override: helmet sets `Cross-Origin-Resource-Policy: same-origin`, which
  // makes browsers refuse to render these images when embedded in the frontend
  // app (localhost:3010) — a cross-origin context relative to the API (3012).
  // Static media must be embeddable, so relax CORP just for uploads.
  app.useStaticAssets(path.join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads/',
    maxAge: '7d',
    immutable: true,
    setHeaders: (res: express.Response) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
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
      .addTag('Quiz MCQ', 'Quiz MCQ management endpoints')
      .addTag('Riddle MCQ', 'Riddle MCQ endpoints')
      .addTag('Dad Jokes', 'Dad jokes endpoints')
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

  await app.listen(port, '0.0.0.0');

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
 * Fail fast in production when critical env vars are missing or weak.
 * Without this, an unset CORS_ORIGIN/JWT_SECRET silently falls back to
 * dev defaults and ships an insecure or broken API.
 */
function validateProductionEnv(configService: ConfigService): void {
  if (configService.get('NODE_ENV') !== 'production') return;

  const problems: string[] = [];
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret || jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be set and at least 32 characters');
  }
  if (!configService.get('CORS_ORIGIN')) {
    problems.push('CORS_ORIGIN must be set (e.g. https://quiz.example.com)');
  }
  if (!configService.get('FRONTEND_URL')) {
    problems.push('FRONTEND_URL must be set (used for OAuth/email redirects)');
  }
  if (!configService.get('DB_SYNCHRONIZE') || configService.get('DB_SYNCHRONIZE') === 'true') {
    problems.push(
      'DB_SYNCHRONIZE must be "false" in production — schema changes go through migrations'
    );
  }
  if (problems.length > 0) {
    throw new Error(`Production environment validation failed:\n  - ${problems.join('\n  - ')}`);
  }
}

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  validateProductionEnv(configService);
  setupMiddleware(app);
  setupSwagger(app);

  const port = configService.get('PORT', SERVER_PORT);
  await startServer(app, port);
}

bootstrap();
