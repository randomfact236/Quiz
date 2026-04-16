import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class RiddleMcqPaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export { CreateRiddleCategoryDto } from './create/riddle-category.dto';
export { UpdateRiddleCategoryDto } from './update/riddle-category.dto';
export { CreateRiddleSubjectDto } from './create/riddle-subject.dto';
export { UpdateRiddleSubjectDto } from './update/riddle-subject.dto';
export { CreateRiddleMcqDto } from './create/riddle-mcq.dto';
export { UpdateRiddleMcqDto } from './update/riddle-mcq.dto';
export * from './create/bulk-create-riddle.dto';
