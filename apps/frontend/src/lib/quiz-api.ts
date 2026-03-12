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
    options: string[];
    correctAnswer: string;
    level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
    chapterId: string;
    chapter?: { id: string; name: string };
    explanation?: string;
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
    options: string[];
    level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
    chapterId: string;
    explanation?: string | undefined;
    status?: 'published' | 'draft' | undefined;
}

export interface UpdateQuestionDto {
    question?: string;
    correctAnswer?: string;
    options?: string[];
    level?: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
    explanation?: string | undefined;
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

export async function updateChapter(id: string, name: string): Promise<QuizChapter> {
    const response = await api.put<QuizChapter>(`/quiz/chapters/${id}`, { name });
    return response.data;
}

export async function deleteChapter(id: string): Promise<void> {
    await api.delete(`/quiz/chapters/${id}`);
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

export async function getAllQuestions(
    page: number = 1,
    limit: number = 100,
    status?: string,
    subjectSlug?: string
): Promise<PaginatedResponse<QuizQuestion>> {
    let url = `/quiz/questions?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (subjectSlug) url += `&subject=${subjectSlug}`;
    const response = await api.get<PaginatedResponse<QuizQuestion>>(url);
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

export async function getQuestionsBySubject(
    subjectSlug: string,
    status?: string,
    page: number = 1,
    limit: number = 10
): Promise<{ data: QuizQuestion[]; total: number; page: number; limit: number }> {
    let url = `/quiz/subjects/${subjectSlug}/questions?page=${page}&limit=${limit}`;
    if (status) {
        url += `&status=${status}`;
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

export async function getStatusCounts(): Promise<StatusCountResponse> {
    const response = await api.get<StatusCountResponse>('/quiz/status-counts');
    return response.data;
}
