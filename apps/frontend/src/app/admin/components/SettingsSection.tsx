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

import { useState, useEffect, useMemo } from 'react';
import { SettingsService } from '@/services/settings.service';
import { ApiError } from '@/lib/api-client';
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
// Only settings with live runtime consumers are exposed here (the quiz and
// riddle level timers). Every other key in config/settings.ts currently has no
// reader — surfacing them let admins "save" values that changed nothing.
const SETTINGS_TABS = [
  { id: 'quiz-mcq' as const, label: 'Quiz MCQ', emoji: '📚' },
  { id: 'riddles' as const, label: 'Riddles', emoji: '🎭' },
];

/**
 * Get default timer value for quiz difficulty level (in seconds)
 */
function getDefaultTimerForLevel(level: string): number {
  switch (level) {
    case 'easy':
      return 30;
    case 'medium':
      return 45;
    case 'hard':
      return 60;
    case 'expert':
      return 90;
    case 'extreme':
      return 120;
    default:
      return 30;
  }
}

/**
 * Get default timer value for riddle difficulty level (in seconds)
 */
function getDefaultRiddleTimerForLevel(level: string): number {
  switch (level) {
    case 'easy':
      return 30;
    case 'medium':
      return 60;
    case 'hard':
      return 90;
    case 'expert':
      return 120;
    default:
      return 60;
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('quiz-mcq');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local form state - initialized when settings load
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  // Dirty tracking: warn before leaving with unsaved edits.
  const isDirty = useMemo(() => {
    if (!settings) return false;
    return JSON.stringify(formData) !== JSON.stringify(settings);
  }, [formData, settings]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const data = await SettingsService.getAdminSettings();
      setSettings(data);
      setFormData(JSON.parse(JSON.stringify(data))); // Deep copy for form
    } catch {
      setError('Failed to load settings');
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

      setSuccess('Settings saved successfully (may take up to a minute to reach players)');
      setSettings(formData as SystemSettings); // Update local "truth"
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save settings — please try again.'
      );
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
        if (!part) {
          continue;
        }
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
      <div
        className="p-8 text-center text-gray-500 dark:text-secondary-400"
        role="status"
        aria-live="polite"
      >
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center" role="alert" aria-live="assertive">
        <p className="text-red-500">{error || 'Error loading settings'}</p>
        <button
          onClick={() => void loadSettings()}
          className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Settings</h3>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          title={isDirty ? 'Save settings changes' : 'No changes to save'}
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
          className="rounded-lg bg-red-100 dark:bg-red-500/20 p-4 text-red-700 dark:text-red-300"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg bg-green-100 dark:bg-green-500/20 p-4 text-green-700 dark:text-green-300"
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
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`settings-panel-${tab.id}`}
            aria-label={tab.label}
          >
            <span className="mr-2" aria-hidden="true">
              {tab.emoji}
            </span>
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
        {/* Quiz Settings */}
        {activeTab === 'quiz-mcq' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold dark:text-gray-200">Quiz Configuration</h4>

            {/* Level-based Timer Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h5 className="text-md font-semibold mb-3 dark:text-gray-300">
                ⏱️ Timer Settings Per Difficulty Level (seconds)
              </h5>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mb-4">
                Set the default timer duration for each difficulty level in timer mode.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {(['easy', 'medium', 'hard', 'expert', 'extreme'] as const).map((level) => (
                  <div key={level}>
                    <label
                      htmlFor={`settings-timer-${level}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {level}
                    </label>
                    <input
                      id={`settings-timer-${level}`}
                      type="number"
                      value={
                        formData.quiz?.defaults?.levelTimers?.[level] ??
                        getDefaultTimerForLevel(level)
                      }
                      onChange={(e) =>
                        updateField(
                          `quiz.defaults.levelTimers.${level}`,
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min={5}
                      max={600}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-secondary-400">
                      {Math.floor(
                        (formData.quiz?.defaults?.levelTimers?.[level] ??
                          getDefaultTimerForLevel(level)) / 60
                      )}
                      m{' '}
                      {(formData.quiz?.defaults?.levelTimers?.[level] ??
                        getDefaultTimerForLevel(level)) % 60}
                      s
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'riddles' && (
          <div className="space-y-6">
            {/* Riddle Level-based Timer Settings */}
            <div>
              <h5 className="text-md font-semibold mb-3 dark:text-gray-300">
                ⏱️ Timer Settings Per Difficulty Level (seconds)
              </h5>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mb-4">
                Set the default timer duration for each difficulty level in riddle challenge mode.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {(['easy', 'medium', 'hard', 'expert'] as const).map((level) => (
                  <div key={level}>
                    <label
                      htmlFor={`settings-riddle-timer-${level}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {level}
                    </label>
                    <input
                      id={`settings-riddle-timer-${level}`}
                      type="number"
                      value={
                        formData.riddles?.defaults?.levelTimers?.[level] ??
                        getDefaultRiddleTimerForLevel(level)
                      }
                      onChange={(e) =>
                        updateField(
                          `riddles.defaults.levelTimers.${level}`,
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min={5}
                      max={600}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-secondary-400">
                      {Math.floor(
                        (formData.riddles?.defaults?.levelTimers?.[level] ??
                          getDefaultRiddleTimerForLevel(level)) / 60
                      )}
                      m{' '}
                      {(formData.riddles?.defaults?.levelTimers?.[level] ??
                        getDefaultRiddleTimerForLevel(level)) % 60}
                      s
                    </p>
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
