import { IsOptional, ValidateNested, IsNumber, IsString, IsBoolean, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Pagination configuration DTO
 */
class PaginationConfigDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  defaultLimit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxLimit?: number;
}

/**
 * Cache configuration DTO
 */
class CacheConfigDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  defaultTtl?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriesTtl?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subjectsTtl?: number;

  @IsOptional()
  @IsString()
  allSubjectsKey?: string;
}

/**
 * Global settings section DTO
 */
class GlobalSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationConfigDto)
  pagination?: PaginationConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CacheConfigDto)
  cache?: CacheConfigDto;
}

/**
 * Dad jokes defaults DTO
 */
class DadJokesDefaultsDto {
  @IsOptional()
  @IsString()
  categoryEmoji?: string;
}

/**
 * Dad jokes cache DTO
 */
class DadJokesCacheDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriesTtl?: number;

  @IsOptional()
  @IsString()
  pattern?: string;
}

/**
 * Dad jokes settings DTO
 */
class DadJokesSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DadJokesDefaultsDto)
  defaults?: DadJokesDefaultsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DadJokesCacheDto)
  cache?: DadJokesCacheDto;
}

/**
 * Image riddles defaults DTO
 */
class ImageRiddlesDefaultsDto {
  @IsOptional()
  @IsString()
  categoryEmoji?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timerSeconds?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showTimer?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard', 'expert'])
  difficulty?: string;
}

/**
 * Image riddles timers DTO
 */
class ImageRiddlesTimersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  easy?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  medium?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hard?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expert?: number;
}

/**
 * Image riddles cache DTO
 */
class ImageRiddlesCacheDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriesTtl?: number;

  @IsOptional()
  @IsString()
  pattern?: string;
}

/**
 * Image riddles actions DTO
 */
class ImageRiddlesActionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultPresets?: string[];
}

/**
 * Image riddles settings DTO
 */
class ImageRiddlesSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageRiddlesDefaultsDto)
  defaults?: ImageRiddlesDefaultsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageRiddlesTimersDto)
  timers?: ImageRiddlesTimersDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficulties?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageRiddlesCacheDto)
  cache?: ImageRiddlesCacheDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageRiddlesActionsDto)
  actions?: ImageRiddlesActionsDto;
}

/**
 * Quiz defaults DTO
 */
class QuizDefaultsDto {
  // Add fields as needed
}

/**
 * Quiz cache DTO
 */
class QuizCacheDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subjectsTtl?: number;

  @IsOptional()
  @IsString()
  allSubjectsKey?: string;
}

/**
 * Quiz settings DTO
 */
class QuizSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDefaultsDto)
  defaults?: QuizDefaultsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficulties?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizCacheDto)
  cache?: QuizCacheDto;
}

/**
 * Riddles defaults DTO
 */
class RiddlesDefaultsDto {
  @IsOptional()
  @IsString()
  categoryEmoji?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;
}

/**
 * Riddles cache DTO
 */
class RiddlesCacheDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriesTtl?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subjectsTtl?: number;

  @IsOptional()
  @IsString()
  pattern?: string;
}

/**
 * Riddles settings DTO
 */
class RiddlesSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RiddlesDefaultsDto)
  defaults?: RiddlesDefaultsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficulties?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RiddlesCacheDto)
  cache?: RiddlesCacheDto;
}

/**
 * Settings update DTO with validation
 * 
 * @description Validates all incoming settings updates to ensure
 * only valid configuration values are accepted. Prevents injection
 * of invalid keys or malicious values.
 */
export class UpdateSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GlobalSettingsDto)
  global?: GlobalSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DadJokesSettingsDto)
  dadJokes?: DadJokesSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageRiddlesSettingsDto)
  imageRiddles?: ImageRiddlesSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizSettingsDto)
  quiz?: QuizSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RiddlesSettingsDto)
  riddles?: RiddlesSettingsDto;
}

/**
 * Whitelist of allowed top-level setting keys
 * Used for validating flat key-value updates
 */
export const ALLOWED_SETTING_KEYS = [
  'global',
  'dadJokes',
  'imageRiddles',
  'quiz',
  'riddles',
] as const;

export type AllowedSettingKey = typeof ALLOWED_SETTING_KEYS[number];

/**
 * Check if a key is in the allowed settings whitelist
 */
export function isValidSettingKey(key: string): key is AllowedSettingKey {
  return ALLOWED_SETTING_KEYS.includes(key as AllowedSettingKey);
}
