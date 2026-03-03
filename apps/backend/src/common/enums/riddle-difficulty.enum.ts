/**
 * Classic riddle difficulty levels.
 *
 * The DB column is typed as a PostgreSQL enum using these values.
 * DTOs validate against this enum via @IsEnum(RiddleDifficulty).
 *
 * Important: Quiz riddles use a SEPARATE enum (QuizRiddleLevel) that
 * includes additional levels (extreme). Do not conflate the two.
 */
export enum RiddleDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert',
}
