/**
 * ============================================================================
 * RiddleCard — grid card for a single image riddle
 * ============================================================================
 * Difficulty chip top-left, timer chip top-right, title, non-blurred answer
 * placeholder (real answer text only mounted once revealed), lazy image with
 * broken-image fallback.
 * ============================================================================
 */

'use client';

import Image from 'next/image';

import type { ImageRiddle } from '@/lib/image-riddles-api';

import { difficultyColors, difficultyLabels, formatTime, resolveTimerSeconds } from '../lib/game';

export interface RiddleCardProps {
  riddle: ImageRiddle;
  isRevealed: boolean;
  isSolved: boolean;
  hasImageError: boolean;
  onOpen: (riddle: ImageRiddle) => void;
  onToggleReveal: (id: string) => void;
  onImageError: (id: string) => void;
}

export default function RiddleCard({
  riddle,
  isRevealed,
  isSolved,
  hasImageError,
  onOpen,
  onToggleReveal,
  onImageError,
}: RiddleCardProps) {
  return (
    <div
      onClick={() => onOpen(riddle)}
      className="group cursor-pointer flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100"
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
            onError={() => onImageError(riddle.id)}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}

        {/* Top Overlay Gradient for readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent"></div>

        {/* Difficulty Badge (Top Left) */}
        <div
          className={`absolute top-4 left-4 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${difficultyColors[riddle.difficulty]}`}
        >
          {difficultyLabels[riddle.difficulty]}
        </div>

        {/* Time Badge (Top Right) */}
        {riddle.showTimer !== false && (
          <div className="absolute top-4 right-4 flex items-center justify-center rounded-full bg-slate-900/60 shadow-sm px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            ⏱️ {formatTime(resolveTimerSeconds(riddle))}
          </div>
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
            {isRevealed ? '👁️ Hide' : '🕶️ Reveal'}
          </button>
        </div>
      </div>
    </div>
  );
}
