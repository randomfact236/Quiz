import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminImageRiddlesModule } from './admin/image-riddles/admin-image-riddles.module';
import { AuthModule } from './auth/auth.module';
import {
  DB_PORT,
  DB_POOL_SIZE,
} from './common/constants/app.constants';

// Modules
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DadJokesModule } from './dad-jokes/dad-jokes.module';
import { HealthModule } from './health/health.module';
import { ImageRiddlesModule } from './image-riddles/image-riddles.module';
import { QuizModule } from './quiz/quiz.module';
import { RiddlesModule } from './riddles/riddles.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';

// Common

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
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV') || 'development';
        const isProduction = nodeEnv === 'production';

        // SECURITY: Require explicit environment variables - no defaults
        const dbHost = configService.getOrThrow('DB_HOST');
        const dbPort = configService.get('DB_PORT', DB_PORT);
        const dbUsername = configService.getOrThrow('DB_USERNAME');
        const dbPassword = configService.getOrThrow('DB_PASSWORD');
        const dbDatabase = configService.getOrThrow('DB_DATABASE');

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // synchronize: auto-enables in development to pick up entity changes (e.g. new columns).
          // NEVER enable in production — use migrations instead.
          synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
          // SECURITY: Only log in development, never in production
          logging: !isProduction && configService.get('DB_LOGGING') === 'true',
          poolSize: DB_POOL_SIZE,
          // SSL configuration - disabled for Docker
          ssl: false,
        };
      },
      inject: [ConfigService],
    }),

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
    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
