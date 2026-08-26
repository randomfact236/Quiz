/**
 * ============================================================================
 * Quiz API Service
 * ============================================================================
 * Backend API integration for Quiz subjects, chapters, and questions
 * Uses NestJS backend instead of JSON file storage
 * ============================================================================
 */

import { api } from './api-client';

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

export async function getSubjects(hasContent: boolean = false): Promise<QuizSubject[]> {
  const response = await api.get<{ data: QuizSubject[]; total: number }>(
    `/quiz-mcq/subjects?hasContent=${hasContent}`
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

export async function createSubject(
  dto: CreateSubjectDto,
  isAdmin: boolean = false
): Promise<QuizSubject> {
  const response = await api.post<QuizSubject>('/quiz-mcq/subjects', dto, { isAdmin });
  return response.data;
}

export async function updateSubject(
  id: string,
  dto: UpdateSubjectDto,
  isAdmin: boolean = false
): Promise<QuizSubject> {
  const response = await api.put<QuizSubject>(`/quiz-mcq/subjects/${id}`, dto, { isAdmin });
  return response.data;
}

export async function deleteSubject(id: string, isAdmin: boolean = false): Promise<void> {
  await api.delete(`/quiz-mcq/subjects/${id}`, { isAdmin });
}

// ============================================================================
// Chapters API
// ============================================================================

export async function getAllChapters(): Promise<QuizChapter[]> {
  const response = await api.get<QuizChapter[]>('/quiz-mcq/chapters', { isAdmin: true });
  return response.data;
}

export async function getChaptersBySubject(subjectId: string): Promise<QuizChapter[]> {
  const response = await api.get<QuizChapter[]>(`/quiz-mcq/chapters/${subjectId}`, {
    isAdmin: true,
  });
  return response.data;
}

export async function createChapter(
  dto: CreateChapterDto,
  isAdmin: boolean = false
): Promise<QuizChapter> {
  const response = await api.post<QuizChapter>('/quiz-mcq/chapters', dto, { isAdmin });
  return response.data;
}

export async function deleteChapter(id: string, isAdmin: boolean = false): Promise<void> {
  await api.delete(`/quiz-mcq/chapters/${id}`, { isAdmin });
}

export async function updateChapter(
  id: string,
  dto: { name?: string; subjectId?: string },
  isAdmin: boolean = false
): Promise<QuizChapter> {
  const response = await api.patch<QuizChapter>(`/quiz-mcq/chapters/${id}`, dto, { isAdmin });
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
  filters: QuestionFilters = {},
  isAdmin: boolean = false
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
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(url, { isAdmin });
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
  const response = await api.get<SubjectStatusCounts>(
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

export async function getFilterCounts(
  filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  },
  isAdmin: boolean = false
): Promise<FilterCountsResponse> {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.status) params.append('status', filters.status);
  if (filters.level) params.append('level', filters.level);
  if (filters.chapter) params.append('chapter', filters.chapter);
  if (filters.search) params.append('search', filters.search);

  const response = await api.get<FilterCountsResponse>(
    `/quiz-mcq/filter-counts?${params.toString()}`,
    {
      isAdmin,
    }
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
  limit: number = 10,
  isAdmin: boolean = false
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

  const response = await api.get<{
    data: QuizQuestion[];
    total: number;
    totalPages: number;
  }>(`/quiz-mcq/questions?${params.toString()}`, { isAdmin });
  return {
    data: response.data.data,
    total: response.data.total,
    totalPages: response.data.totalPages,
  };
}

export async function createQuestion(
  dto: CreateQuestionDto,
  isAdmin: boolean = false
): Promise<QuizQuestion> {
  const response = await api.post<QuizQuestion>('/quiz-mcq/questions', dto, { isAdmin });
  return response.data;
}

export async function createQuestionsBulk(
  dto: CreateQuestionDto[],
  isAdmin: boolean = false
): Promise<BulkCreateResponse> {
  const response = await api.post<BulkCreateResponse>('/quiz-mcq/questions/bulk', dto, { isAdmin });
  return response.data;
}

export async function createQuestionsBulkFromImport(
  dto: BulkQuestionDto,
  isAdmin: boolean = false
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post<{ count: number; errors: string[] }>(
    '/quiz-mcq/questions/bulk',
    dto,
    { isAdmin }
  );
  return response.data;
}

export async function updateQuestion(
  id: string,
  dto: UpdateQuestionDto,
  isAdmin: boolean = false
): Promise<QuizQuestion> {
  const response = await api.patch<QuizQuestion>(`/quiz-mcq/questions/${id}`, dto, { isAdmin });
  return response.data;
}

export async function deleteQuestion(id: string, isAdmin: boolean = false): Promise<void> {
  await api.delete(`/quiz-mcq/questions/${id}`, { isAdmin });
}

export async function bulkActionQuestions(
  ids: string[],
  action: 'publish' | 'draft' | 'trash' | 'delete' | 'restore',
  isAdmin: boolean = false
): Promise<{ success: number; failed: number }> {
  const response = await api.post<{ success: number; failed: number }>(
    '/quiz-mcq/bulk-action',
    {
      ids,
      action,
    },
    { isAdmin }
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
  } = {},
  isAdmin: boolean = true
): Promise<void> {
  const params = new URLSearchParams();
  if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
  if (filters.level && filters.level !== 'all') params.append('level', filters.level);
  if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await api.get<{ csv: string; filename: string }>(
    `/quiz-mcq/questions/export?${params.toString()}`,
    { isAdmin }
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
