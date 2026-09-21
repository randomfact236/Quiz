import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * SEC-08: chapter admin endpoints were typed inline, bypassing the global
 * ValidationPipe. Admin-only, but still validated now.
 */
export class CreateChapterDto {
  @ApiProperty({ example: 'World Capitals' })
  @IsString()
  @IsNotEmpty({ message: 'Chapter name is required' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Parent subject id' })
  @IsUUID(undefined, { message: 'subjectId must be a valid id' })
  subjectId: string;
}

export class UpdateChapterDto {
  @ApiPropertyOptional({ example: 'World Capitals' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Chapter name cannot be empty' })
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Parent subject id' })
  @IsOptional()
  @IsUUID(undefined, { message: 'subjectId must be a valid id' })
  subjectId?: string;
}
