'use client';

/**
 * ============================================================================
 * Dark dashboard primitives for the analytics UI.
 * ============================================================================
 * Hand-rolled SVG/CSS charts — no chart library dependency (same call the
 * public StatsSection made). Styling follows the dark full-dashboard
 * pattern: gray-950 canvas, gray-800 bordered cards, one accent hue per
 * dataset.
 * ============================================================================
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function Panel({
  title,
  hint,
  children,
  className = '',
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-800 bg-gray-900 p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-gray-600">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const ACCENTS = {
  cyan: 'bg-cyan-500/10 text-cyan-400',
  violet: 'bg-violet-500/10 text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-rose-500/10 text-rose-400',
  sky: 'bg-sky-500/10 text-sky-400',
} as const;

export type Accent = keyof typeof ACCENTS;

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'cyan',
  hint,
  deltaPct,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: Accent;
  hint?: string;
  deltaPct?: number | null;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <div className="mt-0.5 flex items-center gap-2">
        {typeof deltaPct === 'number' && Number.isFinite(deltaPct) && (
          <span
            className={`text-xs font-medium ${deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}%
          </span>
        )}
        {hint && <p className="truncate text-xs text-gray-600">{hint}</p>}
      </div>
    </div>
  );
}

export function BarList({
  rows,
  accent = 'bg-cyan-500/70',
  emptyText = 'No data yet.',
}: {
  rows: { label: string; value: number; meta?: string }[];
  accent?: string;
  emptyText?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-gray-600">{emptyText}</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-gray-400">{row.label}</span>
            <span className="ml-2 shrink-0 font-medium text-gray-200">
              {row.value.toLocaleString()}
              {row.meta && <span className="ml-1 font-normal text-gray-500">{row.meta}</span>}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full ${accent}`}
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Accuracy bar: 0–100% with tiered color. */
export function AccuracyBar({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null) {
    return (
      <div className="flex items-center justify-between py-1 text-xs text-gray-600">
        <span>{label}</span>
        <span>—</span>
      </div>
    );
  }
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="truncate text-gray-400">{label}</span>
        <span className="font-medium text-gray-200">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}

/**
 * Daily activity chart — dual SVG area/line (events + active users) with
 * hover tooltips. Zero-dependency; sized to its container via viewBox.
 */
export function DailyChart({
  series,
}: {
  series: { day: string; events: number; pageViews: number; activeUsers: number }[];
}) {
  if (series.length === 0) {
    return <p className="text-sm text-gray-600">No data in this window.</p>;
  }
  const W = 720;
  const H = 180;
  const PAD = 8;
  const maxEvents = Math.max(1, ...series.map((d) => d.events));
  const maxUsers = Math.max(1, ...series.map((d) => d.activeUsers));
  const x = (i: number) => PAD + (i / Math.max(1, series.length - 1)) * (W - 2 * PAD);
  const yEvents = (v: number) => H - PAD - (v / maxEvents) * (H - 2 * PAD);
  const yUsers = (v: number) => H - PAD - (v / maxUsers) * (H - 2 * PAD);

  const eventPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yEvents(d.events)}`)
    .join(' ');
  const eventArea = `${eventPath} L${x(series.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;
  const userPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yUsers(d.activeUsers)}`)
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + f * (H - 2 * PAD)}
            y2={PAD + f * (H - 2 * PAD)}
            stroke="#1f2937"
            strokeWidth="1"
          />
        ))}
        <path d={eventArea} fill="url(#eventsFill)" />
        <path d={eventPath} fill="none" stroke="#22d3ee" strokeWidth="2" />
        <path d={userPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
        {series.map((d, i) => (
          <rect
            key={d.day}
            x={x(i) - W / series.length / 2}
            y={0}
            width={W / series.length}
            height={H}
            fill="transparent"
          >
            <title>{`${d.day}: ${d.events.toLocaleString()} events · ${d.activeUsers.toLocaleString()} users · ${d.pageViews.toLocaleString()} views`}</title>
          </rect>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <span>{series[0]?.day}</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-cyan-400" /> Events
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-violet-400" /> Active users
          </span>
        </span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
    </div>
  );
}

/** Compact per-day bar chart (signups, logins). */
export function MiniBars({
  series,
  accent = 'bg-emerald-500/80',
}: {
  series: { day: string; count: number }[];
  accent?: string;
}) {
  const max = Math.max(1, ...series.map((d) => d.count));
  if (series.length === 0) return <p className="text-sm text-gray-600">No data.</p>;
  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {series.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count}`}
            className={`flex-1 rounded-t ${accent} hover:opacity-80`}
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-gray-600">
        <span>{series[0]?.day}</span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export function FunnelRow({
  label,
  value,
  max,
  accent,
  meta,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  /** Optional stage-to-stage conversion hint (e.g. "34%"). */
  meta?: string | undefined;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {label}
          {meta && <span className="ml-2 font-normal text-gray-500">· {meta} of previous</span>}
        </span>
        <span className="font-medium text-gray-200">
          {value.toLocaleString()} <span className="font-normal text-gray-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full ${accent}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function DarkTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ==================== Journey flow (owner reference 2026-09-05) ====================
// Vertical per-module journey columns under a shared TOTAL node: header card →
// stage cards with progress bars → "-N dropped" annotations → conversion %.

export interface JourneyStage {
  label: string;
  value: number;
}

interface JourneyAccent {
  border: string;
  text: string;
  bar: string;
}

/**
 * One journey column: `title` header card (count + share of total), then a
 * stage card per entry — bar filled as value/first-stage, pct under the bar,
 * "-N dropped" between stages that shrink. Ends with the stage-to-stage
 * conversion (last ÷ first).
 */
export function JourneyColumn({
  title,
  total,
  stages,
  accent,
}: {
  title: string;
  total: number;
  stages: JourneyStage[];
  accent: JourneyAccent;
}) {
  const top = stages[0]?.value ?? 0;
  const last = stages[stages.length - 1]?.value ?? 0;
  const sharePct = total > 0 ? Math.round((top / total) * 100) : 0;
  const convPct = top > 0 ? Math.round((last / top) * 100) : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      {/* Column header card */}
      <div
        className={`w-full rounded-lg border bg-gray-900/60 px-3 py-3 text-center ${accent.border}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>{title}</p>
        <p className="mt-1 text-2xl font-bold text-white">{top.toLocaleString()}</p>
        <p className={`text-xs ${accent.text}`}>{sharePct}% of total</p>
      </div>

      {/* Connector into the first stage */}
      <span className={`my-1 h-4 w-px ${accent.bar}`} aria-hidden />

      {/* Stage cards */}
      {stages.map((s, i) => {
        const pct = top > 0 ? Math.round((s.value / top) * 100) : 0;
        const prev = i > 0 ? stages[i - 1] : undefined;
        const dropped = prev ? Math.max(0, prev.value - s.value) : 0;
        return (
          <div key={s.label} className="w-full">
            {i > 0 && (
              <>
                {dropped > 0 && (
                  <p className="mb-0.5 text-center text-xs font-medium text-rose-400">
                    -{dropped.toLocaleString()} dropped
                  </p>
                )}
                <span className={`mx-auto mb-0.5 block h-4 w-px ${accent.bar}`} aria-hidden />
              </>
            )}
            <div className="rounded-lg bg-gray-900/80 px-3 py-2.5 text-center">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value.toLocaleString()}</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full ${accent.bar}`}
                  style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                />
              </div>
              <p className={`mt-1 text-xs ${accent.text}`}>{pct}%</p>
            </div>
          </div>
        );
      })}

      {/* Conversion footer */}
      <p className="mt-2 text-xs text-gray-500">Conversion</p>
      <p className="text-lg font-bold text-amber-400">{convPct}%</p>
    </div>
  );
}
