/**
 * ============================================================================
 * Comments API Service
 * ============================================================================
 * Backend integration for the shared comments feed (comments-system plan):
 * guess/chip/comment posts on image riddles, 💬 replies on dad jokes,
 * delete-own by guestId, and per-content counts for the 💬 chips.
 * ============================================================================
 */

import { adminApi, api } from './api-client';
import { getGuestId } from './guest-id';

// ============================================================================
// Types — mirror the backend PublicComment shape
// ============================================================================

export type CommentContentType = 'image-riddle' | 'joke';
export type CommentKind = 'guess' | 'chip' | 'comment';
export type CommentChipValue = 'never-got' | 'so-obvious' | 'so-close';

export interface Comment {
  id: string;
  kind: CommentKind;
  /** null when masked (correct guess) or when the entry is a chip tap. */
  text: string | null;
  chip: string | null;
  masked: boolean;
  createdAt: string;
  mine?: boolean;
}

export interface CommentFeedResponse {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
  chipCounts: Record<string, number>;
  guessesToday: number;
}

export interface PostCommentInput {
  contentType: CommentContentType;
  contentId: string;
  kind: CommentKind;
  text?: string;
  chip?: CommentChipValue;
}

// ============================================================================
// Public API
// ============================================================================

/** Get the paginated, masked feed for a riddle/joke. */
export async function getComments(
  contentType: CommentContentType,
  contentId: string,
  page = 1,
  limit = 20
): Promise<CommentFeedResponse> {
  const response = await api.get<CommentFeedResponse>(
    `/comments/${contentType}/${contentId}?page=${page}&limit=${limit}`
  );
  return response.data;
}

/** Get the caller's own comments on one content item (delete-own UI). */
export async function getMyComments(
  contentType: CommentContentType,
  contentId: string
): Promise<Comment[]> {
  const guestId = getGuestId();
  if (!guestId) return [];
  const response = await api.get<Comment[]>(
    `/comments/my?contentType=${contentType}&contentId=${contentId}&guestId=${encodeURIComponent(guestId)}`
  );
  return response.data;
}

/**
 * Post a guess / chip tap / comment. Fire-and-forget friendly by design:
 * callers must never block the reveal on this (plan rule: content first),
 * so most call sites should use `postCommentOptimistic`.
 */
export async function postComment(input: PostCommentInput): Promise<Comment | null> {
  try {
    const response = await api.post<Comment>('/comments', {
      ...input,
      guestId: getGuestId(),
    });
    return response.data;
  } catch {
    // Network/validation failure never blocks gameplay (plan §1).
    return null;
  }
}

/** Post without awaiting the result — for vote-style fire-and-forget taps. */
export function postCommentOptimistic(input: PostCommentInput): void {
  void postComment(input);
}

/** Delete one of the caller's own comments. */
export async function deleteMyComment(id: string): Promise<boolean> {
  const guestId = getGuestId();
  if (!guestId) return false;
  try {
    await api.delete(`/comments/${id}?guestId=${encodeURIComponent(guestId)}`);
    return true;
  } catch {
    return false;
  }
}

/** Comment counts per content ID (💬 chips on the jokes grid). */
export async function getCommentCounts(contentIds: string[]): Promise<Record<string, number>> {
  if (contentIds.length === 0) return {};
  const response = await api.get<Record<string, number>>(
    `/comments/counts?ids=${encodeURIComponent(contentIds.join(','))}`
  );
  return response.data;
}

// ============================================================================
// Admin API (/admin/comments/*)
// ============================================================================

export type CommentStatus = 'published' | 'draft' | 'trash';
export type CommentBulkAction = 'publish' | 'draft' | 'trash' | 'restore' | 'delete';

/** Moderation row — admin sees the status + guest but still not raw masked text. */
export interface AdminCommentRow extends Comment {
  isCorrect: boolean;
  status: CommentStatus;
  guestId: string;
  contentType: string;
  contentId: string;
}

export interface AdminCommentListParams {
  status?: CommentStatus | undefined;
  contentType?: CommentContentType | undefined;
  page?: number;
  limit?: number;
}

/** Moderation list — all statuses, filterable. */
export async function getCommentsAdmin(
  params: AdminCommentListParams = {}
): Promise<{ data: AdminCommentRow[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.status) qs.append('status', params.status);
  if (params.contentType) qs.append('contentType', params.contentType);
  qs.append('page', String(params.page ?? 1));
  qs.append('limit', String(params.limit ?? 50));
  const response = await adminApi.get<{ data: AdminCommentRow[]; total: number }>(
    `/admin/comments?${qs.toString()}`
  );
  return response.data;
}

/** Bulk publish/trash/restore/delete (single-item row actions reuse this). */
export async function bulkActionComments(
  ids: string[],
  action: CommentBulkAction
): Promise<{ success: boolean; processed: number; succeeded: number; failed: number }> {
  const response = await adminApi.post<{
    success: boolean;
    processed: number;
    succeeded: number;
    failed: number;
  }>('/admin/comments/bulk-action', { ids, action });
  return response.data;
}

// ============================================================================
// Chip picker metadata (shared by riddle modal + tests)
// ============================================================================

export interface ChipOption {
  value: CommentChipValue;
  emoji: string;
  label: string;
}

export const CHIP_OPTIONS: ChipOption[] = [
  { value: 'never-got', emoji: '🤯', label: 'Never got it' },
  { value: 'so-obvious', emoji: '😑', label: 'So obvious' },
  { value: 'so-close', emoji: '🙃', label: 'So close' },
];
