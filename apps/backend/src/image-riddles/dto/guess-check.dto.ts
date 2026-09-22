import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/** H1: server-side grading payload for image riddles. */
export class GuessCheckDto {
  @ApiProperty({ description: 'Image riddle id' })
  @IsUUID(undefined, { message: 'riddleId must be a valid id' })
  riddleId: string;

  @ApiProperty({ description: 'The typed guess' })
  @IsString()
  @IsNotEmpty({ message: 'guess is required' })
  @MaxLength(500)
  guess: string;
}

/** HARD-02 (H1): explicit give-up reveal — no guess required. */
export class RiddleRevealDto {
  @IsString()
  @IsNotEmpty()
  riddleId: string;
}
