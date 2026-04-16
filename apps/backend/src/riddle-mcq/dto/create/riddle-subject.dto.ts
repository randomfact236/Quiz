import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRiddleSubjectDto {
  @ApiPropertyOptional({
    example: 'brain-teasers',
    description: 'Unique slug (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Brain Teasers', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🧠', description: 'Subject emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
