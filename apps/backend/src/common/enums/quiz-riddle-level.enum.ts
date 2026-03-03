/**
 * Quiz riddle difficulty levels.
 *
 * The DB column is typed as a PostgreSQL enum using these values.
 * DTOs validate against this enum via @IsEnum(QuizRiddleLevel).
 *
 * Important: Classic riddles use a SEPARATE enum (RiddleDifficulty) that
 * only includes easy | medium | hard. Do not use these extra levels for classic riddles.
 */
export enum QuizRiddleLevel {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert',
    EXTREME = 'extreme',
}
