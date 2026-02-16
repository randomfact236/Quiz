/**
 * ============================================================================
 * Image Riddles Update Helper
 * ============================================================================
 * Helper functions for updating image riddles to reduce service complexity
 * ============================================================================
 */

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { UpdateImageRiddleDto } from '../common/dto/base.dto';
import {
  IActionOption,
  applyActionDefaults,
  validateActionOption
} from './entities/image-riddle-action.entity';

/**
 * Update basic riddle fields from DTO
 * @param riddle - The riddle entity to update
 * @param dto - The update DTO
 * @returns The updated riddle
 */
export function updateBasicFields(riddle: ImageRiddle, dto: UpdateImageRiddleDto): ImageRiddle {
  if (dto.title !== undefined) {
    riddle.title = dto.title;
  }
  if (dto.imageUrl !== undefined) {
    riddle.imageUrl = dto.imageUrl;
  }
  if (dto.answer !== undefined) {
    riddle.answer = dto.answer;
  }
  if (dto.hint !== undefined) {
    riddle.hint = dto.hint;
  }
  if (dto.difficulty !== undefined) {
    riddle.difficulty = dto.difficulty;
  }
  if (dto.timerSeconds !== undefined) {
    riddle.timerSeconds = dto.timerSeconds;
  }
  if (dto.showTimer !== undefined) {
    riddle.showTimer = dto.showTimer;
  }
  if (dto.altText !== undefined) {
    riddle.altText = dto.altText;
  }
  if (dto.isActive !== undefined) {
    riddle.isActive = dto.isActive;
  }
  if (dto.useDefaultActions !== undefined) {
    riddle.useDefaultActions = dto.useDefaultActions;
  }
  return riddle;
}

/**
 * Update riddle category
 * @param riddle - The riddle entity to update
 * @param dto - The update DTO
 * @param categoryRepo - Category repository
 * @returns Promise resolving to updated riddle
 * @throws NotFoundException if category not found
 */
export async function updateCategory(
  riddle: ImageRiddle,
  dto: UpdateImageRiddleDto,
  categoryRepo: Repository<ImageRiddleCategory>
): Promise<ImageRiddle> {
  if (dto.categoryId === undefined) {
    return riddle;
  }

  if (dto.categoryId.length > 0) {
    const category = await categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    riddle.category = category;
  } else {
    (riddle as ImageRiddle & { category: null }).category = null;
    riddle.categoryId = null;
  }
  return riddle;
}

/**
 * Process and validate action options
 * @param actionOptions - Raw action options from DTO
 * @returns Processed action options or null
 * @throws Error if validation fails
 */
function processActionOptions(actionOptions?: IActionOption[]): IActionOption[] | null {
  if (!actionOptions || actionOptions.length === 0) {
    return null;
  }

  const now = new Date();
  const processedOptions = actionOptions.map(action => ({
    ...applyActionDefaults(action),
    createdAt: now,
    updatedAt: now,
  }));

  // Validate all actions
  for (const action of processedOptions) {
    const validation = validateActionOption(action);
    if (!validation.isValid) {
      throw new BadRequestException(`Action '${action.id}' validation failed: ${validation.errors.join(', ')}`);
    }
  }

  // Sort by order
  processedOptions.sort((a, b) => a.order - b.order);

  return processedOptions;
}

/**
 * Update riddle action options
 * @param riddle - The riddle entity to update
 * @param dto - The update DTO
 * @returns The updated riddle
 * @throws Error if action validation fails
 */
export function updateActionOptions(
  riddle: ImageRiddle,
  dto: UpdateImageRiddleDto
): ImageRiddle {
  if (dto.actionOptions === undefined) {
    return riddle;
  }

  riddle.actionOptions = processActionOptions(dto.actionOptions as any);
  return riddle;
}
