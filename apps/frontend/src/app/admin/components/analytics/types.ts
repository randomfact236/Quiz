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
  bySubject: { subject: string; answered: number; correct: number; accuracyPct: number | null }[];
  hardestQuestions: { questionId: string; answers: number; accuracyPct: number }[];
  eventMix: { eventName: string; count: number }[];
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
    clientErrors: number;
    securityEvents: number;
    commentEvents: number;
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
    failedLoginsByDay: { day: string; count: number }[];
  };
  modules: {
    'quiz-mcq': ModuleDashboard;
    'riddle-mcq': ModuleDashboard;
    'image-riddles': { answerChecked: number; hintShown: number; gaveUp: number; shared: number };
    jokes: {
      viewed: number;
      liked: number;
      disliked: number;
      shared: number;
      top: { jokeId: string; label: string; votes: number; likePct: number }[];
    };
  };
}

export interface RetentionCohort {
  cohortWeek: string;
  size: number;
  returned: number;
  retentionPct: number;
}

/** Mirror of the backend ConversionFunnel payload (analytics.service.ts). */
export interface ConversionFunnel {
  range: { days: number };
  stages: { key: string; label: string; actors: number }[];
}

/** Mirror of the backend ClickAnalysis payload (analytics.service.ts, B9). */
export interface ClickAnalysis {
  range: { days: number };
  module: string;
  totalClicks: number;
  eventMix: { eventName: string; count: number }[];
  perDay: { day: string; count: number }[];
  correctWrong: { correct: number; wrong: number } | null;
  options: { option: string; count: number }[] | null;
  voteTypes: { likes: number; dislikes: number } | null;
  bySubject: { label: string; events: number; accuracyPct: number | null }[] | null;
  byChapter: { label: string; events: number; accuracyPct: number | null }[] | null;
  byCategory: { label: string; events: number }[] | null;
  topRiddles: { label: string; events: number }[] | null;
}
