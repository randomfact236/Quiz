import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordShareDto {
  @IsIn([
    'quiz-question',
    'riddle-question',
    'quiz-subject',
    'riddle-category',
    'image-riddle',
    'joke',
    'game',
    'home',
  ])
  contentType!: string;

  @IsString()
  @MaxLength(64)
  contentId!: string;

  @IsOptional()
  @IsIn(['facebook', 'x', 'whatsapp', 'linkedin', 'copy', 'other'])
  platform?: string;
}
