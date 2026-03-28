import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CacheModule } from '../common/cache/cache.module';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../common/services/email.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BruteForceService } from './brute-force.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    UsersModule,
    CacheModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, BruteForceService, EmailService],
  exports: [AuthService, BruteForceService],
})
export class AuthModule {}
