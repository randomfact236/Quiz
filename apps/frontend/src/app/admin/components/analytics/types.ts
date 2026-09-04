/**
 * Mirror of the backend AdminDashboard payload (analytics.service.ts).
 * Keep in sync — the dashboard endpoint is the single source of truth.
 */

export interface ModuleDashboard {
  sessionsStarted: number;
  sessionsResumed: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  questionsAnswered: number;
  correct: number;
  accuracyPct: number | null;
  skipped: number;
  avgScorePct: number | null;
  byLevel: { level: string; answered: number; correct: number; accuracyPct: number | null }[];
  achievementsUnlocked: number | null;
}

export interface AdminDashboard {
  range: { days: number };
  kpis: {
    events: number;
    eventsPrev: number;
    pageViews: number;
    dau: number;
    sessionsCompleted: number;
    registeredUsers: number;
    guestUsers: number;
    newGuests: number;
    achievementsUnlocked: number;
    jokeLikes: number;
    jokeDislikes: number;
    newsletterSubscribers: number;
    newsletterNew: number;
    commentsTotal: number;
    avgQuizScorePct: number | null;
    avgQuizSeconds: number | null;
  };
  dailySeries: { day: string; events: number; pageViews: number; activeUsers: number }[];
  topPages: { label: string; count: number }[];
  topEvents: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  geo: {
    byCountry: { label: string; events: number; visitors: number }[];
    byCity: { label: string; count: number }[];
  };
  devices: {
    byType: { label: string; count: number }[];
    byBrowser: { label: string; count: number }[];
    byOs: { label: string; count: number }[];
  };
  webVitals: { metric: string; avg: number; p75: number; samples: number }[];
  users: {
    signupsByDay: { day: string; count: number }[];
    loginsByDay: { day: string; count: number }[];
  };
  modules: {
    'quiz-mcq': ModuleDashboard;
    'riddle-mcq': ModuleDashboard;
    'image-riddles': { answerChecked: number; hintShown: number; gaveUp: number; shared: number };
    jokes: { viewed: number; liked: number; disliked: number; shared: number };
  };
}

export interface RetentionCohort {
  cohortWeek: string;
  size: number;
  returned: number;
  retentionPct: number;
}
