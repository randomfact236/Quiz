/**
 * ============================================================================
 * Quiz API Service
 * ============================================================================
 * Backend API integration for Quiz subjects, chapters, and questions
 * Uses NestJS backend instead of JSON file storage
 * ============================================================================
 */

import { api, adminApi } from './api-client';

export interface QuizSubject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description?: string;
  isActive: boolean;
  category?: string;
  order?: number;
}

export interface QuizChapter {
  id: string;
  name: string;
  subjectId: string;
  chapterNumber: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  correctLetter: string | null;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapterId: string;
  chapter?: { id: string; name: string };
  status?: 'published' | 'draft' | 'trash';
  updatedAt?: string;
}

export interface CreateSubjectDto {
  name: string;
  slug: string;
  emoji: string;
  category?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  emoji?: string;
  category?: string;
  isActive?: boolean | undefined;
}

export interface CreateChapterDto {
  name: string;
  subjectId: string;
}

export interface CreateQuestionDto {
  question: string;
  correctAnswer: string;
  correctLetter?: string | null;
  options: string[] | null;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapterId: string;
  status?: 'published' | 'draft' | undefined;
}

export interface UpdateQuestionDto {
  question?: string;
  correctAnswer?: string;
  correctLetter?: string | null;
  options?: string[] | null;
  level?: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapterId?: string;
  status?: 'published' | 'draft' | 'trash' | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface BulkCreateResponse {
  count: number;
  errors: string[];
}

export interface StatusCountResponse {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

export interface BulkQuestionItemDto {
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  level?: string;
  subjectName?: string;
  chapterName: string;
  status?: string;
}

export interface BulkQuestionDto {
  subjectName?: string;
  questions: BulkQuestionItemDto[];
}

// ============================================================================
// Subjects API
// ============================================================================

export async function getSubjects(
  hasContent: boolean = false,
  includeInactive: boolean = false
): Promise<QuizSubject[]> {
  // Visibility: inactive subjects are excluded server-side unless explicitly
  // requested (admin surfaces).
  const suffix = includeInactive ? '&includeInactive=true' : '';
  const response = await api.get<{ data: QuizSubject[]; total: number }>(
    `/quiz-mcq/subjects?hasContent=${hasContent}${suffix}`
  );
  return response.data.data;
}

/** Public per-level question counts for challenge hubs (single grouped query, cached). */
export interface PublicLevelCounts {
  subjectWise: Record<string, Record<string, number>>;
  allSubject: Record<string, number>;
  completeMix: number;
}

export async function getPublicLevelCounts(): Promise<PublicLevelCounts> {
  const response = await api.get<PublicLevelCounts>('/quiz-mcq/level-counts');
  return response.data;
}

/** Public per-subject + per-chapter published counts (single grouped query, cached). */
export interface PublicQuestionCounts {
  bySubject: Record<string, number>;
  byChapter: Record<string, { count: number; levels: Record<string, number> }>;
}

export async function getQuestionCounts(): Promise<PublicQuestionCounts> {
  const response = await api.get<PublicQuestionCounts>('/quiz-mcq/question-counts');
  return response.data;
}

export async function getSubjectMeta(
  slug: string
): Promise<{ name: string; emoji: string; slug: string }> {
  const response = await api.get<{ name: string; emoji: string; slug: string }>(
    `/quiz-mcq/subjects/${slug}/meta`
  );
  return response.data;
}

export async function getSubjectBySlug(
  slug: string
): Promise<QuizSubject & { chapters: QuizChapter[] }> {
  const response = await api.get<QuizSubject & { chapters: QuizChapter[] }>(
    `/quiz-mcq/subjects/${slug}`
  );
  return response.data;
}

export async function createSubject(dto: CreateSubjectDto): Promise<QuizSubject> {
  const response = await adminApi.post<QuizSubject>('/quiz-mcq/subjects', dto);
  return response.data;
}

export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<QuizSubject> {
  const response = await adminApi.put<QuizSubject>(`/quiz-mcq/subjects/${id}`, dto);
  return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await adminApi.delete(`/quiz-mcq/subjects/${id}`);
}

// ============================================================================
// Chapters API
// ============================================================================

export async function getAllChapters(): Promise<QuizChapter[]> {
  const response = await adminApi.get<QuizChapter[]>('/quiz-mcq/chapters');
  return response.data;
}

export async function getChaptersBySubject(subjectId: string): Promise<QuizChapter[]> {
  const response = await adminApi.get<QuizChapter[]>(`/quiz-mcq/chapters/${subjectId}`);
  return response.data;
}

export async function createChapter(dto: CreateChapterDto): Promise<QuizChapter> {
  const response = await adminApi.post<QuizChapter>('/quiz-mcq/chapters', dto);
  return response.data;
}

export async function deleteChapter(id: string): Promise<void> {
  await adminApi.delete(`/quiz-mcq/chapters/${id}`);
}

export async function updateChapter(
  id: string,
  dto: { name?: string; subjectId?: string }
): Promise<QuizChapter> {
  const response = await adminApi.patch<QuizChapter>(`/quiz-mcq/chapters/${id}`, dto);
  return response.data;
}

// ============================================================================
// Questions API
// ============================================================================

export async function getQuestionsByChapter(
  chapterId: string
): Promise<{ data: QuizQuestion[]; total: number }> {
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(
    `/quiz-mcq/questions/${chapterId}`
  );
  return response.data;
}

export async function getRandomQuestions(
  level: string
): Promise<{ data: QuizQuestion[]; total: number }> {
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(
    `/quiz-mcq/random/${level}`
  );
  return response.data;
}

export async function getMixedQuestions(): Promise<{ data: QuizQuestion[]; total: number }> {
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(`/quiz-mcq/mixed`);
  return response.data;
}

/** Capacity-plan A2: capped, server-side random selection (never fetches the whole bank). */
export async function getSubjectRandomQuestions(
  subjectSlug: string,
  params: { count?: number; level?: string; chapterId?: string } = {}
): Promise<{ data: QuizQuestion[]; total: number }> {
  const search = new URLSearchParams();
  if (params.count) {
    search.set('count', String(params.count));
  }
  if (params.level && params.level !== 'all') {
    search.set('level', params.level);
  }
  if (params.chapterId) {
    search.set('chapterId', params.chapterId);
  }
  const query = search.toString();
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(
    `/quiz-mcq/subjects/${subjectSlug}/questions/random${query ? `?${query}` : ''}`
  );
  return response.data;
}

export interface QuestionFilters {
  status?: string;
  level?: string;
  chapter?: string;
  search?: string;
}

export async function getQuestionsBySubject(
  subjectSlug: string,
  filters: QuestionFilters = {}
): Promise<{ data: QuizQuestion[]; total: number }> {
  let url = `/quiz-mcq/subjects/${subjectSlug}/questions`;
  if (filters.status) {
    url += `?status=${filters.status}`;
  }
  if (filters.level) {
    url += `${filters.status ? '&' : '?'}level=${filters.level}`;
  }
  if (filters.chapter) {
    url += `${filters.status || filters.level ? '&' : '?'}chapter=${encodeURIComponent(filters.chapter)}`;
  }
  if (filters.search) {
    url += `${filters.status || filters.level || filters.chapter ? '&' : '?'}search=${encodeURIComponent(filters.search)}`;
  }
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(url);
  return response.data;
}

export async function getQuestionCountBySubject(subjectSlug: string): Promise<number> {
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(
    `/quiz-mcq/subjects/${subjectSlug}/questions`
  );
  return response.data.total;
}

export interface SubjectStatusCounts {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

export async function getStatusCountsBySubject(subjectSlug: string): Promise<SubjectStatusCounts> {
  const response = await adminApi.get<SubjectStatusCounts>(
    `/quiz-mcq/subjects/${subjectSlug}/status-counts`
  );
  return response.data;
}

export interface FilterCountsResponse {
  subjects: {
    id: string;
    name: string;
    slug: string;
    emoji: string;
    category: string;
    count: number;
  }[];
  chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}

export async function getFilterCounts(filters: {
  subject?: string;
  status?: string;
  level?: string;
  chapter?: string;
  search?: string;
}): Promise<FilterCountsResponse> {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.status) params.append('status', filters.status);
  if (filters.level) params.append('level', filters.level);
  if (filters.chapter) params.append('chapter', filters.chapter);
  if (filters.search) params.append('search', filters.search);

  const response = await adminApi.get<FilterCountsResponse>(
    `/quiz-mcq/filter-counts?${params.toString()}`
  );
  return response.data;
}

export async function getAllQuestions(
  filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  } = {},
  page: number = 1,
  limit: number = 10
): Promise<{
  data: QuizQuestion[];
  total: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.level && filters.level !== 'all') params.append('level', filters.level);
  if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
  if (filters.search) params.append('search', filters.search);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const response = await adminApi.get<{
    data: QuizQuestion[];
    total: number;
    totalPages: number;
  }>(`/quiz-mcq/questions?${params.toString()}`);
  return {
    data: response.data.data,
    total: response.data.total,
    totalPages: response.data.totalPages,
  };
}

export async function createQuestion(dto: CreateQuestionDto): Promise<QuizQuestion> {
  const response = await adminApi.post<QuizQuestion>('/quiz-mcq/questions', dto);
  return response.data;
}

export async function createQuestionsBulk(dto: CreateQuestionDto[]): Promise<BulkCreateResponse> {
  const response = await adminApi.post<BulkCreateResponse>('/quiz-mcq/questions/bulk', dto);
  return response.data;
}

export async function createQuestionsBulkFromImport(
  dto: BulkQuestionDto
): Promise<{ count: number; errors: string[] }> {
  const response = await adminApi.post<{ count: number; errors: string[] }>(
    '/quiz-mcq/questions/bulk',
    dto
  );
  return response.data;
}

export async function updateQuestion(id: string, dto: UpdateQuestionDto): Promise<QuizQuestion> {
  const response = await adminApi.patch<QuizQuestion>(`/quiz-mcq/questions/${id}`, dto);
  return response.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await adminApi.delete(`/quiz-mcq/questions/${id}`);
}

export async function bulkActionQuestions(
  ids: string[],
  action: 'publish' | 'draft' | 'trash' | 'delete' | 'restore'
): Promise<{ success: number; failed: number }> {
  const response = await adminApi.post<{ success: number; failed: number }>(
    '/quiz-mcq/bulk-action',
    {
      ids,
      action,
    }
  );
  return response.data;
}

// ============================================================================
// CSV Export/Import
// ============================================================================

export async function exportQuestionsFromBackend(
  filters: {
    subject?: string;
    level?: string;
    chapter?: string;
    status?: string;
  } = {}
): Promise<void> {
  const params = new URLSearchParams();
  if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
  if (filters.level && filters.level !== 'all') params.append('level', filters.level);
  if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await adminApi.get<{ csv: string; filename: string }>(
    `/quiz-mcq/questions/export?${params.toString()}`
  );

  const blob = new Blob([response.data.csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = response.data.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Server-side session persistence (plan/02-mcq-quiz.md P1 #1)
// ============================================================================

export interface QuizSessionPayload {
  guestId?: string;
  subjectSlug?: string;
  subjectName?: string;
  chapterName?: string;
  level?: string;
  mode?: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  maxScore: number;
  durationSeconds?: number;
}

export interface QuizSessionRecord {
  id: string;
  subjectSlug: string | null;
  subjectName: string | null;
  chapterName: string | null;
  level: string | null;
  mode: string | null;
  totalQuestions: number;
  correctCount: number;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
  completedAt: string;
}

export interface QuizHighScore {
  subjectSlug: string | null;
  subjectName: string | null;
  bestScore: number;
  maxScore: number;
  sessions: number;
}

/** Persist a completed session. Fire-and-forget at call sites — never blocks the UI. */
export async function saveQuizSession(payload: QuizSessionPayload): Promise<boolean> {
  try {
    const response = await api.post<{ recorded: boolean }>('/quiz-mcq/sessions', payload);
    return response.data.recorded;
  } catch {
    return false;
  }
}

/** Latest 50 completed sessions for the caller (token-bound, else guestId). */
export async function getQuizSessionHistory(guestId?: string): Promise<QuizSessionRecord[]> {
  const params = guestId ? `?guestId=${encodeURIComponent(guestId)}` : '';
  try {
    const response = await api.get<{ data: QuizSessionRecord[] }>(
      `/quiz-mcq/sessions/history${params}`
    );
    return response.data.data;
  } catch {
    return [];
  }
}

/** Best score per subject for the caller (token-bound, else guestId). */
export async function getQuizSessionHighScores(guestId?: string): Promise<QuizHighScore[]> {
  const params = guestId ? `?guestId=${encodeURIComponent(guestId)}` : '';
  try {
    const response = await api.get<{ data: QuizHighScore[] }>(
      `/quiz-mcq/sessions/high-scores${params}`
    );
    return response.data.data;
  } catch {
    return [];
  }
}
