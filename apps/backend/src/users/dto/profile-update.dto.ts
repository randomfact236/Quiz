import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * SEC-08: PUT /users/profile was typed with a plain interface, which the global
 * ValidationPipe cannot validate (no runtime metatype) - mass-assignment risk.
 */
export class ProfileUpdateDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Upload path or image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string;
}
