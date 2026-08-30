import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateQuizSessionDto {
  @ApiPropertyOptional({ description: 'Client-issued guest id when not logged in' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  chapterName?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsOptional()
  @IsString()
  @Length(3, 16)
  level?: string;

  @ApiPropertyOptional({ enum: ['quiz', 'challenge', 'practice'] })
  @IsOptional()
  @IsString()
  @Length(3, 16)
  mode?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(1000)
  totalQuestions: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(1000)
  correctCount: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100000)
  score: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100000)
  maxScore: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;
}
