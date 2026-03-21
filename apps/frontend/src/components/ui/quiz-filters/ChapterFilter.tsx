'use client';

import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChapterFilterProps {
  value: string;
  onChange: (value: string) => void;
  chapters: { id: string; name: string; count?: number; subjectId?: string }[];
  onAddChapter?: () => void;
  onEditChapter?: (chapter: { id: string; name: string; subjectId?: string }) => void;
  onDeleteChapter?: (chapter: { id: string; name: string }) => void;
  className?: string;
}

export function ChapterFilter({ 
  value, 
  onChange, 
  chapters = [], 
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  className 
}: ChapterFilterProps) {
  const totalCount = chapters.reduce((acc, ch) => acc + (ch.count || 0), 0);

  // Sort chapters alphabetically A-Z
  const sortedChapters = [...chapters].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={cn('space-y-2', className)}>
      {/* Pills Row - Label and pills on same row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700 mr-1">
          Chapter{value === 'all' ? ': All' : ''}:
        </span>
        
        <button
          onClick={() => onChange('all')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
            value === 'all'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
          )}
        >
          <span>All</span>
          {totalCount > 0 && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
              value === 'all' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-700'
            )}>
              {totalCount}
            </span>
          )}
        </button>
        
        {sortedChapters.map((chapter) => {
          const isActive = value === chapter.name;
          
          return (
            <div
              key={chapter.id}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
                isActive
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              )}
            >
              <button
                onClick={() => onChange(chapter.name)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <span className="truncate max-w-[100px]">{chapter.name}</span>
                {chapter.count !== undefined && chapter.count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-700'
                  )}>
                    {chapter.count}
                  </span>
                )}
              </button>
              
              {/* Edit/Delete icons */}
              {!isActive && onEditChapter && onDeleteChapter && (
                <div className="flex items-center ml-1 border-l border-purple-200 pl-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditChapter(chapter);
                    }}
                    className="p-0.5 text-purple-500 hover:text-purple-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChapter(chapter);
                    }}
                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Only edit icon for active */}
              {isActive && onEditChapter && onDeleteChapter && (
                <div className="flex items-center ml-1 border-l border-purple-400 pl-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditChapter(chapter);
                    }}
                    className="p-0.5 text-white/80 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChapter(chapter);
                    }}
                    className="p-0.5 text-white/80 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {onAddChapter && (
          <button
            onClick={onAddChapter}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Chapter
          </button>
        )}
      </div>
    </div>
  );
}

export default ChapterFilter;