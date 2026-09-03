import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AchievementUnlockDto {
  @ApiProperty({ description: 'Client-side achievement id' })
  @IsString()
  @MaxLength(64)
  achievementId: string;

  @ApiProperty({ description: 'ISO timestamp of the unlock' })
  @IsDateString()
  unlockedAt: string;
}

export class SyncAchievementsDto {
  @ApiPropertyOptional({ description: 'Client-issued guest id when not logged in' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;

  @ApiProperty({ type: [AchievementUnlockDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AchievementUnlockDto)
  unlocks: AchievementUnlockDto[];
}
