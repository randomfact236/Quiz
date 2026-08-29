/**
 * ============================================================================
 * RiddleCard — grid card for a single image riddle
 * ============================================================================
 * Difficulty chip top-left, timer chip top-right, title, non-blurred answer
 * placeholder (real answer text only mounted once revealed), lazy image with
 * broken-image fallback. Keyboard operable (C3): role="button" +
 * tabIndex={0} + Enter/Space opens, with the site-standard focus ring.
 * ============================================================================
 */

'use client';

import Image from 'next/image';
import { Bookmark, ChevronDown, Clock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import type { ImageRiddle } from '@/lib/image-riddles-api';

import GuessFeed from './GuessFeed';

import {
  CARD_BLUR_DATA_URL,
  difficultyColors,
  difficultyIcons,
  difficultyLabels,
  formatTime,
  resolveTimerSeconds,
} from '../lib/game';

export interface RiddleCardProps {
  riddle: ImageRiddle;
  isRevealed: boolean;
  isSolved: boolean;
  hasImageError: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  /** Published guess-wall entry count (💬 chip hidden when 0). */
  commentCount?: number;
  /** Card-level share (opens the ShareMenu via the page). */
  onShare?: (riddle: ImageRiddle) => void;
  onOpen: (riddle: ImageRiddle) => void;
  onToggleReveal: (id: string) => void;
  onImageError: (id: string) => void;
}

export default function RiddleCard({
  riddle,
  isRevealed,
  isSolved,
  hasImageError,
  isSaved,
  onToggleSave,
  commentCount,
  onShare,
  onOpen,
  onToggleReveal,
  onImageError,
}: RiddleCardProps) {
  // Inline guess-wall expansion — lets people lurk the comments straight from
  // the card without opening the gameplay modal (masked entries = spoiler-safe).
  const [showComments, setShowComments] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open riddle: ${riddle.title}`}
      onClick={() => onOpen(riddle)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // Space otherwise scrolls the page
          onOpen(riddle);
        }
      }}
      className="group cursor-pointer flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {hasImageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
            <span className="text-5xl">🖼️</span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Image unavailable
            </span>
          </div>
        ) : (
          <Image
            src={riddle.imageUrl}
            alt={riddle.altText || riddle.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={CARD_BLUR_DATA_URL}
            onError={() => onImageError(riddle.id)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {/* Top Overlay Gradient for readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent"></div>

        {/* Difficulty Badge (Top Left) */}
        <div
          className={`absolute top-4 left-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${difficultyColors[riddle.difficulty]}`}
        >
          {(() => {
            const DifficultyIcon = difficultyIcons[riddle.difficulty];
            return DifficultyIcon ? (
              <DifficultyIcon className="h-3 w-3" aria-hidden="true" />
            ) : null;
          })()}
          {difficultyLabels[riddle.difficulty]}
        </div>

        {/* Time Badge (shifted left of the save chip) */}
        {riddle.showTimer !== false && (
          <div
            className={`absolute top-4 flex items-center justify-center gap-1 rounded-full bg-slate-900/60 shadow-sm px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md ${onToggleSave ? 'right-14' : 'right-4'}`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatTime(resolveTimerSeconds(riddle))}
          </div>
        )}

        {/* 🔖 Save chip (Top Right corner) */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Don't open the riddle modal
              onToggleSave(riddle.id);
            }}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-pressed={Boolean(isSaved)}
            aria-label={isSaved ? 'Remove riddle from saved' : 'Save riddle'}
            title={isSaved ? 'Saved — tap to remove' : 'Save'}
          >
            <Bookmark
              className={`h-4 w-4 transition-colors ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="mb-4 line-clamp-2 text-lg font-black tracking-tight text-slate-800 leading-snug">
          {riddle.title}
        </h3>

        {/* Answer Reveal Section (answer text only mounted once revealed) */}
        <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
          <div
            className={`text-sm font-bold overflow-hidden line-clamp-1 ${isRevealed ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            {isRevealed ? riddle.answer : isSolved ? '✓ Solved' : 'Answer Hidden'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleReveal(riddle.id);
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isRevealed ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
          >
            {isRevealed ? (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isRevealed ? 'Hide' : 'Reveal'}
          </button>
        </div>

        {/* Social row: 💬 guess wall (expandable inline) + 🔗 share */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Don't open the riddle modal
              setShowComments((prev) => !prev);
            }}
            aria-expanded={showComments}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              showComments
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
            aria-label={
              showComments
                ? 'Hide the guess wall'
                : `View the guess wall${(commentCount ?? 0) > 0 ? `. ${commentCount} guesses` : ''}`
            }
            title={showComments ? 'Hide the guess wall' : 'View the guess wall'}
          >
            <span aria-hidden="true">💬</span>
            {(commentCount ?? 0) > 0 ? commentCount : 'Comments'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showComments ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(riddle);
              }}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Share riddle"
              title="Share this riddle"
            >
              <span aria-hidden="true">🔗</span> Share
            </button>
          )}
        </div>

        {/* Inline guess wall (spoiler-safe: correct solves are masked) */}
        {showComments && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <GuessFeed riddleId={riddle.id} />
          </div>
        )}
      </div>
    </div>
  );
}
