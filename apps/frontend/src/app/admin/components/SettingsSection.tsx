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

import { useState, useEffect, useMemo, useRef } from 'react';
import { SettingsService } from '@/services/settings.service';
import { ApiError } from '@/lib/api-client';
import { getErrorMessage, resolveMediaUrl, uploadMedia } from '@/lib/media-api';
import { BrandMark } from '@/components/BrandMark';
import type {
  SystemSettings,
  SettingsTab,
  SettingsValue,
  SiteSocialLinks,
} from '@/types/settings.types';

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
// Only settings with live runtime consumers are exposed here: the site
// branding group (header/footer/metadata/homepage banner) and the gameplay
// timers. Every other key in config/settings.ts currently has no reader —
// surfacing them let admins "save" values that changed nothing.
const SETTINGS_TABS = [
  { id: 'site' as const, label: 'Site Info', emoji: '🌐' },
  { id: 'quiz-mcq' as const, label: 'Quiz MCQ', emoji: '📚' },
  { id: 'riddles' as const, label: 'Riddles', emoji: '🎭' },
];

const SOCIAL_LINK_FIELDS: Array<{
  key: keyof SiteSocialLinks;
  label: string;
  placeholder: string;
}> = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://x.com/yourhandle' },
];

/**
 * One themed preview chip: renders the uploaded image (or the SVG placeholder
 * mark + site name) against a fixed light or dark background so the admin can
 * check brand assets in both themes regardless of the admin panel's own theme.
 */
function BrandPreviewChip({
  tone,
  label,
  previewUrl,
  alt,
  siteName,
  variant,
}: {
  tone: 'light' | 'dark';
  label: string;
  previewUrl: string | null;
  alt: string;
  siteName: string;
  variant: 'desktop' | 'mobile' | 'square';
}): JSX.Element {
  const onLight = tone === 'light';
  const displayName = siteName.trim() || 'Your Site Name';
  return (
    <div className="min-w-0 flex-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div
        className={`mt-1 flex items-center gap-2 overflow-hidden rounded-lg border px-3 ${
          variant === 'square' ? 'h-16 justify-center' : 'h-12'
        } ${onLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-950'}`}
      >
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt={`${alt} (${tone} mode preview)`}
            className={
              variant === 'square'
                ? 'h-11 w-11 rounded-xl object-contain'
                : variant === 'mobile'
                  ? 'h-7 w-7 rounded object-contain'
                  : 'max-h-9 max-w-full object-contain'
            }
          />
        ) : (
          <BrandMark
            size={variant === 'square' ? 44 : variant === 'mobile' ? 24 : 28}
            tone={onLight ? 'on-light' : 'on-dark'}
          />
        )}
        {variant !== 'square' && (
          <span
            className={`truncate font-bold ${variant === 'mobile' ? 'text-sm' : 'text-base'} ${
              onLight ? 'text-primary-700' : 'text-primary-300'
            }`}
          >
            {displayName}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Image setting field: media-library upload with live light/dark previews,
 * plus a manual URL/path input and a Remove button (empty value = not set).
 * `variant` picks the placeholder shape: desktop header logo (mark + site
 * name), mobile header (square placeholder + site name), or square favicon.
 */
function ImageSettingField({
  id,
  label,
  helpText,
  value,
  onChange,
  variant = 'logo',
  siteName = '',
}: {
  id: string;
  label: string;
  helpText: string;
  value: string;
  onChange: (url: string) => void;
  variant?: 'logo' | 'favicon';
  siteName?: string;
}): JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = resolveMediaUrl(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after a retry
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const asset = await uploadMedia(file, label);
      onChange(asset.url);
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <p className="mt-1 text-xs text-gray-500 dark:text-secondary-400">{helpText}</p>
      <div className="mt-3 space-y-3">
        {variant === 'logo' ? (
          <>
            <div className="flex gap-3">
              <BrandPreviewChip
                tone="light"
                label="Desktop · Light mode"
                previewUrl={previewUrl}
                alt={label}
                siteName={siteName}
                variant="desktop"
              />
              <BrandPreviewChip
                tone="dark"
                label="Desktop · Dark mode"
                previewUrl={previewUrl}
                alt={label}
                siteName={siteName}
                variant="desktop"
              />
            </div>
            <div className="flex gap-3">
              <BrandPreviewChip
                tone="light"
                label="Mobile · Light mode"
                previewUrl={previewUrl}
                alt={label}
                siteName={siteName}
                variant="mobile"
              />
              <BrandPreviewChip
                tone="dark"
                label="Mobile · Dark mode"
                previewUrl={previewUrl}
                alt={label}
                siteName={siteName}
                variant="mobile"
              />
            </div>
          </>
        ) : (
          <div className="flex gap-3">
            <BrandPreviewChip
              tone="light"
              label="Light mode"
              previewUrl={previewUrl}
              alt={label}
              siteName={siteName}
              variant="square"
            />
            <BrandPreviewChip
              tone="dark"
              label="Dark mode"
              previewUrl={previewUrl}
              alt={label}
              siteName={siteName}
              variant="square"
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {uploading ? 'Uploading…' : 'Choose Image'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Remove
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => void handleFile(e)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/uploads/logo.svg or https://…"
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        aria-label={`${label} URL`}
      />
      {uploadError && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('site');
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
        {/* Site Information */}
        {activeTab === 'site' && (
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold dark:text-gray-200">Site Information</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-secondary-400">
                Branding shown in the header, footer, browser tab, and homepage. Empty fields fall
                back to the built-in defaults.
              </p>
            </div>

            {/* Names */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="site-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Site Name
                </label>
                <input
                  id="site-name"
                  type="text"
                  value={formData.site?.siteName ?? ''}
                  onChange={(e) => updateField('site.siteName', e.target.value)}
                  placeholder="ProfitBenefit.com"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="site-tagline"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Browser Tab Tagline
                </label>
                <input
                  id="site-tagline"
                  type="text"
                  value={formData.site?.tabTagline ?? ''}
                  onChange={(e) => updateField('site.tabTagline', e.target.value)}
                  placeholder="best products"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-secondary-400">
                  Shown in the browser tab as &quot;Page | Tagline&quot;. Leave empty to use the
                  site name.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="site-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Site Description
              </label>
              <textarea
                id="site-description"
                value={formData.site?.siteDescription ?? ''}
                onChange={(e) => updateField('site.siteDescription', e.target.value)}
                rows={2}
                placeholder="find best product for you"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Brand images — logo and favicon grouped: both are image uploads
                previewed side-by-side in light and dark mode. */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <h5 className="text-md font-semibold mb-1 dark:text-gray-300">
                🖼️ Brand Images (Logo &amp; Favicon)
              </h5>
              <p className="mb-4 text-sm text-gray-500 dark:text-secondary-400">
                SVG, PNG, WebP, or JPG. Each preview shows exactly how the asset sits in light and
                dark mode; the text beside it is the Site Name above (live). Until an asset is
                uploaded, the SVG placeholder mark is shown everywhere the brand appears.
              </p>
              <div className="grid gap-8 sm:grid-cols-2">
                <ImageSettingField
                  id="site-logo"
                  label="Site Logo"
                  helpText="Whole (wide) logo shown on larger screens in the header and footer. The Site Name is rendered beside it."
                  variant="logo"
                  siteName={formData.site?.siteName ?? ''}
                  value={formData.site?.logo ?? ''}
                  onChange={(url) => updateField('site.logo', url)}
                />
                <ImageSettingField
                  id="site-favicon"
                  label="App Icon (Square)"
                  helpText="Square SVG/PNG, 192x192 or larger. Used as the compact icon in the mobile top bar, the mobile menu drawer, and the browser tab."
                  variant="favicon"
                  siteName={formData.site?.siteName ?? ''}
                  value={formData.site?.favicon ?? ''}
                  onChange={(url) => updateField('site.favicon', url)}
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <h5 className="text-md font-semibold mb-1 dark:text-gray-300">
                🔗 Social Media Links
              </h5>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mb-4">
                Full profile URLs. Footer icons appear only for the links you fill in — empty fields
                stay hidden.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {SOCIAL_LINK_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label
                      htmlFor={`social-${key}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {label}
                    </label>
                    <input
                      id={`social-${key}`}
                      type="text"
                      value={formData.site?.socialLinks?.[key] ?? ''}
                      onChange={(e) => updateField(`site.socialLinks.${key}`, e.target.value)}
                      placeholder={placeholder}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
