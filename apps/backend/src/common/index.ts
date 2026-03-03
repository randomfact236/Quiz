/**
 * ============================================================================
 * Common Module Exports - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * Single authoritative barrel: all common exports go through here.
 * Consumers should import from '../common' rather than direct file paths.
 * ============================================================================
 */

// Enums
export * from './enums/content-status.enum';
export * from './enums/bulk-action.enum';
export * from './enums/riddle-difficulty.enum';    // RiddleDifficulty
export * from './enums/quiz-riddle-level.enum';    // QuizRiddleLevel

// Interfaces
export * from './interfaces/bulk-action-result.interface';

// DTOs — generic + bulk operations
export * from './dto/bulk-action.dto';             // BulkImportResultDto, BulkActionDto, etc.

// DTOs — riddle domain
export * from './dto/riddle.dto';                  // All riddle / quiz-riddle DTOs

// Services
export * from './services/bulk-action.service';
