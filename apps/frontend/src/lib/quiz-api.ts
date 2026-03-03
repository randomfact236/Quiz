import { api } from './api-client';

export interface QuizSubject {
    id: string;
    name: string;
    slug: string;
    emoji: string;
    description?: string;
    isActive: boolean;
}

export async function getSubjects(hasContent: boolean = false): Promise<QuizSubject[]> {
    const response = await api.get<{ data: QuizSubject[]; total: number }>(
        `/quiz/subjects${hasContent ? '?hasContent=true' : ''}`
    );
    return response.data.data;
}
