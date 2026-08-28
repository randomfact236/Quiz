/**
 * ============================================================================
 * features/image-riddles/lib/default-actions.ts — local action presets
 * ============================================================================
 * Fallback action set for riddles without custom `actionOptions`, plus the
 * mapping from backend preset ids to frontend handlers.
 * ============================================================================
 */

import type { IActionOption } from '@/components/image-riddles/ActionOptions';
import type { ImageRiddle } from '@/lib/image-riddles-api';

import { UNSUPPORTED_ACTION_IDS } from './game';

function createCheckAnswerAction(now: Date): IActionOption {
  return {
    id: 'check-answer',
    label: 'Check Answer',
    type: 'button',
    style: 'primary',
    size: 'md',
    icon: '✓',
    iconPosition: 'left',
    ariaLabel: 'Check your answer',
    isEnabled: true,
    isVisible: true,
    position: 'below_question',
    order: 10,
    tooltip: 'Submit your answer',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'answer_checked',
    createdAt: now,
    updatedAt: now,
  };
}

function createHintAction(now: Date): IActionOption {
  return {
    id: 'show-hint',
    label: 'Hint',
    type: 'button',
    style: 'warning',
    size: 'md',
    icon: '💡',
    iconPosition: 'left',
    ariaLabel: 'Show hint',
    keyboardShortcut: 'Alt+H',
    isEnabled: true,
    isVisible: true,
    position: 'below_question',
    order: 20,
    tooltip: 'Get a hint (Alt+H)',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'hint_shown',
    createdAt: now,
    updatedAt: now,
  };
}

function createGiveUpAction(now: Date): IActionOption {
  return {
    id: 'give-up',
    label: 'Reveal',
    type: 'button',
    style: 'danger',
    size: 'md',
    icon: '👁️',
    iconPosition: 'left',
    ariaLabel: 'Reveal answer',
    keyboardShortcut: 'Alt+G',
    isEnabled: true,
    isVisible: true,
    position: 'below_question',
    order: 30,
    tooltip: 'Reveal the answer (Alt+G)',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'gave_up',
    createdAt: now,
    updatedAt: now,
  };
}

export function getDefaultActions(_riddle: ImageRiddle): IActionOption[] {
  const now = new Date();
  return [createCheckAnswerAction(now), createHintAction(now), createGiveUpAction(now)];
}

/**
 * Render-time action list: custom options or local defaults, minus actions
 * with no frontend handler, minus Hint when the riddle has no hint text.
 */
export function selectModalActions(riddle: ImageRiddle): IActionOption[] {
  const base = (riddle.actionOptions as unknown as IActionOption[]) || getDefaultActions(riddle);
  return base.filter(
    (a) => !UNSUPPORTED_ACTION_IDS.has(a.id) && (a.id !== 'show-hint' || Boolean(riddle.hint))
  );
}
