/**
 * ============================================================================
 * Question Likes API (BUG-037 — one-tap heart; BUG-048 — public totals)
 * ============================================================================
 * One-tap heart on quiz/riddle questions. Idempotent per guest identity;
 * like TOTALS are public (LikeButton shows them beside the heart). The
 * 1/2/3+ BUCKETS derived from the same rows stay internal (admin view only).
 * After a login merge the server matches the account id as well, so the
 * filled heart follows the user across devices.
 * ============================================================================
 */

import { api } from './api-client';
import { getGuestId } from './guest-id';

export type QuestionLikeContentType = 'quiz' | 'riddle';

export interface LikeResponse {
  liked: boolean;
  alreadyLiked: boolean;
}

/** Capture a like. Idempotent server-side; safe to call optimistically. */
export async function likeQuestion(
  contentType: QuestionLikeContentType,
  questionId: string
): Promise<LikeResponse | null> {
  const guestId = getGuestId();
  if (!guestId || !/^[0-9a-f-]{36}$/i.test(questionId)) return null;
  try {
    const response = await api.post<LikeResponse>('/question-likes', {
      contentType,
      questionId,
      guestId,
    });
    return response.data;
  } catch {
    return null;
  }
}

/** Public like totals per question id (BUG-048: counts visible to all). */
export async function getQuestionLikeCounts(
  contentType: QuestionLikeContentType,
  questionIds: string[]
): Promise<Record<string, number>> {
  if (questionIds.length === 0) return {};
  try {
    const response = await api.get<Record<string, number>>(
      `/question-likes/counts?contentType=${contentType}&ids=${encodeURIComponent(questionIds.join(','))}`
    );
    return response.data;
  } catch {
    return {};
  }
}

/** Did this guest already like the question (restores the filled heart). */
export async function likedByMe(
  contentType: QuestionLikeContentType,
  questionId: string
): Promise<boolean> {
  const guestId = getGuestId();
  if (!guestId || !/^[0-9a-f-]{36}$/i.test(questionId)) return false;
  try {
    // The endpoint returns a BARE boolean — reading `.liked` off it always
    // yielded undefined, so the heart never restored (found in manual
    // verification 2026-09-20).
    const response = await api.get<boolean>(
      `/question-likes/my?contentType=${contentType}&questionId=${questionId}&guestId=${encodeURIComponent(guestId)}`
    );
    return response.data === true;
  } catch {
    return false;
  }
}
