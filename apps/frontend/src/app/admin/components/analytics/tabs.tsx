'use client';

/**
 * ============================================================================
 * Tab content components for the analytics dashboard.
 * ============================================================================
 * One component per admin tab. All data comes from the single dashboard
 * payload (`AdminDashboard`) + the retention endpoint; each tab also exposes
 * its primary dataset for the header's CSV export via `getExportRows`.
 * ============================================================================
 */

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
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

import type { AdminDashboard, ModuleDashboard, RetentionCohort } from './types';
import {
  AccuracyBar,
  BarList,
  DailyChart,
  DarkTable,
  FunnelRow,
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

// ==================== CSV export rows per tab ====================

export function exportRowsForTab(
  tab: string,
  data: AdminDashboard,
  cohorts: RetentionCohort[]
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
    default:
      return [];
  }
}
