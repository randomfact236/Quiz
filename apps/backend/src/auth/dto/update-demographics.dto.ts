import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDemographicsDto {
  @ApiPropertyOptional({ description: 'User country' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'User gender', enum: ['male', 'female'] })
  @IsString()
  @IsIn(['male', 'female'])
  @IsOptional()
  sex?: 'male' | 'female';

  @ApiPropertyOptional({ description: 'User age group' })
  @IsString()
  @IsOptional()
  ageGroup?: string;
}