'use client';

/**
 * ============================================================================
 * Tab content components for the analytics dashboard.
 * ============================================================================
 * One component per admin tab. All data comes from the single dashboard
 * payload (`AdminDashboard`) + the retention/funnel/clicks endpoints; each tab
 * also exposes its primary dataset for the header's CSV export via
 * `exportRowsForTab`.
 * ============================================================================
 */

import { useEffect, useState } from 'react';

import {
  Activity,
  Eye,
  FileQuestion,
  Flag,
  Laugh,
  Lightbulb,
  ListChecks,
  Lock,
  MapPin,
  MousePointerClick,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

import { adminApi } from '@/lib/api-client';

import type {
  AdminDashboard,
  ModuleDashboard,
  RetentionCohort,
  ConversionFunnel,
  ClickAnalysis,
} from './types';
import {
  AccuracyBar,
  BarList,
  DailyChart,
  DarkTable,
  FunnelRow,
  JourneyColumn,
  KpiCard,
  MiniBars,
  Panel,
} from './primitives';

export interface TabProps {
  data: AdminDashboard;
}

const n = (v: number | null | undefined): string => (v ?? 0).toLocaleString();

/** Delta vs the previous window, in percent (null when unknowable). */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Stage-to-stage funnel conversion, e.g. "34%" (— when the source stage is 0). */
function stepPct(from: number, to: number): string {
  return from > 0 ? `${Math.round((to / from) * 100)}%` : '—';
}

// ==================== Overview ====================

export function OverviewTab({ data }: TabProps) {
  const { kpis, dailySeries, topEvents, topPages, topReferrers, webVitals } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Events"
          value={n(kpis.events)}
          icon={Activity}
          accent="cyan"
          deltaPct={pctDelta(kpis.events, kpis.eventsPrev)}
          hint="vs previous window"
        />
        <KpiCard label="Page views" value={n(kpis.pageViews)} icon={Eye} accent="sky" />
        <KpiCard label="Daily active users" value={n(kpis.dau)} icon={Users} accent="violet" />
        <KpiCard
          label="Sessions completed"
          value={n(kpis.sessionsCompleted)}
          icon={Flag}
          accent="emerald"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Avg quiz score"
          value={kpis.avgQuizScorePct !== null ? `${kpis.avgQuizScorePct}%` : '—'}
          icon={Trophy}
          accent="amber"
        />
        <KpiCard
          label="Avg quiz time"
          value={kpis.avgQuizSeconds !== null ? `${kpis.avgQuizSeconds}s` : '—'}
          icon={Timer}
          accent="rose"
        />
        <KpiCard
          label="Achievements unlocked"
          value={n(kpis.achievementsUnlocked)}
          icon={Sparkles}
          accent="violet"
        />
        <KpiCard
          label="Newsletter subscribers"
          value={n(kpis.newsletterSubscribers)}
          icon={Send}
          accent="emerald"
          hint={`+${n(kpis.newsletterNew)} in window`}
        />
      </div>

      <Panel title="Daily activity" hint="Events and distinct users across the selected window">
        <DailyChart series={dailySeries} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top events">
          <BarList rows={topEvents.map((r) => ({ label: r.label, value: r.count }))} />
        </Panel>
        <Panel title="Top pages">
          <BarList
            rows={topPages.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-sky-500/70"
          />
        </Panel>
        <Panel title="Traffic sources">
          <BarList
            rows={topReferrers.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-violet-500/70"
          />
        </Panel>
      </div>

      <Panel title="Web vitals" hint="Avg and p75 across sessions · CLS scaled ×1000">
        {webVitals.length === 0 ? (
          <p className="text-sm text-gray-600">No vitals captured in this window.</p>
        ) : (
          <DarkTable headers={['Metric', 'Avg', 'p75', 'Samples']}>
            {webVitals.map((v) => (
              <tr key={v.metric} className="border-t border-gray-800">
                <td className="py-2 pr-4 font-medium text-gray-200">{v.metric}</td>
                <td className="py-2 pr-4 text-gray-400">{n(v.avg)} ms</td>
                <td className="py-2 pr-4 text-gray-400">{n(v.p75)} ms</td>
                <td className="py-2 text-gray-500">{n(v.samples)}</td>
              </tr>
            ))}
          </DarkTable>
        )}
      </Panel>
    </div>
  );
}

// ==================== Quiz / Riddle (shared shape) ====================

export function ModuleTab({
  data,
  moduleKey,
}: TabProps & { moduleKey: 'quiz-mcq' | 'riddle-mcq' }) {
  const m: ModuleDashboard = data.modules[moduleKey];
  const netLike =
    m.sessionsStarted > 0 ? Math.round((m.sessionsCompleted / m.sessionsStarted) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Sessions started"
          value={n(m.sessionsStarted)}
          icon={Activity}
          accent="cyan"
        />
        <KpiCard
          label="Completed"
          value={n(m.sessionsCompleted)}
          icon={Flag}
          accent="emerald"
          hint={netLike !== null ? `${netLike}% of starts` : ''}
        />
        <KpiCard label="Resumed" value={n(m.sessionsResumed)} icon={Timer} accent="sky" />
        <KpiCard
          label="Answered"
          value={n(m.questionsAnswered)}
          icon={ListChecks}
          accent="violet"
        />
        <KpiCard
          label="Accuracy"
          value={m.accuracyPct !== null ? `${m.accuracyPct}%` : '—'}
          icon={Trophy}
          accent="amber"
        />
        <KpiCard
          label={moduleKey === 'quiz-mcq' ? 'Achievements' : 'Skipped'}
          value={n(moduleKey === 'quiz-mcq' ? (m.achievementsUnlocked ?? 0) : m.skipped)}
          icon={moduleKey === 'quiz-mcq' ? Sparkles : FileQuestion}
          accent="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Play funnel" hint="Started → answered → completed">
          <div className="space-y-3">
            <FunnelRow
              label="Sessions started"
              value={m.sessionsStarted}
              max={Math.max(1, m.sessionsStarted)}
              accent="bg-cyan-500/80"
            />
            <FunnelRow
              label="Questions answered"
              value={m.questionsAnswered}
              max={Math.max(1, m.sessionsStarted)}
              accent="bg-violet-500/80"
            />
            <FunnelRow
              label="Sessions abandoned"
              value={m.sessionsAbandoned}
              max={Math.max(1, m.sessionsStarted)}
              accent="bg-rose-500/80"
            />
            <FunnelRow
              label="Sessions completed"
              value={m.sessionsCompleted}
              max={Math.max(1, m.sessionsStarted)}
              accent="bg-emerald-500/80"
            />
          </div>
        </Panel>
        <Panel title="Accuracy by level">
          <BarList
            rows={m.byLevel.map((l) => ({
              label: l.level,
              value: l.answered,
              ...(l.accuracyPct !== null ? { meta: `· ${l.accuracyPct}%` } : {}),
            }))}
            accent="bg-amber-500/70"
            emptyText="No answers tracked in this window."
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Accuracy by subject" hint="Which content areas play hardest (B2)">
          <BarList
            rows={m.bySubject.map((s) => ({
              label: s.subject,
              value: s.answered,
              ...(s.accuracyPct !== null ? { meta: `· ${s.accuracyPct}%` } : {}),
            }))}
            accent="bg-violet-500/70"
            emptyText="No answers tracked in this window."
          />
        </Panel>
        <Panel title="Click analysis" hint="Every tracked interaction in this module (B8)">
          <BarList
            rows={m.eventMix.map((e) => ({ label: e.eventName, value: e.count }))}
            accent="bg-cyan-500/70"
            emptyText="No interactions in this window."
          />
        </Panel>
      </div>

      <Panel title="Hardest questions" hint="Lowest accuracy with at least 3 answers (B2)">
        {m.hardestQuestions.length === 0 ? (
          <p className="text-sm text-gray-600">Not enough answers yet to rank questions.</p>
        ) : (
          <DarkTable headers={['Question', 'Answers', 'Accuracy']}>
            {m.hardestQuestions.map((q) => (
              <tr key={q.questionId} className="border-t border-gray-800">
                <td
                  className="max-w-[16rem] truncate py-2 pr-4 font-mono text-xs text-gray-300"
                  title={q.questionId}
                >
                  {q.questionId}
                </td>
                <td className="py-2 pr-4 text-gray-400">{n(q.answers)}</td>
                <td className="py-2">
                  <span
                    className={`font-medium ${
                      q.accuracyPct < 40
                        ? 'text-rose-400'
                        : q.accuracyPct < 70
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {q.accuracyPct}%
                  </span>
                </td>
              </tr>
            ))}
          </DarkTable>
        )}
      </Panel>

      {moduleKey === 'quiz-mcq' && data.kpis.avgQuizScorePct !== null && (
        <Panel title="Average final score">
          <AccuracyBar pct={data.kpis.avgQuizScorePct} label="Across all completed quiz sessions" />
        </Panel>
      )}
    </div>
  );
}

// ==================== Image Riddles ====================

export function ImageRiddlesTab({ data }: TabProps) {
  const m = data.modules['image-riddles'];
  const total = m.answerChecked + m.hintShown + m.gaveUp + m.shared;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Answers checked"
          value={n(m.answerChecked)}
          icon={ListChecks}
          accent="cyan"
        />
        <KpiCard label="Hints used" value={n(m.hintShown)} icon={Lightbulb} accent="amber" />
        <KpiCard label="Gave up" value={n(m.gaveUp)} icon={Lock} accent="rose" />
        <KpiCard label="Shares" value={n(m.shared)} icon={Send} accent="emerald" />
      </div>
      <Panel title="Action mix" hint="How players interact once engaged">
        <BarList
          rows={[
            { label: 'Answers checked', value: m.answerChecked },
            { label: 'Hints shown', value: m.hintShown },
            { label: 'Gave up (reveal answer)', value: m.gaveUp },
            { label: 'Shared', value: m.shared },
          ].filter((r) => r.value > 0 || total > 0)}
          accent="bg-sky-500/70"
        />
      </Panel>
    </div>
  );
}

// ==================== Dad Jokes ====================

export function JokesTab({ data }: TabProps) {
  const m = data.modules.jokes;
  const totalVotes = m.liked + m.disliked;
  const likeRatio = totalVotes > 0 ? Math.round((m.liked / totalVotes) * 100) : null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Jokes viewed" value={n(m.viewed)} icon={Laugh} accent="cyan" />
        <KpiCard label="Likes" value={n(m.liked)} icon={ThumbsUp} accent="emerald" />
        <KpiCard label="Dislikes" value={n(m.disliked)} icon={ThumbsDown} accent="rose" />
        <KpiCard label="Shares" value={n(m.shared)} icon={Send} accent="violet" />
      </div>
      <Panel title="Like ratio" hint="Likes vs dislikes within the window">
        {likeRatio !== null ? (
          <AccuracyBar pct={likeRatio} label={`${n(m.liked)} 👍 / ${n(m.disliked)} 👎`} />
        ) : (
          <p className="text-sm text-gray-600">No votes in this window.</p>
        )}
      </Panel>
      <Panel title="Top jokes" hint="Most-voted jokes in the window (B3)">
        {m.top.length === 0 ? (
          <p className="text-sm text-gray-600">No votes in this window yet.</p>
        ) : (
          <DarkTable headers={['#', 'Joke', 'Votes', 'Like ratio']}>
            {m.top.map((j, i) => (
              <tr key={j.jokeId} className="border-t border-gray-800">
                <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                <td className="max-w-[24rem] py-2 pr-4 text-gray-200" title={j.label}>
                  {j.label}
                </td>
                <td className="py-2 pr-4 text-gray-400">{n(j.votes)}</td>
                <td className="py-2">
                  <span
                    className={`font-medium ${
                      j.likePct >= 60
                        ? 'text-emerald-400'
                        : j.likePct >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                    }`}
                  >
                    {j.likePct}%
                  </span>
                </td>
              </tr>
            ))}
          </DarkTable>
        )}
      </Panel>
    </div>
  );
}

// ==================== Users ====================

export function UsersTab({ data }: TabProps) {
  const { kpis, users } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Registered users"
          value={n(kpis.registeredUsers)}
          icon={Users}
          accent="cyan"
          hint="all time"
        />
        <KpiCard
          label="Guest players"
          value={n(kpis.guestUsers)}
          icon={UserPlus}
          accent="violet"
          hint="all time"
        />
        <KpiCard
          label="New guests"
          value={n(kpis.newGuests)}
          icon={UserPlus}
          accent="emerald"
          hint="in window"
        />
        <KpiCard
          label="Comments posted"
          value={n(kpis.commentsTotal)}
          icon={Laugh}
          accent="amber"
          hint="all time"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Registrations per day">
          <MiniBars series={users.signupsByDay} accent="bg-cyan-500/80" />
        </Panel>
        <Panel title="Logins per day">
          <MiniBars series={users.loginsByDay} accent="bg-emerald-500/80" />
        </Panel>
      </div>
      <Panel title="Security" hint="Failed logins per day — brute-force radar (B5)">
        <div className="mb-3">
          <KpiCard
            label="Security events"
            value={n(kpis.securityEvents)}
            icon={Lock}
            accent="rose"
            hint="failed logins + lockouts in window"
          />
        </div>
        <MiniBars series={users.failedLoginsByDay} accent="bg-rose-500/80" />
      </Panel>
    </div>
  );
}

// ==================== Audience (geo + devices) ====================

export function AudienceTab({ data }: TabProps) {
  const { geo, devices } = data;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Countries" hint="Events and distinct visitors per country">
          <BarList
            rows={geo.byCountry.map((r) => ({
              label: r.label,
              value: r.events,
              meta: `· ${n(r.visitors)} visitors`,
            }))}
            accent="bg-emerald-500/70"
            emptyText="No geo data yet — populated as real traffic arrives."
          />
        </Panel>
        <Panel title="Cities">
          <BarList
            rows={geo.byCity.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-sky-500/70"
            emptyText="No city data yet."
          />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Device type">
          <BarList
            rows={devices.byType.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-violet-500/70"
          />
        </Panel>
        <Panel title="Browsers">
          <BarList
            rows={devices.byBrowser.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-amber-500/70"
          />
        </Panel>
        <Panel title="Operating systems">
          <BarList
            rows={devices.byOs.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-rose-500/70"
          />
        </Panel>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-gray-600">
        <MapPin className="h-3.5 w-3.5" />
        Geo is resolved server-side from truncated IPs (/24) — raw addresses are never stored.
      </p>
    </div>
  );
}

// ==================== Retention ====================

export function RetentionTab({ cohorts }: { cohorts: RetentionCohort[] }) {
  return (
    <Panel
      title="Weekly retention cohorts"
      hint="Share of each weekly cohort active in any later week"
    >
      {cohorts.length === 0 ? (
        <p className="text-sm text-gray-600">Not enough history yet — check back next week.</p>
      ) : (
        <DarkTable headers={['Cohort week', 'New users', 'Returned', 'Retention']}>
          {cohorts.map((c) => (
            <tr key={c.cohortWeek} className="border-t border-gray-800">
              <td className="py-2 pr-4 text-gray-300">{c.cohortWeek}</td>
              <td className="py-2 pr-4 text-gray-400">{n(c.size)}</td>
              <td className="py-2 pr-4 text-gray-400">{n(c.returned)}</td>
              <td className="py-2">
                <span
                  className={`font-medium ${
                    c.retentionPct >= 30
                      ? 'text-emerald-400'
                      : c.retentionPct >= 10
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {c.retentionPct}%
                </span>
              </td>
            </tr>
          ))}
        </DarkTable>
      )}
    </Panel>
  );
}

// ==================== Journey (conversion funnel) ====================

export function JourneyTab({ data, funnel }: TabProps & { funnel: ConversionFunnel | null }) {
  const m = data.modules;
  const columns: {
    title: string;
    accent: { border: string; text: string; bar: string };
    stages: { label: string; value: number }[];
  }[] = [
    {
      title: 'Quiz Journey',
      accent: { border: 'border-violet-500/50', text: 'text-violet-300', bar: 'bg-violet-500' },
      stages: [
        { label: 'Sessions started', value: m['quiz-mcq'].sessionsStarted },
        { label: 'Questions answered', value: m['quiz-mcq'].questionsAnswered },
        { label: 'Sessions completed', value: m['quiz-mcq'].sessionsCompleted },
      ],
    },
    {
      title: 'Riddle Journey',
      accent: { border: 'border-sky-500/50', text: 'text-sky-300', bar: 'bg-sky-500' },
      stages: [
        { label: 'Sessions started', value: m['riddle-mcq'].sessionsStarted },
        { label: 'Riddles answered', value: m['riddle-mcq'].questionsAnswered },
        { label: 'Sessions completed', value: m['riddle-mcq'].sessionsCompleted },
      ],
    },
    {
      title: 'Image Riddle Journey',
      accent: { border: 'border-orange-500/50', text: 'text-orange-300', bar: 'bg-orange-500' },
      stages: [
        { label: 'Answers checked', value: m['image-riddles'].answerChecked },
        { label: 'Hints shown', value: m['image-riddles'].hintShown },
        { label: 'Shared', value: m['image-riddles'].shared },
      ],
    },
    {
      title: 'Jokes Journey',
      accent: { border: 'border-emerald-500/50', text: 'text-emerald-300', bar: 'bg-emerald-500' },
      stages: [
        { label: 'Jokes viewed', value: m.jokes.viewed },
        { label: 'Votes cast', value: m.jokes.liked + m.jokes.disliked },
        { label: 'Shared', value: m.jokes.shared },
      ],
    },
    {
      title: 'Other Journey',
      accent: { border: 'border-gray-500/50', text: 'text-gray-300', bar: 'bg-gray-500' },
      stages: [
        { label: 'Pages viewed', value: data.kpis.pageViews },
        { label: 'Sign ups', value: data.users.signupsByDay.reduce((a, d) => a + d.count, 0) },
        { label: 'Logins', value: data.users.loginsByDay.reduce((a, d) => a + d.count, 0) },
        { label: 'Client errors', value: data.kpis.clientErrors },
      ],
    },
  ];
  const total = columns.reduce((acc, c) => acc + (c.stages[0]?.value ?? 0), 0);

  return (
    <div className="space-y-5">
      <Panel
        title="Journeys by module"
        hint={`Each column is one feature's funnel · last ${data.range.days}d`}
      >
        {/* TOTAL node */}
        <div className="mb-2 flex justify-center">
          <div className="rounded-lg border border-gray-600 bg-gray-900 px-8 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Total activity
            </p>
            <p className="text-3xl font-bold text-white">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500">across all modules</p>
          </div>
        </div>
        {/* Fan-out connectors into each column */}
        <div className="mb-2 flex justify-around px-8" aria-hidden>
          {columns.map((c) => (
            <span key={c.title} className={`h-5 w-px ${c.accent.bar} opacity-70`} />
          ))}
        </div>
        {/* One column per module */}
        <div className="flex flex-col gap-6 md:flex-row md:gap-4">
          {columns.map((c) => (
            <JourneyColumn
              key={c.title}
              title={c.title}
              total={total}
              stages={c.stages}
              accent={c.accent}
            />
          ))}
        </div>
      </Panel>

      {funnel && (
        <Panel title="Site-wide funnel" hint="Distinct visitors per stage · all modules combined">
          <div className="space-y-3">
            {funnel.stages.map((s, i) => {
              const accents = [
                'bg-cyan-500/80',
                'bg-sky-500/80',
                'bg-violet-500/80',
                'bg-amber-500/80',
                'bg-emerald-500/80',
              ];
              return (
                <FunnelRow
                  key={s.key}
                  label={s.label}
                  value={s.actors}
                  max={Math.max(1, funnel.stages[0]?.actors ?? 1)}
                  accent={accents[i % accents.length] ?? 'bg-cyan-500/80'}
                  meta={i > 0 ? stepPct(funnel.stages[i - 1]!.actors, s.actors) : undefined}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-600">
            Stage-to-stage % compares distinct actors (e.g. signed-up ÷ visitors). A guest who
            registers counts as a visitor (guestId) and separately as signed-up (userId) until
            signup anchoring accumulates.
          </p>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pages visitors see" hint="Top routes by views in the window">
          <BarList
            rows={data.topPages.map((r) => ({ label: r.label, value: r.count }))}
            accent="bg-blue-500/70"
            emptyText="No page views in this window."
          />
        </Panel>
        <Panel title="Beyond the journeys" hint="Raw-event families with no column above">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Achievements"
              value={n(data.kpis.achievementsUnlocked)}
              icon={Trophy}
              accent="amber"
            />
            <KpiCard
              label="Security events"
              value={n(data.kpis.securityEvents)}
              icon={Lock}
              accent="rose"
              hint="failed logins + lockouts"
            />
            <KpiCard
              label="Comments posted"
              value={n(data.kpis.commentEvents)}
              icon={Laugh}
              accent="cyan"
            />
            <KpiCard
              label="Newsletter signups"
              value={n(data.kpis.newsletterNew)}
              icon={Send}
              accent="emerald"
            />
            <KpiCard
              label="Client errors"
              value={n(data.kpis.clientErrors)}
              icon={Activity}
              accent="rose"
              hint="crashes + failed API calls"
            />
            <KpiCard
              label="Web-vital samples"
              value={n(data.webVitals.reduce((a, v) => a + v.samples, 0))}
              icon={Timer}
              accent="violet"
            />
          </div>
        </Panel>
      </div>
      <Panel title="Click-level analysis" hint="Raw Events → click any Actor cell">
        <p className="text-sm text-gray-600">
          Per-feature aggregates live in each feature tab; click-by-click journeys for a single
          visitor are in Raw Events — filter by event/module/date or click an Actor cell for their
          chronological timeline.
        </p>
      </Panel>
    </div>
  );
}

// ==================== Click Analysis (per-feature deep view, B9) ====================

const CLICK_FEATURES = [
  { id: 'quiz-mcq', label: 'Quiz MCQ' },
  { id: 'riddle-mcq', label: 'Riddle MCQ' },
  { id: 'image-riddles', label: 'Image Riddles' },
  { id: 'jokes', label: 'Dad Jokes' },
] as const;

type ClickFeatureId = (typeof CLICK_FEATURES)[number]['id'];

const CLICK_ACCENTS: Record<ClickFeatureId, string> = {
  'quiz-mcq': 'bg-violet-500/70',
  'riddle-mcq': 'bg-sky-500/70',
  'image-riddles': 'bg-orange-500/70',
  jokes: 'bg-emerald-500/70',
};

/** Headline stats per feature, read off the event mix. */
function clickHeadline(
  feature: ClickFeatureId,
  c: ClickAnalysis
): { label: string; value: string }[] {
  const count = (name: string): number => c.eventMix.find((e) => e.eventName === name)?.count ?? 0;
  if (feature === 'quiz-mcq' || feature === 'riddle-mcq') {
    const accuracy =
      c.correctWrong && c.correctWrong.correct + c.correctWrong.wrong > 0
        ? `${Math.round((c.correctWrong.correct / (c.correctWrong.correct + c.correctWrong.wrong)) * 100)}%`
        : '—';
    return [
      { label: 'Answers', value: n(count('question_answered')) },
      { label: 'Accuracy', value: accuracy },
      { label: 'Sessions started', value: n(count('session_started')) },
      { label: 'Abandoned', value: n(count('session_abandoned')) },
    ];
  }
  if (feature === 'image-riddles') {
    const checks = count('image_riddle_answer_checked');
    const gaveUp = count('image_riddle_gave_up');
    const giveUpRate = checks > 0 ? `${Math.round((gaveUp / checks) * 100)}%` : '—';
    return [
      { label: 'Answers checked', value: n(checks) },
      { label: 'Hints shown', value: n(count('image_riddle_hint_shown')) },
      { label: 'Gave up', value: n(gaveUp) },
      { label: 'Give-up rate', value: giveUpRate },
    ];
  }
  const votes = c.voteTypes ? c.voteTypes.likes + c.voteTypes.dislikes : 0;
  const likePct =
    votes > 0 && c.voteTypes ? `${Math.round((c.voteTypes.likes / votes) * 100)}%` : '—';
  return [
    { label: 'Jokes viewed', value: n(count('joke_viewed')) },
    { label: 'Votes cast', value: n(votes) },
    { label: 'Like ratio', value: likePct },
    { label: 'Shares', value: n(count('joke_shared')) },
  ];
}

export function ClickAnalysisTab({ days, dashboard }: { days: number; dashboard: AdminDashboard }) {
  const [feature, setFeature] = useState<ClickFeatureId>('quiz-mcq');
  const [clicks, setClicks] = useState<ClickAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setFailed(false);
    adminApi
      .get<ClickAnalysis>(`/admin/analytics/clicks?module=${feature}&days=${days}`)
      .then((res) => {
        if (!stale) setClicks(res.data);
      })
      .catch(() => {
        if (!stale) setFailed(true);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [feature, days]);

  const headline = clicks ? clickHeadline(feature, clicks) : [];
  const topEvent = clicks?.eventMix[0];

  return (
    <div className="space-y-5">
      {/* Feature switcher */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-gray-900/70 p-1">
        {CLICK_FEATURES.map((f) => (
          <button
            key={f.id}
            onClick={() => setFeature(f.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
              feature === f.id
                ? 'bg-gray-800 font-medium text-white shadow'
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && !clicks ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
          <p className="text-sm text-gray-500">Loading click analysis…</p>
        </div>
      ) : failed && !clicks ? (
        <Panel title="Click analysis">
          <p className="text-sm text-rose-400">Could not load click analysis. Try Refresh.</p>
        </Panel>
      ) : clicks ? (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <KpiCard
              label="Total clicks"
              value={n(clicks.totalClicks)}
              icon={MousePointerClick}
              accent="cyan"
              hint={`last ${days}d`}
            />
            {headline.map((h) => (
              <KpiCard
                key={h.label}
                label={h.label}
                value={h.value}
                icon={Activity}
                accent="violet"
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Clicks per day" hint={`Interaction rhythm · last ${days}d`}>
              <MiniBars series={clicks.perDay} accent={CLICK_ACCENTS[feature]} />
            </Panel>
            <Panel
              title="Event mix"
              hint={topEvent ? `Top: ${topEvent.eventName}` : 'All tracked events'}
            >
              <BarList
                rows={clicks.eventMix.map((e) => ({ label: e.eventName, value: e.count }))}
                accent={CLICK_ACCENTS[feature]}
                emptyText="No interactions in this window."
              />
            </Panel>
          </div>

          {/* Feature-specific depth */}
          {(feature === 'quiz-mcq' || feature === 'riddle-mcq') && clicks.correctWrong && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Correct vs wrong" hint="Across all question_answered events">
                <AccuracyBar
                  pct={
                    clicks.correctWrong.correct + clicks.correctWrong.wrong > 0
                      ? Math.round(
                          (clicks.correctWrong.correct /
                            (clicks.correctWrong.correct + clicks.correctWrong.wrong)) *
                            100
                        )
                      : 0
                  }
                  label={`${n(clicks.correctWrong.correct)} correct · ${n(clicks.correctWrong.wrong)} wrong`}
                />
              </Panel>
              <Panel title="Options picked" hint="Which letter players choose when guessing">
                <BarList
                  rows={(clicks.options ?? []).map((o) => ({
                    label: `Option ${o.option}`,
                    value: o.count,
                  }))}
                  accent={CLICK_ACCENTS[feature]}
                  emptyText="No answers in this window."
                />
              </Panel>
            </div>
          )}

          {feature === 'jokes' && clicks.voteTypes && (
            <Panel title="Vote split" hint="Likes vs dislikes in the window">
              <AccuracyBar
                pct={
                  clicks.voteTypes.likes + clicks.voteTypes.dislikes > 0
                    ? Math.round(
                        (clicks.voteTypes.likes /
                          (clicks.voteTypes.likes + clicks.voteTypes.dislikes)) *
                          100
                      )
                    : 0
                }
                label={`${n(clicks.voteTypes.likes)} 👍 / ${n(clicks.voteTypes.dislikes)} 👎`}
              />
            </Panel>
          )}

          {feature === 'jokes' && dashboard.modules.jokes.top.length > 0 && (
            <Panel title="Most-voted jokes" hint="Top 5 in the window">
              <DarkTable headers={['#', 'Joke', 'Votes', 'Like ratio']}>
                {dashboard.modules.jokes.top.map((j, i) => (
                  <tr key={j.jokeId} className="border-t border-gray-800">
                    <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                    <td className="max-w-[24rem] py-2 pr-4 text-gray-200" title={j.label}>
                      {j.label}
                    </td>
                    <td className="py-2 pr-4 text-gray-400">{n(j.votes)}</td>
                    <td className="py-2 text-emerald-400">{j.likePct}%</td>
                  </tr>
                ))}
              </DarkTable>
            </Panel>
          )}

          <p className="text-xs text-gray-600">
            These are aggregates. Individual click-by-click rows — with visitor, session and full
            properties — are in Raw Events (filter to {feature}, or click any Actor cell).
          </p>
        </>
      ) : null}
    </div>
  );
}

// ==================== CSV export rows per tab ====================

export function exportRowsForTab(
  tab: string,
  data: AdminDashboard,
  cohorts: RetentionCohort[],
  funnel: ConversionFunnel | null
): Record<string, unknown>[] {
  switch (tab) {
    case 'overview':
      return data.dailySeries as unknown as Record<string, unknown>[];
    case 'quiz-mcq':
      return data.modules['quiz-mcq'].byLevel as unknown as Record<string, unknown>[];
    case 'riddle-mcq':
      return data.modules['riddle-mcq'].byLevel as unknown as Record<string, unknown>[];
    case 'image-riddles': {
      const m = data.modules['image-riddles'];
      return [
        { action: 'answers_checked', count: m.answerChecked },
        { action: 'hints_shown', count: m.hintShown },
        { action: 'gave_up', count: m.gaveUp },
        { action: 'shared', count: m.shared },
      ];
    }
    case 'jokes': {
      const m = data.modules.jokes;
      if (m.top.length > 0) {
        return m.top.map((j) => ({
          jokeId: j.jokeId,
          joke: j.label,
          votes: j.votes,
          likePct: j.likePct,
        }));
      }
      return [
        { metric: 'viewed', count: m.viewed },
        { metric: 'liked', count: m.liked },
        { metric: 'disliked', count: m.disliked },
        { metric: 'shared', count: m.shared },
      ];
    }
    case 'users':
      return data.users.signupsByDay as unknown as Record<string, unknown>[];
    case 'audience':
      return data.geo.byCountry as unknown as Record<string, unknown>[];
    case 'retention':
      return cohorts as unknown as Record<string, unknown>[];
    case 'journey':
      return (funnel?.stages ?? []).map((s) => ({ stage: s.label, visitors: s.actors }));
    case 'clicks': {
      const mix = [
        ...data.modules['quiz-mcq'].eventMix.map((e) => ({
          module: 'quiz-mcq',
          event: e.eventName,
          count: e.count,
        })),
        ...data.modules['riddle-mcq'].eventMix.map((e) => ({
          module: 'riddle-mcq',
          event: e.eventName,
          count: e.count,
        })),
      ];
      return mix.length > 0
        ? mix
        : [{ note: 'per-feature mixes for Image Riddles / Jokes live on their tabs' }];
    }
    default:
      return [];
  }
}
