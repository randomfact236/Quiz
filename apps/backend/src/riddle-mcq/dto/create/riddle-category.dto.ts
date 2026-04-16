import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRiddleCategoryDto {
  @ApiPropertyOptional({
    example: 'logic-puzzles',
    description: 'Unique slug (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Logic Puzzles', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🧩', description: 'Category emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

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
