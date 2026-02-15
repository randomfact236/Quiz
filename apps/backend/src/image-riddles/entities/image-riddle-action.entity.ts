/**
 * ============================================================================
 * IMAGE RIDDLE ACTION OPTIONS - ENTERPRISE GRADE
 * ============================================================================
 * Quality Standards: 10/10 - Production Ready
 * 
 * Features:
 * - Type-safe action option structure
 * - Multiple action types (button, link, custom)
 * - Icon and styling support
 * - Analytics tracking metadata
 * - Accessibility compliance (ARIA labels)
 * - Conditional visibility rules
 * - Keyboard shortcut support
 * ============================================================================
 */

import {
  DEFAULT_ANIMATION_DURATION_MS,
  DEFAULT_SUBMIT_ANIMATION_DURATION_MS,
  DEFAULT_ACTION_ORDER,
  MAX_ACTION_ORDER,
  MAX_ANIMATION_DURATION_MS,
} from '../../common/constants/app.constants';

/**
 * Action Option Type - Defines the behavior of the action
 */
export type ActionOptionType = 'button' | 'link' | 'toggle' | 'dropdown' | 'custom';

/**
 * Action Option Style - Predefined visual styles
 */
export type ActionOptionStyle = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'ghost' 
  | 'outline';

/**
 * Action Option Size - Size variants
 */
export type ActionOptionSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Action Position - Where the action appears
 */
export type ActionPosition = 'below_question' | 'above_image' | 'below_image' | 'floating';

/**
 * Individual Action Option Interface
 */
export interface IActionOption {
  /** Unique identifier for the action */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Action type */
  type: ActionOptionType;
  
  /** Visual style */
  style: ActionOptionStyle;
  
  /** Size variant */
  size: ActionOptionSize;
  
  /** Icon identifier (emoji or icon name) */
  icon?: string;
  
  /** Icon position relative to label */
  iconPosition: 'left' | 'right' | 'only';
  
  /** Tooltip text on hover */
  tooltip?: string;
  
  /** ARIA label for accessibility */
  ariaLabel: string;
  
  /** Keyboard shortcut (e.g., 'Ctrl+H', 'Alt+1') */
  keyboardShortcut?: string;
  
  /** Whether the action is enabled */
  isEnabled: boolean;
  
  /** Whether the action is visible */
  isVisible: boolean;
  
  /** Position where action appears */
  position: ActionPosition;
  
  /** Display order (lower = first) */
  order: number;
  
  /** Action-specific payload/data */
  payload?: Record<string, unknown>;
  
  /** URL for link type actions */
  href?: string;
  
  /** Whether to open link in new tab */
  openInNewTab?: boolean;
  
  /** Handler function name (for custom actions) */
  handler?: string;
  
  /** Analytics event name */
  analyticsEvent?: string;
  
  /** Analytics metadata */
  analyticsMetadata?: Record<string, unknown>;
  
  /** Visibility conditions (JSON logic) */
  visibilityConditions?: {
    /** Show only when timer is running */
    showWhenTimerRunning?: boolean;
    /** Show only when timer is paused */
    showWhenTimerPaused?: boolean;
    /** Show only when time is up */
    showWhenTimeUp?: boolean;
    /** Show only when answer is revealed */
    showWhenAnswerRevealed?: boolean;
    /** Show only when answer is hidden */
    showWhenAnswerHidden?: boolean;
    /** Custom condition expression */
    customCondition?: string;
  };
  
  /** Animation settings */
  animation?: {
    /** Entrance animation */
    entrance?: 'fade' | 'slideUp' | 'slideDown' | 'scale' | 'bounce';
    /** Hover animation */
    hover?: 'pulse' | 'scale' | 'glow' | 'none';
    /** Click animation */
    click?: 'ripple' | 'press' | 'none';
    /** Animation duration in ms */
    duration: number;
    /** Animation delay in ms */
    delay: number;
  };
  
  /** Badge/notification settings */
  badge?: {
    /** Badge text */
    text?: string;
    /** Badge style */
    style: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Show badge count */
    count?: number;
    /** Maximum count to display (e.g., 99+) */
    maxCount?: number;
  };
  
  /** Confirmation dialog settings */
  confirmDialog?: {
    /** Whether to show confirmation */
    enabled: boolean;
    /** Dialog title */
    title?: string;
    /** Dialog message */
    message?: string;
    /** Confirm button text */
    confirmText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Confirm button style */
    confirmStyle?: ActionOptionStyle;
    /** Cancel button style */
    cancelStyle?: ActionOptionStyle;
  };
  
  /** Loading state settings */
  loading?: {
    /** Show loading spinner */
    showSpinner: boolean;
    /** Loading text */
    text?: string;
    /** Disable while loading */
    disableWhileLoading: boolean;
  };
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Default Action Options Presets
 */
export const DEFAULT_ACTION_PRESETS: Record<string, Partial<IActionOption>> = {
  /** Hint action - Shows hint when clicked */
  showHint: {
    id: 'show-hint',
    label: 'Show Hint',
    type: 'button',
    style: 'info',
    size: 'md',
    icon: '💡',
    iconPosition: 'left',
    ariaLabel: 'Show hint for this riddle',
    keyboardShortcut: 'Alt+H',
    position: 'below_question',
    order: 10,
    tooltip: 'Get a hint (Alt+H)',
    visibilityConditions: {
      showWhenAnswerHidden: true,
    },
    animation: {
      entrance: 'fade',
      hover: 'pulse',
      click: 'ripple',
      duration: DEFAULT_ANIMATION_DURATION_MS,
      delay: 0,
    },
    analyticsEvent: 'hint_revealed',
  },
  
  /** Skip action - Skip to next riddle */
  skip: {
    id: 'skip',
    label: 'Skip',
    type: 'button',
    style: 'ghost',
    size: 'md',
    icon: '⏭️',
    iconPosition: 'left',
    ariaLabel: 'Skip this riddle',
    keyboardShortcut: 'Alt+S',
    position: 'below_question',
    order: 20,
    tooltip: 'Skip to next riddle (Alt+S)',
    confirmDialog: {
      enabled: true,
      title: 'Skip Riddle?',
      message: 'Are you sure you want to skip this riddle? It will be marked as incomplete.',
      confirmText: 'Yes, Skip',
      cancelText: 'Keep Trying',
      confirmStyle: 'warning',
      cancelStyle: 'secondary',
    },
    analyticsEvent: 'riddle_skipped',
  },
  
  /** Reveal Answer action */
  revealAnswer: {
    id: 'reveal-answer',
    label: 'Reveal Answer',
    type: 'button',
    style: 'danger',
    size: 'md',
    icon: '👁️',
    iconPosition: 'left',
    ariaLabel: 'Reveal the answer',
    keyboardShortcut: 'Alt+A',
    position: 'below_question',
    order: 30,
    tooltip: 'Show the answer (Alt+A)',
    visibilityConditions: {
      showWhenAnswerHidden: true,
    },
    confirmDialog: {
      enabled: true,
      title: 'Give Up?',
      message: 'Revealing the answer will end your attempt. Are you sure?',
      confirmText: 'Yes, Show Answer',
      cancelText: 'Keep Trying',
      confirmStyle: 'danger',
      cancelStyle: 'secondary',
    },
    analyticsEvent: 'answer_revealed',
  },
  
  /** Submit Answer action */
  submitAnswer: {
    id: 'submit-answer',
    label: 'Check Answer',
    type: 'button',
    style: 'primary',
    size: 'lg',
    icon: '✓',
    iconPosition: 'left',
    ariaLabel: 'Submit your answer',
    keyboardShortcut: 'Enter',
    position: 'below_question',
    order: 5,
    tooltip: 'Check if your answer is correct (Enter)',
    visibilityConditions: {
      showWhenAnswerHidden: true,
    },
    animation: {
      entrance: 'slideUp',
      hover: 'scale',
      click: 'press',
      duration: DEFAULT_SUBMIT_ANIMATION_DURATION_MS,
      delay: 0,
    },
    loading: {
      showSpinner: true,
      text: 'Checking...',
      disableWhileLoading: true,
    },
    analyticsEvent: 'answer_submitted',
  },
  
  /** Reset Timer action */
  resetTimer: {
    id: 'reset-timer',
    label: 'Reset Timer',
    type: 'button',
    style: 'outline',
    size: 'sm',
    icon: '🔄',
    iconPosition: 'left',
    ariaLabel: 'Reset the timer',
    keyboardShortcut: 'Alt+R',
    position: 'below_question',
    order: 40,
    tooltip: 'Reset timer to full duration (Alt+R)',
    visibilityConditions: {
      showWhenTimerRunning: true,
    },
    confirmDialog: {
      enabled: true,
      title: 'Reset Timer?',
      message: 'This will reset the timer to its full duration. Continue?',
      confirmText: 'Reset',
      cancelText: 'Cancel',
    },
    analyticsEvent: 'timer_reset',
  },
  
  /** Pause Timer action */
  pauseTimer: {
    id: 'pause-timer',
    label: 'Pause',
    type: 'button',
    style: 'secondary',
    size: 'sm',
    icon: '⏸️',
    iconPosition: 'left',
    ariaLabel: 'Pause the timer',
    keyboardShortcut: 'Space',
    position: 'below_question',
    order: 45,
    tooltip: 'Pause the timer (Space)',
    visibilityConditions: {
      showWhenTimerRunning: true,
    },
    analyticsEvent: 'timer_paused',
  },
  
  /** Resume Timer action */
  resumeTimer: {
    id: 'resume-timer',
    label: 'Resume',
    type: 'button',
    style: 'success',
    size: 'sm',
    icon: '▶️',
    iconPosition: 'left',
    ariaLabel: 'Resume the timer',
    keyboardShortcut: 'Space',
    position: 'below_question',
    order: 46,
    tooltip: 'Resume the timer (Space)',
    visibilityConditions: {
      showWhenTimerPaused: true,
    },
    analyticsEvent: 'timer_resumed',
  },
  
  /** Fullscreen action */
  fullscreen: {
    id: 'fullscreen',
    label: 'Fullscreen',
    type: 'button',
    style: 'ghost',
    size: 'sm',
    icon: '⛶',
    iconPosition: 'only',
    ariaLabel: 'View image in fullscreen',
    keyboardShortcut: 'Alt+F',
    position: 'floating',
    order: DEFAULT_ACTION_ORDER,
    tooltip: 'Toggle fullscreen (Alt+F)',
    analyticsEvent: 'fullscreen_toggled',
  },
  
  /** Share action */
  share: {
    id: 'share',
    label: 'Share',
    type: 'dropdown',
    style: 'outline',
    size: 'md',
    icon: '🔗',
    iconPosition: 'left',
    ariaLabel: 'Share this riddle',
    keyboardShortcut: 'Alt+Shift+S',
    position: 'below_question',
    order: 50,
    tooltip: 'Share with friends (Alt+Shift+S)',
    payload: {
      options: ['copy_link', 'twitter', 'facebook', 'email'],
    },
    analyticsEvent: 'share_opened',
  },
  
  /** Report Issue action */
  report: {
    id: 'report',
    label: 'Report Issue',
    type: 'button',
    style: 'ghost',
    size: 'xs',
    icon: '🚩',
    iconPosition: 'left',
    ariaLabel: 'Report an issue with this riddle',
    position: 'below_question',
    order: MAX_ACTION_ORDER,
    tooltip: 'Report incorrect answer or image issue',
    confirmDialog: {
      enabled: true,
      title: 'Report Issue',
      message: 'Please describe the issue with this riddle:',
      confirmText: 'Submit Report',
      cancelText: 'Cancel',
    },
    analyticsEvent: 'issue_reported',
  },
};

/**
 * Validates required fields of an action option.
 * @private
 */
function validateRequiredFields(action: Partial<IActionOption>, errors: string[]): void {
  if (!action.id || action.id.trim().length === 0) {
    errors.push('Action ID is required');
  }
  if (!action.label || action.label.trim().length === 0) {
    errors.push('Action label is required');
  }
}

/**
 * Validates action type and style enums.
 * @private
 */
function validateEnums(action: Partial<IActionOption>, errors: string[]): void {
  const validTypes: ActionOptionType[] = ['button', 'link', 'toggle', 'dropdown', 'custom'];
  if (!action.type) {
    errors.push('Action type is required');
  } else if (!validTypes.includes(action.type)) {
    errors.push(`Invalid action type: ${action.type}`);
  }

  const validStyles: ActionOptionStyle[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'ghost', 'outline'];
  if (!action.style) {
    errors.push('Action style is required');
  } else if (!validStyles.includes(action.style)) {
    errors.push(`Invalid action style: ${action.style}`);
  }
}

/**
 * Validates accessibility and usability fields.
 * @private
 */
function validateAccessibility(action: Partial<IActionOption>, warnings: string[]): void {
  if (!action.ariaLabel || action.ariaLabel.trim().length === 0) {
    warnings.push('ARIA label is recommended for accessibility');
  }
}

/**
 * Validates type-specific requirements.
 * @private
 */
function validateTypeSpecific(action: Partial<IActionOption>, errors: string[]): void {
  if (action.type === 'link' && !action.href) {
    errors.push('Link type actions must have an href');
  }
}

/**
 * Validates animation settings.
 * @private
 */
function validateAnimation(action: Partial<IActionOption>, warnings: string[]): void {
  if (action.animation) {
    if (action.animation.duration < 0 || action.animation.duration > MAX_ANIMATION_DURATION_MS) {
      warnings.push('Animation duration should be 0-5000ms');
    }
  }
}

/**
 * Validates an action option structure for correctness.
 * 
 * @param action - Partial action option to validate
 * @returns Validation result with isValid flag, errors, and warnings
 */
export function validateActionOption(action: Partial<IActionOption>): { 
  isValid: boolean; 
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  validateRequiredFields(action, errors);
  validateEnums(action, errors);
  validateAccessibility(action, warnings);
  validateTypeSpecific(action, errors);
  validateAnimation(action, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Applies default values to a partial action option.
 * Ensures all required fields have valid values.
 * 
 * @param action - Partial action option
 * @returns Complete action option with defaults applied
 */
export function applyActionDefaults(action: Partial<IActionOption>): IActionOption {
  const now = new Date();
  
  return {
    id: action.id || `action-${Date.now()}`,
    label: action.label || 'Action',
    type: action.type || 'button',
    style: action.style || 'primary',
    size: action.size || 'md',
    icon: action.icon,
    iconPosition: action.iconPosition || 'left',
    ariaLabel: action.ariaLabel || action.label || 'Action button',
    isEnabled: action.isEnabled !== undefined ? action.isEnabled : true,
    isVisible: action.isVisible !== undefined ? action.isVisible : true,
    position: action.position || 'below_question',
    order: action.order ?? DEFAULT_ACTION_ORDER,
    payload: action.payload,
    href: action.href,
    openInNewTab: action.openInNewTab ?? false,
    handler: action.handler,
    keyboardShortcut: action.keyboardShortcut,
    tooltip: action.tooltip,
    analyticsEvent: action.analyticsEvent,
    analyticsMetadata: action.analyticsMetadata,
    visibilityConditions: action.visibilityConditions,
    animation: action.animation || {
      entrance: 'fade',
      hover: 'none',
      click: 'ripple',
      duration: DEFAULT_ANIMATION_DURATION_MS,
      delay: 0,
    },
    badge: action.badge,
    confirmDialog: action.confirmDialog,
    loading: action.loading || {
      showSpinner: false,
      disableWhileLoading: true,
    },
    createdAt: action.createdAt || now,
    updatedAt: now,
  };
}

/** Sorts action options by display order (ascending) */
export function sortActionOptions(actions: IActionOption[]): IActionOption[] {
  return [...actions].sort((a, b) => a.order - b.order);
}

/** Filters actions by position */
export function filterByPosition(actions: IActionOption[], position: ActionPosition): IActionOption[] {
  return actions.filter(a => a.position === position && a.isVisible);
}

/** Gets enabled and visible actions */
export function getEnabledActions(actions: IActionOption[]): IActionOption[] {
  return actions.filter(a => a.isEnabled && a.isVisible);
}
