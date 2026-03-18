'use client';

import { cn } from '@/lib/utils';

export interface ChapterFilterProps {
  value: string;
  onChange: (value: string) => void;
  chapters: { id: string; name: string; count?: number }[];
  className?: string;
}

export function ChapterFilter({ value, onChange, chapters = [], className }: ChapterFilterProps) {
  const totalCount = chapters.reduce((acc, ch) => acc + (ch.count || 0), 0);

  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        onClick={() => onChange('all')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          value === 'all'
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
        )}
      >
        <span>All Chapters</span>
        {totalCount > 0 && (
          <span className={cn(
            'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
            value === 'all' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-700'
          )}>
            {totalCount}
          </span>
        )}
      </button>
      
      {chapters.map((chapter) => {
        const isActive = value === chapter.name;
        const count = chapter.count || 0;
        
        return (
          <button
            key={chapter.id}
            onClick={() => onChange(chapter.name)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              isActive
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
            )}
          >
            <span className="truncate max-w-[120px]">{chapter.name}</span>
            {count > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-700'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ChapterFilter;
