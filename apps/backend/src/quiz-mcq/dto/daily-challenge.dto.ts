import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/** NOW-08 Daily Challenge — client-local date ('YYYY-MM-DD') + result payload. */
export class SubmitDailyResultDto {
  @ApiProperty({ description: 'Client-local calendar date', example: '2026-09-23' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ description: 'Final score as computed by the shared client scorer' })
  @IsInt()
  @Min(0)
  @Max(100000)
  score: number;

  @ApiProperty({ description: 'Correctly answered questions' })
  @IsInt()
  @Min(0)
  @Max(50)
  correctCount: number;

  @ApiProperty({ description: 'Questions in the daily set' })
  @IsInt()
  @Min(1)
  @Max(50)
  total: number;

  @ApiPropertyOptional({ description: 'Client-issued guest id when not logged in' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;
}
