import { api } from './api-client';

export interface JokeCategory {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    description?: string;
}

export interface Joke {
    id: string;
    joke?: string | undefined;
    category: string;
    categoryId?: string | undefined;
    likes?: number | undefined;
    dislikes?: number | undefined;
    status?: string | undefined;
    setup?: string | undefined;
    punchline?: string | undefined;
    delivery?: string | undefined;
    type?: string | undefined;
}

export async function getJokes(): Promise<Joke[]> {
    const response = await api.get<{ data: Joke[]; total: number }>('/jokes/classic?page=1&limit=100');
    return response.data.data;
}

export async function getJokeCategories(hasContent: boolean = false): Promise<JokeCategory[]> {
    const response = await api.get<JokeCategory[]>(
        `/jokes/classic/categories${hasContent ? '?hasContent=true' : ''}`
    );
    return response.data;
}

export async function voteJoke(id: string, type: 'like' | 'dislike'): Promise<any> {
    const response = await api.post(`/jokes/classic/${id}/vote`, {
        voteType: type
    });
    return response.data;
}
