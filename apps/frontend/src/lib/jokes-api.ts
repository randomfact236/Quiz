import { api } from './api-client';

export interface JokeCategory {
    id: string;
    name: string;
    slug: string;
    emoji: string;
    description?: string;
}

export async function getJokeCategories(hasContent: boolean = false): Promise<JokeCategory[]> {
    const response = await api.get<JokeCategory[]>(
        `/jokes/classic/categories${hasContent ? '?hasContent=true' : ''}`
    );
    return response.data;
}
