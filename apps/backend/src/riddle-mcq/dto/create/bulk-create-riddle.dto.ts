import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsIn } from 'class-validator';

export class BulkCreateRiddleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  options: string[];

  @ApiPropertyOptional({
    description:
      'Correct option letter (A-D) for standard rows; omit for expert rows (text answer)',
  })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiProperty({ example: 'medium', description: 'Difficulty level: easy, medium, hard, expert' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['easy', 'medium', 'hard', 'expert'])
  level: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiPropertyOptional({ description: 'Existing subject ID (resolved by name when omitted)' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ description: 'Text answer (required for expert rows)' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'trash'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published', 'trash'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  importOrder?: number;
}
