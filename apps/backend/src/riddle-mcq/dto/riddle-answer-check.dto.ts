import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/** H1: server-side grading payload for riddles. */
export class RiddleAnswerCheckDto {
  @ApiProperty({ description: 'Riddle id' })
  @IsUUID(undefined, { message: 'riddleId must be a valid id' })
  riddleId: string;

  @ApiProperty({ description: 'Selected letter (MCQ) or typed text (expert)' })
  @IsString()
  @IsNotEmpty({ message: 'answer is required' })
  @MaxLength(500)
  answer: string;
}

/** HARD-02 (H1): post-session review reveal — key for ONE riddle. */
export class RevealAnswerDto {
  @IsString()
  @IsNotEmpty()
  riddleId: string;
}
