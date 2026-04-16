import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

import { RiddleStatus } from '../../entities/riddle-mcq.entity';

export class UpdateRiddleMcqDto {
  @ApiPropertyOptional({ example: 'What has keys but no locks?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiPropertyOptional({
    example: 'medium',
    description: 'Difficulty level: easy, medium, hard, expert',
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'Think about something you might find on a desk' })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional({ example: 'A piano has musical keys but no locks' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'A piano' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({
    example: RiddleStatus.DRAFT,
    enum: RiddleStatus,
    description: 'Riddle status',
  })
  @IsOptional()
  @IsEnum(RiddleStatus)
  status?: RiddleStatus;
}
