import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * H1 (audit SEC-03): public guess-grading payload. Keeping the answer key off
 * public reads means the client must ask the server whether a guess was right.
 */
export class AnswerCheckDto {
  @ApiProperty({ description: 'Question id' })
  @IsUUID(undefined, { message: 'questionId must be a valid id' })
  questionId: string;

  @ApiProperty({ description: 'Selected letter (MCQ) or typed text (open-ended)' })
  @IsString()
  @IsNotEmpty({ message: 'answer is required' })
  @MaxLength(500)
  answer: string;
}
