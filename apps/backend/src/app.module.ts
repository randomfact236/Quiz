import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import helmet from 'helmet';

import {
  DB_PORT,
  DB_POOL_SIZE,
  RATE_LIMIT_TTL_MS,
  RATE_LIMIT_MAX_REQUESTS,
} from './common/constants/app.constants';

// Modules
import { QuizModule } from './quiz/quiz.module';
import { DadJokesModule } from './dad-jokes/dad-jokes.module';
import { RiddlesModule } from './riddles/riddles.module';
import { ImageRiddlesModule } from './image-riddles/image-riddles.module';
import { AdminImageRiddlesModule } from './admin/image-riddles/admin-image-riddles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';

// Common
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Root application module that configures all core dependencies and modules
 * 
 * @description Configures the NestJS application with database connection,
 * rate limiting, security middleware, and all feature modules.
 * Provides global exception handling, rate limiting, and request logging.
 * 
 * @class
 * @implements {NestModule}
 * @example
 * // Used as the root module in main.ts
 * const app = await NestFactory.create(AppModule);
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', DB_PORT),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'ai_quiz'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
        poolSize: DB_POOL_SIZE,
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMIT_TTL_MS, // 1 minute
        limit: RATE_LIMIT_MAX_REQUESTS, // 100 requests per minute
      },
    ]),

    // Feature Modules
    QuizModule,
    DadJokesModule,
    RiddlesModule,
    ImageRiddlesModule,
    AdminImageRiddlesModule,
    UsersModule,
    AuthModule,
    HealthModule,
    SettingsModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures middleware for the application
   * 
   * @description Applies Helmet security middleware to all routes for
   * security headers including CSP, HSTS, and XSS protection.
   * 
   * @param {MiddlewareConsumer} consumer - The middleware consumer instance
   * @returns {void}
   * @example
   * // Automatically called by NestJS during bootstrap
   * consumer.apply(helmet()).forRoutes('*');
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(helmet()).forRoutes('*');
  }
}
