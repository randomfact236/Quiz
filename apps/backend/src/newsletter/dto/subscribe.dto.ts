import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ enum: ['footer', 'about'], default: 'footer' })
  @IsOptional()
  @IsIn(['footer', 'about'])
  source?: 'footer' | 'about';

  /**
   * Honeypot (plan/14-newsletter.md P2): hidden field — humans leave it empty.
   * A filled value is treated as spam: the endpoint returns success but stores
   * nothing (so the bot learns nothing).
   */
  @ApiPropertyOptional({ description: 'Leave empty (spam trap)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}
