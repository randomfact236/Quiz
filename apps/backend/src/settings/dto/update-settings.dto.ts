import { Type } from 'class-transformer';
import {
  IsOptional,
  ValidateNested,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/** Gameplay timers must be sane seconds — negatives flow straight into countdowns. */
const TIMER_MIN = 5;
const TIMER_MAX = 3600;

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
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  easy?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  medium?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  hard?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
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
class QuizLevelTimersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  easy?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  medium?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  hard?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  expert?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  extreme?: number;
}

class QuizDefaultsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => QuizLevelTimersDto)
  levelTimers?: QuizLevelTimersDto;
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
class RiddlesLevelTimersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  easy?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  medium?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  hard?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(TIMER_MIN)
  @Max(TIMER_MAX)
  expert?: number;
}

class RiddlesDefaultsDto {
  @IsOptional()
  @IsString()
  categoryEmoji?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RiddlesLevelTimersDto)
  levelTimers?: RiddlesLevelTimersDto;
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
 * Social media profile links DTO (full URLs; empty = icon hidden in footer).
 * Kept as plain length-validated strings — the rendering layer normalizes and
 * only emits http(s) links, so partial input like "facebook.com/yourpage" is
 * accepted here.
 */
class SocialLinksDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  facebook?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tiktok?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  youtube?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  twitter?: string;
}

/**
 * Site Information settings DTO (branding: names, logo, favicon, banner, socials)
 */
class SiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  siteDescription?: string;

  /** /uploads/... path or absolute URL */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  logo?: string;

  /** /uploads/... path or absolute URL */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  favicon?: string;

  /** Browser tab "Page | Tagline" */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tabTagline?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}

/**
 * Per-platform social-card override DTO (empty string = use global fallback)
 */
class SeoPlatformOverrideDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class SeoGoogleOverrideDto {
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * SEO metadata settings DTO
 */
class SeoSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  titleDefault?: string;

  @IsOptional()
  @IsString()
  titleTemplate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  googleSiteVerification?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoPlatformOverrideDto)
  facebook?: SeoPlatformOverrideDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoPlatformOverrideDto)
  twitter?: SeoPlatformOverrideDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoGoogleOverrideDto)
  google?: SeoGoogleOverrideDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => SiteSettingsDto)
  site?: SiteSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seo?: SeoSettingsDto;
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
  'site',
  'seo',
] as const;

export type AllowedSettingKey = (typeof ALLOWED_SETTING_KEYS)[number];

/**
 * Check if a key is in the allowed settings whitelist
 */
export function isValidSettingKey(key: string): key is AllowedSettingKey {
  return ALLOWED_SETTING_KEYS.includes(key as AllowedSettingKey);
}
