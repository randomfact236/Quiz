import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);
  private readonly MAX_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION_MINUTES: number;

  constructor(
    private cacheService: CacheService,
    private configService: ConfigService,
  ) {
    this.MAX_ATTEMPTS = this.configService.get<number>('bruteForce.maxAttempts') || 5;
    this.LOCKOUT_DURATION_MINUTES = this.configService.get<number>('bruteForce.lockoutMinutes') || 15;
  }

  private getKey(identifier: string): string {
    return `brute_force:${identifier}`;
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    const currentAttempts = await this.cacheService.get<number>(key) || 0;
    const newAttempts = currentAttempts + 1;
    
    if (newAttempts === 1) {
      await this.cacheService.set(key, newAttempts, this.LOCKOUT_DURATION_MINUTES * 60);
    } else {
      const ttl = await this.cacheService.getTTL(key);
      if (ttl > 0) {
        await this.cacheService.set(key, newAttempts, ttl);
      }
    }

    this.logger.warn(`Failed login attempt ${newAttempts}/${this.MAX_ATTEMPTS} for ${identifier}`);

    if (newAttempts >= this.MAX_ATTEMPTS) {
      throw new HttpException(
        `Too many failed login attempts. Account locked for ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
        423
      );
    }
  }

  async recordSuccess(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.cacheService.del(key);
    this.logger.log(`Successful login for ${identifier} - brute force counter reset`);
  }

  async isLockedOut(identifier: string): Promise<boolean> {
    const key = this.getKey(identifier);
    const attempts = await this.cacheService.get<number>(key);
    return (attempts || 0) >= this.MAX_ATTEMPTS;
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const attempts = await this.cacheService.get<number>(key) || 0;
    return Math.max(0, this.MAX_ATTEMPTS - attempts);
  }
}
