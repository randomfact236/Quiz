import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/**
 * SEC-08: this endpoint is public and was typed inline (`{ email: string }`),
 * which bypasses the global ValidationPipe (no runtime metatype) - an
 * unauthenticated attacker could unsubscribe any address with any payload.
 */
export class UnsubscribeDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  email: string;
}
