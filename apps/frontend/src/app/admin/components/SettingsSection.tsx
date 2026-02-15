/**
 * ============================================================================
 * SettingsSection Component
 * ============================================================================
 * Manages system-wide configuration settings including global settings,
 * quiz settings, dad jokes configuration, riddles configuration, and
 * image riddles configuration with tab-based navigation.
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { SettingsService } from '@/services/settings.service';
import type { SystemSettings, SettingsTab, SettingsValue } from '@/types/settings.types';

/**
 * Helper type for nested state updates
 * Uses a recursive index signature to allow deep property access
 */
type NestedSettingsObject = {
  [K in keyof Partial<SystemSettings>]: Partial<SystemSettings>[K] extends object
    ? Record<string, SettingsValue>
    : Partial<SystemSettings>[K];
} & Record<string, SettingsValue>;

/**
 * Settings tab configuration
 */
const SETTINGS_TABS = [
  { id: 'general' as const, label: 'General', emoji: '⚙️' },
  { id: 'quiz' as const, label: 'Quiz', emoji: '📚' },
  { id: 'jokes' as const, label: 'Dad Jokes', emoji: '😂' },
  { id: 'riddles' as const, label: 'Riddles', emoji: '🎭' },
  { id: 'imageRiddles' as const, label: 'Image Riddles', emoji: '🖼️' },
];

/**
 * Difficulty levels for image riddles timer configuration
 */
const DIFFICULTY_LEVELS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'expert', label: 'Expert' },
] as const;

/**
 * Get default timer value for a difficulty level
 */
function getDefaultTimerValue(level: string): number {
  switch (level) {
    case 'easy': return 30;
    case 'medium': return 60;
    case 'hard': return 90;
    case 'expert': return 120;
    default: return 60;
  }
}

/**
 * SettingsSection component for managing system configuration
 * @returns JSX.Element
 */
export function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local form state - initialized when settings load
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const data = await SettingsService.getSettings();
      setSettings(data);
      setFormData(JSON.parse(JSON.stringify(data))); // Deep copy for form
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await SettingsService.updateSettings(formData);

      setSuccess('Settings saved successfully');
      setSettings(formData as SystemSettings); // Update local "truth"
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Helper to update nested state
  const updateField = (path: string, value: unknown): void => {
    setFormData((prev: Partial<SystemSettings>) => {
      const newState: NestedSettingsObject = { ...prev } as NestedSettingsObject;
      const parts = path.split('.');
      let current: Record<string, SettingsValue> = newState;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!part) { continue; }
        if (!current[part]) {
          current[part] = {}; // Create nested object if it doesn't exist
        }
        current = current[part] as Record<string, SettingsValue>;
      }

      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        current[lastPart] = value as SettingsValue;
      }

      return newState as Partial<SystemSettings>;
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500" role="status" aria-live="polite">
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-red-500" role="alert" aria-live="assertive">
        Error loading settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          System Settings
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          aria-label={saving ? 'Saving settings' : 'Save settings changes'}
        >
          <span aria-hidden="true">{saving ? '⏳' : '💾'}</span>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div
          className="rounded-lg bg-red-100 p-4 text-red-700"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg bg-green-100 p-4 text-green-700"
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Settings tabs"
      >
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`settings-panel-${tab.id}`}
            aria-label={tab.label}
          >
            <span className="mr-2" aria-hidden="true">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800"
        role="tabpanel"
        id={`settings-panel-${activeTab}`}
        aria-label={`${activeTab} settings`}
      >
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">
              Global Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-default-limit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Pagination Limit
                </label>
                <input
                  id="settings-default-limit"
                  type="number"
                  value={formData.global?.pagination?.defaultLimit ?? 10}
                  onChange={(e) => updateField('global.pagination.defaultLimit', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-describedby="settings-default-limit-help"
                  min={1}
                  max={1000}
                />
                <p id="settings-default-limit-help" className="mt-1 text-xs text-gray-500">
                  Number of items to display per page by default
                </p>
              </div>
              <div>
                <label
                  htmlFor="settings-max-limit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Max Pagination Limit
                </label>
                <input
                  id="settings-max-limit"
                  type="number"
                  value={formData.global?.pagination?.maxLimit ?? 100}
                  onChange={(e) => updateField('global.pagination.maxLimit', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-describedby="settings-max-limit-help"
                  min={1}
                  max={1000}
                />
                <p id="settings-max-limit-help" className="mt-1 text-xs text-gray-500">
                  Maximum number of items allowed per page
                </p>
              </div>
              <div>
                <label
                  htmlFor="settings-cache-ttl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Cache TTL (seconds)
                </label>
                <input
                  id="settings-cache-ttl"
                  type="number"
                  value={formData.global?.cache?.defaultTtl ?? 3600}
                  onChange={(e) => updateField('global.cache.defaultTtl', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-describedby="settings-cache-ttl-help"
                  min={0}
                />
                <p id="settings-cache-ttl-help" className="mt-1 text-xs text-gray-500">
                  Time to live for cached data in seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Settings */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">
              Quiz Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-quiz-cache-ttl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Subjects Cache TTL (seconds)
                </label>
                <input
                  id="settings-quiz-cache-ttl"
                  type="number"
                  value={formData.quiz?.cache?.subjectsTtl ?? 3600}
                  onChange={(e) => updateField('quiz.cache.subjectsTtl', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min={0}
                />
              </div>
              <div>
                <label
                  htmlFor="settings-quiz-cache-key"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cache Key (All Subjects)
                </label>
                <input
                  id="settings-quiz-cache-key"
                  type="text"
                  value={formData.quiz?.cache?.allSubjectsKey ?? 'subjects:all'}
                  onChange={(e) => updateField('quiz.cache.allSubjectsKey', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dad Jokes Settings */}
        {activeTab === 'jokes' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">
              Dad Jokes Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-jokes-emoji"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category Emoji
                </label>
                <input
                  id="settings-jokes-emoji"
                  type="text"
                  value={formData.dadJokes?.defaults?.categoryEmoji ?? '😂'}
                  onChange={(e) => updateField('dadJokes.defaults.categoryEmoji', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  maxLength={10}
                />
              </div>
              <div>
                <label
                  htmlFor="settings-jokes-cache-ttl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cache TTL (seconds)
                </label>
                <input
                  id="settings-jokes-cache-ttl"
                  type="number"
                  value={formData.dadJokes?.cache?.categoriesTtl ?? 3600}
                  onChange={(e) => updateField('dadJokes.cache.categoriesTtl', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min={0}
                />
              </div>
            </div>
          </div>
        )}

        {/* Riddles Settings */}
        {activeTab === 'riddles' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">
              Riddles Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-riddles-emoji"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category Emoji
                </label>
                <input
                  id="settings-riddles-emoji"
                  type="text"
                  value={formData.riddles?.defaults?.categoryEmoji ?? '🧩'}
                  onChange={(e) => updateField('riddles.defaults.categoryEmoji', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  maxLength={10}
                />
              </div>
              <div>
                <label
                  htmlFor="settings-riddles-difficulty"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Difficulty
                </label>
                <select
                  id="settings-riddles-difficulty"
                  value={formData.riddles?.defaults?.difficulty ?? 'medium'}
                  onChange={(e) => updateField('riddles.defaults.difficulty', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Image Riddles Settings */}
        {activeTab === 'imageRiddles' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">
              Image Riddles Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-image-default-timer"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Timer (seconds)
                </label>
                <input
                  id="settings-image-default-timer"
                  type="number"
                  value={formData.imageRiddles?.defaults?.timerSeconds ?? 90}
                  onChange={(e) => updateField('imageRiddles.defaults.timerSeconds', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min={0}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Default time if not specified per riddle
                </p>
              </div>
              <div>
                <label
                  htmlFor="settings-image-emoji"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category Emoji
                </label>
                <input
                  id="settings-image-emoji"
                  type="text"
                  value={formData.imageRiddles?.defaults?.categoryEmoji ?? '🖼️'}
                  onChange={(e) => updateField('imageRiddles.defaults.categoryEmoji', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  maxLength={10}
                />
              </div>
              <div>
                <label
                  htmlFor="settings-image-cache-ttl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cache TTL (seconds)
                </label>
                <input
                  id="settings-image-cache-ttl"
                  type="number"
                  value={formData.imageRiddles?.cache?.categoriesTtl ?? 3600}
                  onChange={(e) => updateField('imageRiddles.cache.categoriesTtl', parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min={0}
                />
              </div>

              {/* Show Timer Toggle */}
              <div className="flex items-center space-x-3 pt-6 sm:col-span-2 lg:col-span-1">
                <input
                  type="checkbox"
                  id="settings-show-timer"
                  checked={formData.imageRiddles?.defaults?.showTimer ?? true}
                  onChange={(e) => updateField('imageRiddles.defaults.showTimer', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-describedby="settings-show-timer-help"
                />
                <label
                  htmlFor="settings-show-timer"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Show Timer
                </label>
              </div>
            </div>

            {/* Difficulty Timers */}
            <div className="col-span-full border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <h5 className="text-md font-semibold mb-3 dark:text-gray-300">
                Difficulty Timers
              </h5>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {DIFFICULTY_LEVELS.map((level) => (
                  <div key={level.key}>
                    <label
                      htmlFor={`settings-timer-${level.key}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {level.label} (seconds)
                    </label>
                    <input
                      id={`settings-timer-${level.key}`}
                      type="number"
                      value={
                        formData.imageRiddles?.timers?.[level.key] ??
                        getDefaultTimerValue(level.key)
                      }
                      onChange={(e) => updateField(`imageRiddles.timers.${level.key}`, parseInt(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min={0}
                      aria-label={`${level.label} difficulty timer in seconds`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
