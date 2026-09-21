import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * SEC-08: the vote endpoint is public and was typed inline, so the global
 * ValidationPipe could not validate the payload (no runtime metatype).
 */
export class VoteClassicDto {
  @ApiProperty({ enum: ['like', 'dislike'] })
  @IsIn(['like', 'dislike'], { message: 'voteType must be "like" or "dislike"' })
  voteType: 'like' | 'dislike';

  @ApiPropertyOptional({ description: 'Remove an existing vote instead of adding one' })
  @IsOptional()
  @IsBoolean()
  remove?: boolean;

  @ApiPropertyOptional({ description: 'Client-issued guest id for anonymous voters' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;
}
