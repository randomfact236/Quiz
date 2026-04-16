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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  correctLetter: string;

  @ApiProperty({ example: 'medium', description: 'Difficulty level: easy, medium, hard, expert' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['easy', 'medium', 'hard', 'expert'])
  level: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  importOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}
