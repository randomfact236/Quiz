/**
 * ============================================================================
 * Duels API client (NOW-09) — thin wrapper over the duels public endpoints.
 * Race mode: both players get the same frozen question set; the server grades
 * every pick and reveals scores only when the match resolves.
 * ============================================================================
 */

import { api } from './api-client';

export interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface DuelParticipantView {
  playerName: string | null;
  completed: number;
  correct?: number;
  score?: number;
  durationMs?: number;
  finishedAt?: string;
}

export interface DuelPoll {
  status: 'waiting' | 'running' | 'finished' | 'abandoned';
  total: number;
  level: string;
  me: DuelParticipantView;
  opponent: DuelParticipantView | null;
}

export interface DuelJoinView {
  status: string;
  level: string;
  questions: DuelQuestion[];
  total: number;
}

export async function createDuel(input: {
  level: string;
  questionCount: number;
  playerName: string;
  guestId: string;
}): Promise<{ code: string }> {
  const response = await api.post<{ match: unknown; code: string }>('/duels', input);
  return response.data;
}

export async function joinDuel(
  code: string,
  input: { playerName: string; guestId: string }
): Promise<DuelJoinView> {
  const response = await api.post<DuelJoinView>(`/duels/${code}/join`, input);
  return response.data;
}

export async function pollDuel(code: string, guestId: string): Promise<DuelPoll> {
  const response = await api.get<DuelPoll>(`/duels/${code}?guestId=${encodeURIComponent(guestId)}`);
  return response.data;
}

export async function sendDuelAnswer(
  code: string,
  input: { guestId: string; questionId: string; selected: string }
): Promise<{ correct: boolean; completed: number }> {
  const response = await api.post<{ correct: boolean; completed: number }>(
    `/duels/${code}/answer`,
    input
  );
  return response.data;
}

export async function finishDuel(code: string, guestId: string): Promise<DuelPoll> {
  const response = await api.post<DuelPoll>(`/duels/${code}/finish`, { guestId });
  return response.data;
}

export async function leaveDuel(code: string, guestId: string): Promise<void> {
  await api.post(`/duels/${code}/leave`, { guestId });
}
