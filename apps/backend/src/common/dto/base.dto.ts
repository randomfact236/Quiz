import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({ example: ['London', 'Berlin', 'Madrid'] })
  @IsArray()
  @IsString({ each: true })
  wrongAnswers: string[];

  @ApiProperty({ example: 'easy', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level: string;

  @ApiProperty({ example: 'Paris is the capital and largest city of France.' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  chapterId: string;
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Science' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'science' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: '🔬' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiProperty({ example: 'academic', enum: ['academic', 'professional'] })
  @IsEnum(['academic', 'professional'])
  category: string;
}

export class CreateDadJokeDto {
  @ApiProperty({ example: 'Why don\'t scientists trust atoms? Because they make up everything!' })
  @IsString()
  @IsNotEmpty()
  joke: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  categoryId: string;
}

export class CreateRiddleDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'A piano' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ example: 'easy', enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  categoryId: string;
}

export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}