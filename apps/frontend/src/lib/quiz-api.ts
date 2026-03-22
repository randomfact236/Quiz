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

export async function updateChapter(id: string, dto: { name?: string; subjectId?: string }): Promise<QuizChapter> {
    const response = await api.patch<QuizChapter>(`/quiz/chapters/${id}`, dto);
    return response.data;
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

export interface FilterCountsResponse {
    subjectCounts: { slug: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string; subjectSlug: string }[];
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
): Promise<{ data: QuizQuestion[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.level && filters.level !== 'all') params.append('level', filters.level);
    if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
    if (filters.search) params.append('search', filters.search);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await api.get<{ data: QuizQuestion[]; total: number }>(`/quiz/questions?${params.toString()}`);
    return {
        data: response.data.data,
        total: response.data.total,
        page,
        limit
    };
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

// ============================================================================
// CSV Export/Import
// ============================================================================

const CSV_HEADERS = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'level', 'chapter', 'subject', 'status'];

export function exportQuestionsToCSV(questions: QuizQuestion[], subjectName?: string): void {
    const rows = questions.map(q => {
        const isExtreme = q.level === 'extreme';
        const row = [
            `"${(q.question || '').replace(/"/g, '""')}"`,
            isExtreme ? '' : `"${(q.options?.[0] || '').replace(/"/g, '""')}"`,
            isExtreme ? '' : `"${(q.options?.[1] || '').replace(/"/g, '""')}"`,
            isExtreme ? '' : `"${(q.options?.[2] || '').replace(/"/g, '""')}"`,
            isExtreme ? '' : `"${(q.options?.[3] || '').replace(/"/g, '""')}"`,
            isExtreme ? `"${(q.correctAnswer || '').replace(/"/g, '""')}"` : (q.options ? String.fromCharCode(65 + q.options.findIndex(opt => opt === q.correctAnswer)) : ''),
            q.level,
            `"${(q.chapter?.name || '').replace(/"/g, '""')}"`,
            `"${(subjectName || '').replace(/"/g, '""')}"`,
            q.status || 'draft'
        ];
        return row.join(',');
    });
    
    const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `questions_export_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function parseCSVQuestions(csvText: string): { data: CreateQuestionDto[]; errors: string[] } {
    const lines = csvText.trim().split('\n');
    const errors: string[] = [];
    const data: CreateQuestionDto[] = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
        try {
            const line = lines[i];
            if (!line) continue;
            
            // Simple CSV parsing (handles basic cases)
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            
            if (values.length < 6) {
                errors.push(`Row ${i + 1}: Not enough columns`);
                continue;
            }
            
            const [question, optA, optB, optC, optD, correctAnswer, level, _chapterName, _subjectName, status] = values;
            
            if (!question) {
                errors.push(`Row ${i + 1}: Missing question text`);
                continue;
            }
            
            const isExtreme = (level || '').toLowerCase() === 'extreme';
            const parsedLevel = (['easy', 'medium', 'hard', 'expert', 'extreme'].includes((level || '').toLowerCase()) 
                ? level?.toLowerCase() 
                : 'easy') as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
            
            const questionDto: CreateQuestionDto = {
                question: question.replace(/^"|"$/g, '').replace(/""/g, '"'),
                level: parsedLevel,
                chapterId: '', // Must be set by caller
                status: (status?.toLowerCase() === 'published' ? 'published' : 'draft') as 'published' | 'draft',
                correctAnswer: '', // Will be set below
                options: null, // Will be set below
            };
            
            if (isExtreme) {
                questionDto.options = null;
                questionDto.correctAnswer = correctAnswer?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
                questionDto.correctLetter = null;
            } else {
                questionDto.options = [
                    (optA || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
                    (optB || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
                    (optC || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
                    (optD || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
                ];
                
                // Parse correct answer (either letter A-D or full text)
                const ca = (correctAnswer || '').replace(/^"|"$/g, '').replace(/""/g, '"');
                const caUpper = ca.toUpperCase();
                if (['A', 'B', 'C', 'D'].includes(caUpper)) {
                    questionDto.correctLetter = caUpper;
                    questionDto.correctAnswer = questionDto.options[['A', 'B', 'C', 'D'].indexOf(caUpper)] || '';
                } else {
                    questionDto.correctLetter = null;
                    questionDto.correctAnswer = ca;
                }
            }
            
            data.push(questionDto);
        } catch (e) {
            errors.push(`Row ${i + 1}: Parse error - ${String(e)}`);
        }
    }
    
    return { data, errors };
}


