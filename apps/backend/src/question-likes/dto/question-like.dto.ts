import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { QuestionLikeContentType } from '../entities/question-like.entity';

export class CreateQuestionLikeDto {
  @ApiProperty({ enum: QuestionLikeContentType })
  @IsEnum(QuestionLikeContentType)
  contentType: QuestionLikeContentType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Client-issued guest identity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

export class MyQuestionLikeQueryDto {
  @ApiProperty({ enum: QuestionLikeContentType })
  @IsEnum(QuestionLikeContentType)
  contentType: QuestionLikeContentType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Client-issued guest identity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

export class QuestionLikeBucketsQueryDto {
  @ApiProperty({ enum: QuestionLikeContentType })
  @IsEnum(QuestionLikeContentType)
  @IsOptional()
  contentType?: QuestionLikeContentType;
}
