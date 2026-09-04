'use client';

/**
 * ============================================================================
 * SeoSection — full SEO admin (plan/15-seo.md)
 * ============================================================================
 * Tabs:
 *   General        — site metadata (consumed by the root layout's generateMetadata)
 *   Social Sharing — default OG/Twitter fallbacks + per-platform overrides with
 *                    character budgets (Facebook 60/110, Twitter 70/200, Google 155).
 *                    Fallback chain: page content → platform override → global
 *                    fallback → auto-generated image (app/opengraph-image.tsx).
 *   Pages          — live audit table: crawls the key routes and reports
 *                    title/description quality, robots, OG image, JSON-LD and
 *                    sitemap membership.
 *   Technical      — robots.txt / sitemap.xml reachability.
 * All edits persist through PATCH /settings { seo } (admin-only).
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Play, RefreshCw, Save } from 'lucide-react';

import { adminApi, ApiError } from '@/lib/api-client';
import {
  AUDIT_ROUTES,
  auditRoute,
  descriptionStatus,
  loadSitemapPaths,
  titleStatus,
  type SeoAuditRow,
} from '@/lib/seo-audit';
import { getErrorMessage, resolveMediaUrl, uploadMedia } from '@/lib/media-api';
import type { SeoSettings, SeoSocialOverride } from '@/types/settings.types';

/** Character budgets per platform (plan/15 Social Sharing). */
const LIMITS = {
  title: { facebook: 60, twitter: 70 },
  description: { facebook: 110, twitter: 200, google: 155 },
} as const;

type SocialForm = { image: string; title: string; description: string };

type FormState = {
  siteName: string;
  titleDefault: string;
  titleTemplate: string;
  description: string;
  keywordsText: string;
  ogImageUrl: string;
  twitterHandle: string;
  googleSiteVerification: string;
  facebook: SocialForm;
  twitter: SocialForm;
  googleDescription: string;
};

const EMPTY_SOCIAL: SocialForm = { image: '', title: '', description: '' };

const FALLBACK: FormState = {
  siteName: 'AI Quiz',
  titleDefault: 'AI Quiz - Interactive Learning Platform',
  titleTemplate: '%s | AI Quiz',
  description:
    'Enterprise-grade interactive quiz platform with science quizzes, dad jokes, riddles, and more. Test your knowledge and have fun!',
  keywordsText: 'quiz, trivia, science quiz, dad jokes, riddles, learning, education, interactive',
  ogImageUrl: '',
  twitterHandle: '',
  googleSiteVerification: '',
  facebook: { ...EMPTY_SOCIAL },
  twitter: { ...EMPTY_SOCIAL },
  googleDescription: '',
};

function toForm(seo: Partial<SeoSettings> | undefined): FormState {
  if (!seo) return { ...FALLBACK };
  const social = (o: Partial<SeoSocialOverride> | undefined): SocialForm => ({
    image: o?.image ?? '',
    title: o?.title ?? '',
    description: o?.description ?? '',
  });
  return {
    siteName: seo.siteName ?? FALLBACK.siteName,
    titleDefault: seo.titleDefault ?? FALLBACK.titleDefault,
    titleTemplate: seo.titleTemplate ?? FALLBACK.titleTemplate,
    description: seo.description ?? FALLBACK.description,
    keywordsText: (seo.keywords ?? []).join(', '),
    ogImageUrl: seo.ogImageUrl ?? '',
    twitterHandle: seo.twitterHandle ?? '',
    googleSiteVerification: seo.googleSiteVerification ?? '',
    facebook: social(seo.facebook),
    twitter: social(seo.twitter),
    googleDescription: seo.google?.description ?? '',
  };
}

type SeoTab = 'general' | 'social' | 'pages' | 'technical';
const TABS: { id: SeoTab; label: string; emoji: string }[] = [
  { id: 'general', label: 'General', emoji: '⚙️' },
  { id: 'social', label: 'Social Sharing', emoji: '📱' },
  { id: 'pages', label: 'Pages', emoji: '📄' },
  { id: 'technical', label: 'Technical', emoji: '🛠️' },
];

// ==================== Pages audit ====================

interface AuditRow extends SeoAuditRow {}

// ==================== Small UI atoms ====================

function CharCounts({
  value,
  limits,
}: {
  value: string;
  limits: { platform: string; max: number }[];
}): JSX.Element {
  return (
    <span className="flex flex-wrap gap-x-3 text-xs">
      {limits.map(({ platform, max }) => {
        const over = value.length > max;
        return (
          <span key={platform} className={over ? 'font-semibold text-red-500' : 'text-gray-400'}>
            {value.length}/{max} {platform}
          </span>
        );
      })}
    </span>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

function Label({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </span>
  );
}

/** URL input + "Choose" (upload via the media library) + clear. */
function ImageField({
  value,
  onChange,
  fallbackNote,
}: {
  value: string;
  onChange: (url: string) => void;
  fallbackNote?: string;
}): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File): Promise<void> => {
    setUploading(true);
    setError(null);
    try {
      const asset = await uploadMedia(file, 'SEO social share image');
      onChange(resolveMediaUrl(asset.url));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void choose(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {uploading ? 'Uploading…' : 'Choose'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 rounded-lg px-2 py-2 text-sm text-gray-400 hover:text-red-500"
            aria-label="Clear image"
          >
            ✕
          </button>
        )}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Share preview"
          className="mt-2 h-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
        />
      )}
      {fallbackNote && <span className="mt-1 block text-xs text-gray-400">{fallbackNote}</span>}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}

// ==================== Main section ====================

export function SeoSection(): JSX.Element {
  const [tab, setTab] = useState<SeoTab>('general');
  const [form, setForm] = useState<FormState>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [robotsStatus, setRobotsStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);
  const [sitemapStatus, setSitemapStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);

  // Pages audit state
  const [auditRows, setAuditRows] = useState<AuditRow[] | null>(null);
  const [auditing, setAuditing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<{ seo: Partial<SeoSettings> }>('/settings');
      setForm(toForm(res.data.seo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load SEO settings');
      setForm({ ...FALLBACK });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setRobotsStatus('checking');
    setSitemapStatus('checking');
    const check = async (path: string): Promise<'ok' | 'fail'> => {
      try {
        const res = await fetch(path);
        return res.ok ? 'ok' : 'fail';
      } catch {
        return 'fail';
      }
    };
    void (async () => {
      const [robots, sitemap] = await Promise.all([check('/robots.txt'), check('/sitemap.xml')]);
      if (!cancelled) {
        setRobotsStatus(robots);
        setSitemapStatus(sitemap);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const setSocial = (
    platform: 'facebook' | 'twitter',
    key: keyof SocialForm,
    value: string
  ): void => {
    setForm((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: value },
    }));
    setSuccess(null);
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const seo = {
        siteName: form.siteName.trim(),
        titleDefault: form.titleDefault.trim(),
        titleTemplate: form.titleTemplate.trim(),
        description: form.description.trim(),
        keywords: form.keywordsText
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        ogImageUrl: form.ogImageUrl.trim(),
        twitterHandle: form.twitterHandle.trim().replace(/^@/, ''),
        googleSiteVerification: form.googleSiteVerification.trim(),
        facebook: {
          image: form.facebook.image.trim(),
          title: form.facebook.title.trim(),
          description: form.facebook.description.trim(),
        },
        twitter: {
          image: form.twitter.image.trim(),
          title: form.twitter.title.trim(),
          description: form.twitter.description.trim(),
        },
        google: { description: form.googleDescription.trim() },
      };
      await adminApi.patch('/settings', { seo });
      setSuccess('SEO settings saved — pages pick them up on their next render.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const runAudit = useCallback(async (): Promise<void> => {
    setAuditing(true);
    setError(null);
    try {
      const sitemapPaths = await loadSitemapPaths();
      const rows = await Promise.all(
        AUDIT_ROUTES.map((r) => auditRoute(r.path, r.label, sitemapPaths))
      );
      setAuditRows(rows);
    } finally {
      setAuditing(false);
    }
  }, []);

  // Auto-run the audit the first time the Pages tab opens.
  useEffect(() => {
    if (tab === 'pages' && auditRows === null && !auditing) void runAudit();
  }, [tab, auditRows, auditing, runAudit]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  const summary = auditRows
    ? {
        ok: auditRows.filter(
          (r) =>
            !r.noindex &&
            r.title.length >= 30 &&
            r.title.length <= 65 &&
            r.description.length >= 110 &&
            r.description.length <= 165 &&
            r.ogImage &&
            r.jsonLd &&
            r.inSitemap !== false
        ).length,
        warn: auditRows.filter((r) => {
          const ok =
            !r.noindex &&
            r.title.length >= 30 &&
            r.title.length <= 65 &&
            r.description.length >= 110 &&
            r.description.length <= 165 &&
            r.ogImage &&
            r.jsonLd &&
            r.inSitemap !== false;
          return !ok && (r.title || r.description);
        }).length,
        fail: auditRows.filter((r) => !r.title || !r.description).length,
      }
    : null;

  const statusBadge = (status: 'checking' | 'ok' | 'fail' | null): JSX.Element => {
    if (status === 'ok') {
      return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
          Reachable
        </span>
      );
    }
    if (status === 'fail') {
      return (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
          Unreachable
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        Checking…
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Save */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SEO</h3>
        {tab !== 'pages' && tab !== 'technical' && (
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          role="status"
        >
          {success}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800/60"
        role="tablist"
        aria-label="SEO tabs"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            role="tab"
            aria-selected={tab === t.id}
          >
            <span aria-hidden="true">{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ==================== GENERAL ==================== */}
      {tab === 'general' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h4 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">
            Site metadata{' '}
            <span className="text-xs font-normal text-gray-500">
              (rendered into every page&apos;s meta tags)
            </span>
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>Site name</Label>
              <input
                className={inputCls}
                value={form.siteName}
                onChange={(e) => set('siteName', e.target.value)}
                maxLength={80}
              />
            </label>
            <label className="block">
              <Label>Title template (%s = page title)</Label>
              <input
                className={inputCls}
                value={form.titleTemplate}
                onChange={(e) => set('titleTemplate', e.target.value)}
                maxLength={120}
              />
            </label>
            <label className="block sm:col-span-2">
              <Label>Default title</Label>
              <input
                className={inputCls}
                value={form.titleDefault}
                onChange={(e) => set('titleDefault', e.target.value)}
                maxLength={120}
              />
              <span className="mt-1 block">
                <CharCounts
                  value={form.titleDefault}
                  limits={[
                    { platform: 'Facebook', max: LIMITS.title.facebook },
                    { platform: 'Twitter', max: LIMITS.title.twitter },
                  ]}
                />
              </span>
            </label>
            <label className="block sm:col-span-2">
              <Label>Meta description</Label>
              <textarea
                className={`${inputCls} min-h-[72px]`}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                maxLength={320}
              />
              <span className="mt-1 block">
                <CharCounts
                  value={form.description}
                  limits={[
                    { platform: 'Facebook', max: LIMITS.description.facebook },
                    { platform: 'Twitter', max: LIMITS.description.twitter },
                    { platform: 'Google', max: LIMITS.description.google },
                  ]}
                />
              </span>
            </label>
            <label className="block sm:col-span-2">
              <Label>Keywords (comma-separated)</Label>
              <input
                className={inputCls}
                value={form.keywordsText}
                onChange={(e) => set('keywordsText', e.target.value)}
              />
            </label>
            <label className="block">
              <Label>Twitter handle</Label>
              <input
                className={inputCls}
                value={form.twitterHandle}
                onChange={(e) => set('twitterHandle', e.target.value)}
                placeholder="@yourbrand"
              />
            </label>
            <label className="block">
              <Label>Google Search Console verification token</Label>
              <input
                className={inputCls}
                value={form.googleSiteVerification}
                onChange={(e) => set('googleSiteVerification', e.target.value)}
                placeholder="google-site-verification code"
              />
            </label>
          </div>
        </div>
      )}

      {/* ==================== SOCIAL SHARING ==================== */}
      {tab === 'social' && (
        <div className="space-y-6">
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Fallback chain: page content → platform override → global fallback → auto-generated
            image. Pages with their own content use it directly.
          </p>

          {/* Default fallbacks */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
            <h4 className="mb-1 font-semibold text-gray-800 dark:text-gray-100">
              Default Fallbacks
            </h4>
            <p className="mb-4 text-xs text-gray-500">
              Used when a platform-specific override isn&apos;t set and the page doesn&apos;t have
              its own content.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <Label>Default Share Image</Label>
                <ImageField
                  value={form.ogImageUrl}
                  onChange={(url) => set('ogImageUrl', url)}
                  fallbackNote="Leave empty to use the auto-generated brand card"
                />
              </label>
              <label className="block">
                <Label>Default Title</Label>
                <input
                  className={inputCls}
                  value={form.titleDefault}
                  onChange={(e) => set('titleDefault', e.target.value)}
                  maxLength={120}
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.titleDefault}
                    limits={[
                      { platform: 'Facebook', max: LIMITS.title.facebook },
                      { platform: 'Twitter', max: LIMITS.title.twitter },
                    ]}
                  />
                </span>
              </label>
              <div />
              <label className="block sm:col-span-2">
                <Label>Default Description</Label>
                <textarea
                  className={`${inputCls} min-h-[72px]`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  maxLength={320}
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.description}
                    limits={[
                      { platform: 'Facebook', max: LIMITS.description.facebook },
                      { platform: 'Twitter', max: LIMITS.description.twitter },
                      { platform: 'Google', max: LIMITS.description.google },
                    ]}
                  />
                </span>
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-500">Platform overrides below take priority.</p>
          </div>

          {/* Facebook */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Facebook</h4>
            <p className="mb-4 text-xs text-gray-500">
              Optional overrides. Leave empty to use global defaults.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>Image</Label>
                <ImageField
                  value={form.facebook.image}
                  onChange={(url) => setSocial('facebook', 'image', url)}
                  fallbackNote="Falls back to the default share image"
                />
              </label>
              <div />
              <label className="block">
                <Label>Title Override</Label>
                <input
                  className={inputCls}
                  value={form.facebook.title}
                  onChange={(e) => setSocial('facebook', 'title', e.target.value)}
                  maxLength={120}
                  placeholder="Leave empty for global title"
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.facebook.title}
                    limits={[{ platform: 'Facebook', max: LIMITS.title.facebook }]}
                  />
                </span>
              </label>
              <label className="block">
                <Label>Description Override</Label>
                <textarea
                  className={`${inputCls} min-h-[72px]`}
                  value={form.facebook.description}
                  onChange={(e) => setSocial('facebook', 'description', e.target.value)}
                  maxLength={320}
                  placeholder="Leave empty for global description"
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.facebook.description}
                    limits={[{ platform: 'Facebook', max: LIMITS.description.facebook }]}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Twitter / X */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Twitter / X</h4>
            <p className="mb-4 text-xs text-gray-500">
              Optional overrides. Leave empty to use global defaults.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>Image</Label>
                <ImageField
                  value={form.twitter.image}
                  onChange={(url) => setSocial('twitter', 'image', url)}
                  fallbackNote="Falls back to the Facebook image, then the default share image"
                />
              </label>
              <div />
              <label className="block">
                <Label>Title Override</Label>
                <input
                  className={inputCls}
                  value={form.twitter.title}
                  onChange={(e) => setSocial('twitter', 'title', e.target.value)}
                  maxLength={120}
                  placeholder="Leave empty for global title"
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.twitter.title}
                    limits={[{ platform: 'Twitter', max: LIMITS.title.twitter }]}
                  />
                </span>
              </label>
              <label className="block">
                <Label>Description Override</Label>
                <textarea
                  className={`${inputCls} min-h-[72px]`}
                  value={form.twitter.description}
                  onChange={(e) => setSocial('twitter', 'description', e.target.value)}
                  maxLength={320}
                  placeholder="Leave empty for global description"
                />
                <span className="mt-1 block">
                  <CharCounts
                    value={form.twitter.description}
                    limits={[{ platform: 'Twitter', max: LIMITS.description.twitter }]}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Google */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Google</h4>
            <p className="mb-4 text-xs text-gray-500">
              Optional overrides. Leave empty to use global defaults.
            </p>
            <label className="block sm:col-span-2">
              <Label>Description Override</Label>
              <textarea
                className={`${inputCls} min-h-[72px]`}
                value={form.googleDescription}
                onChange={(e) => set('googleDescription', e.target.value)}
                maxLength={320}
                placeholder="Leave empty for global description"
              />
              <span className="mt-1 block">
                <CharCounts
                  value={form.googleDescription}
                  limits={[{ platform: 'Google', max: LIMITS.description.google }]}
                />
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ==================== PAGES (audit table) ==================== */}
      {tab === 'pages' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Pages overview</h4>
            <button
              onClick={() => void runAudit()}
              disabled={auditing}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {auditing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {auditing ? 'Auditing…' : 'Run audit'}
            </button>
          </div>

          {summary && (
            <p className="mb-3 text-xs text-gray-500">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {summary.ok} fully optimized
              </span>
              {' · '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {summary.warn} with warnings
              </span>
              {' · '}
              <span className="font-semibold text-red-500">{summary.fail} failing</span>
              {' · '}Title 30–65 chars, description 110–165 chars, OG image, JSON-LD, in sitemap.
            </p>
          )}

          {auditing && auditRows === null ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : auditRows ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                    <th className="py-2 pr-3">Page</th>
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Robots</th>
                    <th className="py-2 pr-3">OG image</th>
                    <th className="py-2 pr-3">JSON-LD</th>
                    <th className="py-2">In sitemap</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((row) => {
                    const titleOk = titleStatus(row.title) === 'ok';
                    const descOk = descriptionStatus(row.description) === 'ok';
                    return (
                      <tr
                        key={row.path}
                        className="border-b border-gray-100 align-top dark:border-gray-800"
                      >
                        <td className="py-2 pr-3">
                          <a
                            href={row.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-700 hover:text-blue-600 dark:text-gray-200"
                          >
                            {row.label}
                          </a>
                          <span className="block text-xs text-gray-400">{row.path}</span>
                        </td>
                        <td className="py-2 pr-3">
                          {row.title ? (
                            <>
                              <span
                                className={
                                  titleOk
                                    ? 'text-gray-700 dark:text-gray-200'
                                    : 'text-amber-600 dark:text-amber-400'
                                }
                              >
                                {row.title}
                              </span>
                              <span
                                className={`block text-xs ${titleOk ? 'text-gray-400' : 'text-amber-500'}`}
                              >
                                {row.title.length} chars {titleOk ? '✓' : '(aim 30–65)'}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-red-500">missing</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.description ? (
                            <>
                              <span
                                className={`block max-w-[240px] truncate ${descOk ? 'text-gray-600 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'}`}
                              >
                                {row.description}
                              </span>
                              <span
                                className={`block text-xs ${descOk ? 'text-gray-400' : 'text-amber-500'}`}
                              >
                                {row.description.length} chars {descOk ? '✓' : '(aim 110–165)'}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-red-500">missing</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.noindex ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              noindex
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                              index
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">{row.ogImage ? '✅' : '⚠️'}</td>
                        <td className="py-2 pr-3">{row.jsonLd ? '✅' : '⚠️'}</td>
                        <td className="py-2">
                          {row.inSitemap === null ? '—' : row.inSitemap ? '✅' : '⚠️'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Press “Run audit” to crawl the key routes.
            </p>
          )}
        </div>
      )}

      {/* ==================== TECHNICAL ==================== */}
      {tab === 'technical' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
            <Globe className="h-4 w-4" /> Technical SEO
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                robots.txt <span className="opacity-50">↗</span>
              </span>
              {statusBadge(robotsStatus)}
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                sitemap.xml <span className="opacity-50">↗</span>
              </span>
              {statusBadge(sitemapStatus)}
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            robots.txt and sitemap.xml are generated by the app (<code>app/robots.ts</code>,{' '}
            <code>app/sitemap.ts</code>) — subjects and image categories are included automatically
            from the live APIs.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-3 w-3" /> Re-check status
          </button>
        </div>
      )}
    </div>
  );
}
