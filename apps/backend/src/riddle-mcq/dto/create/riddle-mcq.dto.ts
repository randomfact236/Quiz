import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

import { RiddleStatus } from '../../entities/riddle-mcq.entity';

export class CreateRiddleMcqDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiProperty({ example: 'medium', description: 'Difficulty level: easy, medium, hard, expert' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

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
