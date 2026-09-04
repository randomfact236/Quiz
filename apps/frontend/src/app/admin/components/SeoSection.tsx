'use client';

/**
 * ============================================================================
 * SeoSection — SEO Dashboard (plan/15-seo.md)
 * ============================================================================
 * Dark dashboard in the AnalyticsSection style:
 *   Dashboard       — hero with live SEO-score ring, GSC status panel, KPI
 *                     cards, per-module breakdown cards, filterable audit
 *                     table (missing-field chips) and SEO tools links.
 *   General         — site metadata (consumed by generateMetadata).
 *   Social Sharing  — default OG/Twitter fallbacks + per-platform overrides
 *                     with character budgets; fallback chain: page content →
 *                     platform override → global fallback → auto-generated image.
 *   Technical       — robots.txt / sitemap.xml reachability.
 * The active tab deep-links through ?section=seo&tab=… so the sidebar
 * sub-menu lands directly on it (mirrors the Analytics pattern).
 * All edits persist through PATCH /settings { seo } (admin-only).
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, RefreshCw, Save } from 'lucide-react';

import { adminApi, ApiError } from '@/lib/api-client';
import {
  SEO_GROUPS,
  auditRoute,
  buildAuditTargets,
  loadSitemapPaths,
  rowHealth,
  rowIssues,
  type SeoAuditRow,
  type SeoGroup,
} from '@/lib/seo-audit';
import { getErrorMessage, resolveMediaUrl, uploadMedia } from '@/lib/media-api';
import type { SeoSettings, SeoSocialOverride } from '@/types/settings.types';

/** Character budgets per platform. */
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

type SeoTab = 'dashboard' | 'general' | 'social' | 'technical';

/** Tabs — single source of truth, mirrored by the sidebar SEO sub-menu. */
export const SEO_TABS: { id: SeoTab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'general', label: 'General', emoji: '⚙️' },
  { id: 'social', label: 'Social Sharing', emoji: '📱' },
  { id: 'technical', label: 'Technical', emoji: '🛠️' },
];

type AuditRow = SeoAuditRow & { group: SeoGroup };

// ==================== Small UI atoms (dark) ====================

const inputCls =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30';

function Label({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </span>
  );
}

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
          <span key={platform} className={over ? 'font-semibold text-rose-400' : 'text-gray-500'}>
            {value.length}/{max} {platform}
          </span>
        );
      })}
    </span>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: 'cyan' | 'green' | 'amber' | 'rose';
  icon: React.ReactNode;
}): JSX.Element {
  const toneCls = {
    cyan: 'text-cyan-300',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  }[tone];
  const chipCls = {
    cyan: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  }[tone];
  return (
    <div className="rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800 transition-colors hover:ring-gray-600">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${toneCls}`}>{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${chipCls}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function GroupCard(
  props: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  } & {
    id: SeoGroup;
    label: string;
    emoji: string;
  }
): JSX.Element {
  const { label, emoji, total, healthy, warning, critical } = props;
  const pct = total > 0 ? Math.round((healthy / total) * 100) : 0;
  return (
    <div className="rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800 transition-colors hover:ring-gray-600">
      <h5 className="mb-3 flex items-center gap-2 font-semibold text-gray-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-base">
          {emoji}
        </span>
        {label}
      </h5>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Total</dt>
          <dd className="font-semibold text-gray-200">{total}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Healthy</dt>
          <dd className="font-semibold text-emerald-400">{healthy}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Warning (1 issue)</dt>
          <dd className="font-semibold text-amber-400">{warning}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Critical (2+ issues)</dt>
          <dd className="font-semibold text-rose-400">{critical}</dd>
        </div>
      </dl>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
          className="shrink-0 rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Choose'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 rounded-lg px-2 py-2 text-sm text-gray-500 hover:text-rose-400"
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
          className="mt-2 h-20 rounded-lg border border-gray-800 object-cover"
        />
      )}
      {fallbackNote && <span className="mt-1 block text-xs text-gray-500">{fallbackNote}</span>}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </div>
  );
}

// ==================== Main section ====================

export function SeoSection(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SeoTab>(
    (SEO_TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'dashboard') as SeoTab
  );
  const [form, setForm] = useState<FormState>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [robotsStatus, setRobotsStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);
  const [sitemapStatus, setSitemapStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);

  const [auditRows, setAuditRows] = useState<AuditRow[] | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [groupFilter, setGroupFilter] = useState<SeoGroup | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'issues' | 'healthy'>('all');

  // Sidebar sub-menu deep-links change only the ?tab= param while this section
  // is already mounted — follow the URL so the dashboard shows that tab.
  const urlTab = searchParams.get('tab');
  useEffect(() => {
    const match = SEO_TABS.find((t) => t.id === urlTab)?.id as SeoTab | undefined;
    if (match && match !== tab) setTab(match);
  }, [urlTab, tab]);

  /** Switch tab and keep the URL deep-link in sync (sidebar highlight follows). */
  const changeTab = useCallback(
    (next: SeoTab): void => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', 'seo');
      params.set('tab', next);
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

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

  const runAudit = useCallback(async (): Promise<void> => {
    setAuditing(true);
    setError(null);
    try {
      const sitemapPaths = await loadSitemapPaths();
      const targets = buildAuditTargets(sitemapPaths);
      const rows = await Promise.all(
        targets.map(async (t) => ({
          ...(await auditRoute(t.path, t.label, sitemapPaths)),
          group: t.group,
        }))
      );
      setAuditRows(rows);
    } finally {
      setAuditing(false);
    }
  }, []);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([load(), runAudit()]);
  }, [load, runAudit]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

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
    setForm((prev) => ({ ...prev, [platform]: { ...prev[platform], [key]: value } }));
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

  // Dashboard aggregates
  const stats = useMemo(() => {
    const rows = auditRows ?? [];
    const healthy = rows.filter((r) => rowHealth(r) === 'healthy').length;
    const warning = rows.filter((r) => rowHealth(r) === 'warning').length;
    const critical = rows.filter((r) => rowHealth(r) === 'critical').length;
    const score = rows.length > 0 ? Math.round((healthy / rows.length) * 100) : 0;
    const perGroup = SEO_GROUPS.map((g) => {
      const groupRows = rows.filter((r) => r.group === g.id);
      return {
        ...g,
        total: groupRows.length,
        healthy: groupRows.filter((r) => rowHealth(r) === 'healthy').length,
        warning: groupRows.filter((r) => rowHealth(r) === 'warning').length,
        critical: groupRows.filter((r) => rowHealth(r) === 'critical').length,
      };
    });
    return { total: rows.length, healthy, warning, critical, score, perGroup };
  }, [auditRows]);

  const filteredRows = useMemo(() => {
    let rows = auditRows ?? [];
    if (groupFilter !== 'all') rows = rows.filter((r) => r.group === groupFilter);
    if (healthFilter === 'issues') rows = rows.filter((r) => rowHealth(r) !== 'healthy');
    if (healthFilter === 'healthy') rows = rows.filter((r) => rowHealth(r) === 'healthy');
    return rows;
  }, [auditRows, groupFilter, healthFilter]);

  const groupCount = (id: SeoGroup | 'all'): number =>
    (auditRows ?? []).filter((r) => id === 'all' || r.group === id).length;

  const statusBadge = (status: 'checking' | 'ok' | 'fail' | null): JSX.Element => {
    if (status === 'ok') {
      return (
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          Reachable
        </span>
      );
    }
    if (status === 'fail') {
      return (
        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
          Unreachable
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-400">
        Checking…
      </span>
    );
  };

  const healthBadge = (health: 'healthy' | 'warning' | 'critical'): JSX.Element => {
    const map = {
      healthy: { label: 'Healthy', cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' },
      warning: { label: 'Warning', cls: 'bg-amber-500/10 text-amber-400 ring-amber-500/30' },
      critical: { label: 'Critical', cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/30' },
    }[health];
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${map.cls}`}>
        {map.label}
      </span>
    );
  };

  if (loading && !auditRows) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-gray-950 ring-1 ring-gray-800">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl bg-gray-950 p-5 ring-1 ring-gray-800">
      {/* ============ Hero ============ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 right-48 h-52 w-52 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Globe className="h-6 w-6" /> SEO Dashboard
            </h3>
            <p className="mt-0.5 text-sm text-white/85">
              Monitor SEO health across all your pages — titles, descriptions, structured data and
              images.
            </p>
          </div>
          <div className="flex items-center gap-4 self-start">
            {/* live score ring */}
            <div className="relative h-20 w-20" title={`SEO Score ${stats.score}%`}>
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${stats.score} ${100 - stats.score}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {stats.score}%
              </span>
            </div>
            <button
              onClick={() => void refreshAll()}
              disabled={auditing || loading}
              className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${auditing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-300 ring-1 ring-rose-500/30"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-300 ring-1 ring-emerald-500/30"
          role="status"
        >
          {success}
        </div>
      )}

      {/* ============ Tabs ============ */}
      <div
        className="flex gap-1 overflow-x-auto rounded-lg bg-gray-900/70 p-1"
        role="tablist"
        aria-label="SEO tabs"
      >
        {SEO_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
            }`}
            role="tab"
            aria-selected={tab === t.id}
          >
            <span aria-hidden="true" className="mr-1.5">
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== DASHBOARD ==================== */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          {/* GSC panel — honest placeholder until the P3 integration lands */}
          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-100">Google Search Console — Top Queries</h4>
                <p className="mt-0.5 text-xs text-gray-500">
                  What people searched on Google when they found your site.
                </p>
              </div>
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-400">
                Not connected
              </span>
            </div>
            <div className="mt-3 rounded-lg bg-amber-500/5 p-4 ring-1 ring-amber-500/30">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" /> Search Console data unavailable
              </p>
              <p className="mt-1 text-xs text-amber-200/70">
                No GSC service account is linked to this site. Once connected (plan/15 P3), this
                panel shows the top queries, clicks and impressions for your pages.
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Data source: Google Search Console API · property: not linked ·{' '}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                open GSC ↗
              </a>
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Pages"
              value={stats.total}
              tone="cyan"
              icon={<Globe className="h-6 w-6" />}
            />
            <KpiCard
              label="SEO Healthy"
              value={stats.healthy}
              tone="green"
              icon={<CheckCircle2 className="h-6 w-6" />}
            />
            <KpiCard
              label="Needs Attention"
              value={stats.warning + stats.critical}
              tone="amber"
              icon={<AlertTriangle className="h-6 w-6" />}
            />
            <KpiCard
              label="SEO Score"
              value={`${stats.score}%`}
              tone={stats.score >= 80 ? 'green' : stats.score >= 50 ? 'amber' : 'rose'}
              icon={<Globe className="h-6 w-6" />}
            />
          </div>

          {/* Per-group breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.perGroup.map((g) => (
              <GroupCard
                key={g.id}
                id={g.id}
                label={g.label}
                emoji={g.emoji}
                total={g.total}
                healthy={g.healthy}
                warning={g.warning}
                critical={g.critical}
              />
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['all', ...SEO_GROUPS.map((g) => g.id)] as const).map((id) => {
                const label =
                  id === 'all' ? 'All' : (SEO_GROUPS.find((g) => g.id === id)?.label ?? id);
                const active = groupFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setGroupFilter(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-900 text-gray-400 ring-1 ring-gray-800 hover:text-gray-200'
                    }`}
                  >
                    {label} ({groupCount(id)})
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 rounded-lg bg-gray-900 p-1 ring-1 ring-gray-800">
              {(['all', 'issues', 'healthy'] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => setHealthFilter(id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    healthFilter === id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {id === 'all' ? 'All' : id === 'issues' ? 'Issues Only' : 'Healthy Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Audit table */}
          <div className="overflow-x-auto rounded-xl bg-gray-900 ring-1 ring-gray-800">
            {auditing && auditRows === null ? (
              <div className="flex h-32 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/60 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Missing Fields</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => {
                    const health = rowHealth(row);
                    const issues = rowIssues(row);
                    return (
                      <tr
                        key={row.path}
                        className="border-b border-gray-800/60 transition-colors last:border-0 hover:bg-gray-950/60"
                      >
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <a
                            href={row.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-200 hover:text-cyan-400"
                          >
                            {row.label}
                          </a>
                          <span className="block max-w-[260px] truncate text-xs text-gray-500">
                            {row.path}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300">
                            {SEO_GROUPS.find((g) => g.id === row.group)?.emoji}{' '}
                            {SEO_GROUPS.find((g) => g.id === row.group)?.label ?? row.group}
                          </span>
                        </td>
                        <td className="px-4 py-3">{healthBadge(health)}</td>
                        <td className="px-4 py-3">
                          {issues.length === 0 ? (
                            <span className="text-xs text-emerald-400">None ✓</span>
                          ) : (
                            <span className="flex flex-wrap gap-1.5">
                              {issues.map((issue) => (
                                <span
                                  key={issue}
                                  className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30"
                                >
                                  {issue}
                                </span>
                              ))}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={row.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
                          >
                            open <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No pages match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* SEO tools */}
          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <h4 className="mb-3 font-semibold text-gray-100">SEO Tools &amp; Resources</h4>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Schema Validator', href: 'https://validator.schema.org/' },
                { label: 'Rich Results Test', href: 'https://search.google.com/test/rich-results' },
                { label: 'OpenGraph Debugger', href: 'https://www.opengraph.xyz/url/' },
                { label: 'View Sitemap', href: '/sitemap.xml' },
                { label: 'View robots.txt', href: '/robots.txt' },
              ].map((tool) => (
                <a
                  key={tool.label}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-gray-950 px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-800 transition-colors hover:text-cyan-300 hover:ring-cyan-500/40"
                >
                  {tool.label} <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              ))}
              <button
                onClick={() => changeTab('social')}
                className="flex items-center justify-between rounded-lg bg-gray-950 px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-800 transition-colors hover:text-cyan-300 hover:ring-cyan-500/40"
              >
                Social Sharing Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GENERAL ==================== */}
      {tab === 'general' && (
        <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
          <h4 className="mb-4 font-semibold text-gray-100">
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
        <div className="space-y-5">
          <p className="rounded-lg bg-cyan-500/5 px-4 py-3 text-xs text-cyan-200 ring-1 ring-cyan-500/30">
            Fallback chain: page content → platform override → global fallback → auto-generated
            image. Pages with their own content use it directly.
          </p>

          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <h4 className="mb-1 font-semibold text-gray-100">Default Fallbacks</h4>
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
          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <h4 className="font-semibold text-gray-100">Facebook</h4>
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
          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <h4 className="font-semibold text-gray-100">Twitter / X</h4>
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
          <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <h4 className="font-semibold text-gray-100">Google</h4>
            <p className="mb-4 text-xs text-gray-500">
              Optional overrides. Leave empty to use global defaults.
            </p>
            <label className="block">
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

      {/* ==================== TECHNICAL ==================== */}
      {tab === 'technical' && (
        <div className="rounded-xl bg-gray-900 p-5 ring-1 ring-gray-800">
          <h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-100">
            <Globe className="h-4 w-4 text-cyan-400" /> Technical SEO
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-gray-950 px-4 py-3 text-sm text-gray-300 ring-1 ring-gray-800 transition-colors hover:ring-cyan-500/40"
            >
              robots.txt {statusBadge(robotsStatus)}
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-gray-950 px-4 py-3 text-sm text-gray-300 ring-1 ring-gray-800 transition-colors hover:ring-cyan-500/40"
            >
              sitemap.xml {statusBadge(sitemapStatus)}
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            robots.txt and sitemap.xml are generated by the app (<code>app/robots.ts</code>,{' '}
            <code>app/sitemap.ts</code>) — subjects and image categories are included automatically
            from the live APIs.
          </p>
          <button
            onClick={() => void refreshAll()}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-3 w-3" /> Re-check status
          </button>
        </div>
      )}

      {/* Save bar for editing tabs */}
      {(tab === 'general' || tab === 'social') && (
        <div className="flex justify-end">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2 font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
