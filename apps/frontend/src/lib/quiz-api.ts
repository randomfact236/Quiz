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
    status?: 'published' | 'draft' | undefined;
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

// ============================================================================
// Subjects API
// ============================================================================

export async function getSubjects(hasContent: boolean = false): Promise<QuizSubject[]> {
    const response = await api.get<{ data: QuizSubject[]; total: number }>(
        `/quiz/subjects?hasContent=${hasContent}`
    );
    return response.data.data;
}

export async function getSubjectBySlug(slug: string): Promise<QuizSubject & { chapters: QuizChapter[] }> {
    const response = await api.get<QuizSubject & { chapters: QuizChapter[] }>(`/quiz/subjects/${slug}`);
    return response.data;
}

export async function createSubject(dto: CreateSubjectDto): Promise<QuizSubject> {
    const response = await api.post<QuizSubject>('/quiz/subjects', dto);
    return response.data;
}

export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<QuizSubject> {
    const response = await api.put<QuizSubject>(`/quiz/subjects/${id}`, dto);
    return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
    await api.delete(`/quiz/subjects/${id}`);
}

// ============================================================================
// Chapters API
// ============================================================================

export async function getChaptersBySubject(subjectId: string): Promise<QuizChapter[]> {
    const response = await api.get<QuizChapter[]>(`/quiz/chapters/${subjectId}`);
    return response.data;
}

export async function createChapter(dto: CreateChapterDto): Promise<QuizChapter> {
    const response = await api.post<QuizChapter>('/quiz/chapters', dto);
    return response.data;
}

export async function deleteChapter(id: string): Promise<void> {
    await api.delete(`/quiz/chapters/${id}`);
}

export async function getChaptersForSubject(subjectSlug: string): Promise<{ id: string; name: string }[]> {
    const subject = await getSubjectBySlug(subjectSlug);
    return subject.chapters.map(c => ({ id: c.id, name: c.name }));
}



// ============================================================================
// Questions API
// ============================================================================

export async function getQuestionsByChapter(
    chapterId: string,
    page: number = 1,
    limit: number = 100
): Promise<PaginatedResponse<QuizQuestion>> {
    const response = await api.get<PaginatedResponse<QuizQuestion>>(
        `/quiz/questions/${chapterId}?page=${page}&limit=${limit}`
    );
    return response.data;
}

export async function getRandomQuestions(level: string, count: number = 10): Promise<QuizQuestion[]> {
    const response = await api.get<QuizQuestion[]>(`/quiz/random/${level}?count=${count}`);
    return response.data;
}

export async function getMixedQuestions(count: number = 50): Promise<QuizQuestion[]> {
    const response = await api.get<QuizQuestion[]>(`/quiz/mixed?count=${count}`);
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
    page: number = 1,
    limit: number = 10
): Promise<{ data: QuizQuestion[]; total: number; page: number; limit: number }> {
    let url = `/quiz/subjects/${subjectSlug}/questions?page=${page}&limit=${limit}`;
    if (filters.status) {
        url += `&status=${filters.status}`;
    }
    if (filters.level) {
        url += `&level=${filters.level}`;
    }
    if (filters.chapter) {
        url += `&chapter=${encodeURIComponent(filters.chapter)}`;
    }
    if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
    }
    const response = await api.get<{ data: QuizQuestion[]; total: number }>(url);
    return {
        data: response.data.data,
        total: response.data.total,
        page,
        limit
    };
}

export async function getQuestionCountBySubject(subjectSlug: string): Promise<number> {
    const response = await api.get<{ data: QuizQuestion[]; total: number }>(`/quiz/subjects/${subjectSlug}/questions`);
    return response.data.total;
}

export interface SubjectStatusCounts {
    total: number;
    published: number;
    draft: number;
    trash: number;
}

export async function getStatusCountsBySubject(subjectSlug: string): Promise<SubjectStatusCounts> {
    const response = await api.get<SubjectStatusCounts>(`/quiz/subjects/${subjectSlug}/status-counts`);
    return response.data;
}

export async function getChapterCountsBySubject(subjectSlug: string): Promise<Record<string, number>> {
    const response = await api.get<Record<string, number>>(`/quiz/subjects/${subjectSlug}/chapter-counts`);
    return response.data;
}

export async function getAllQuestionsFilterCounts(filters: { level?: string; chapter?: string; status?: string; search?: string }): Promise<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }> {
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.chapter) params.append('chapter', filters.chapter);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }>(`/quiz/questions/all/filter-counts?${params.toString()}`);
    return response.data;
}

export async function getSubjectFilterCounts(subjectSlug: string, filters: { level?: string; chapter?: string; status?: string; search?: string }): Promise<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }> {
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.chapter) params.append('chapter', filters.chapter);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }>(`/quiz/subjects/${subjectSlug}/filter-counts?${params.toString()}`);
    return response.data;
}

export interface FilterCountsResponse {
    subjectCounts: { slug: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number }[];
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
    
    const response = await api.get<FilterCountsResponse>(`/quiz/filter-counts?${params.toString()}`);
    return response.data;
}

export async function createQuestion(dto: CreateQuestionDto): Promise<QuizQuestion> {
    const response = await api.post<QuizQuestion>('/quiz/questions', dto);
    return response.data;
}

export async function createQuestionsBulk(dto: CreateQuestionDto[]): Promise<BulkCreateResponse> {
    const response = await api.post<BulkCreateResponse>('/quiz/questions/bulk', dto);
    return response.data;
}

export async function updateQuestion(id: string, dto: UpdateQuestionDto): Promise<QuizQuestion> {
    const response = await api.patch<QuizQuestion>(`/quiz/questions/${id}`, dto);
    return response.data;
}

export async function deleteQuestion(id: string): Promise<void> {
    await api.delete(`/quiz/questions/${id}`);
}

export async function bulkActionQuestions(
    ids: string[],
    action: 'publish' | 'draft' | 'trash' | 'delete'
): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ success: number; failed: number }>('/quiz/bulk-action', {
        ids,
        action
    });
    return response.data;
}


