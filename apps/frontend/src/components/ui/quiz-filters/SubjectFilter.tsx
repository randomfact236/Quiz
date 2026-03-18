'use client';

import { cn } from '@/lib/utils';

export interface SubjectFilterProps {
  value: string;
  onChange: (value: string) => void;
  subjects: { slug: string; name: string; emoji?: string; count?: number }[];
  className?: string;
}

export function SubjectFilter({ value, onChange, subjects = [], className }: SubjectFilterProps) {
  const totalCount = subjects.reduce((acc, sub) => acc + (sub.count || 0), 0);

  if (subjects.length === 0) {
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
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        )}
      >
        <span>All Subjects</span>
        {totalCount > 0 && (
          <span className={cn(
            'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
            value === 'all' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-700'
          )}>
            {totalCount}
          </span>
        )}
      </button>
      
      {subjects.map((subject) => {
        const isActive = value === subject.slug;
        const count = subject.count || 0;
        
        return (
          <button
            key={subject.slug}
            onClick={() => onChange(subject.slug)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            )}
          >
            <span>{subject.emoji || '📚'}</span>
            <span className="truncate max-w-[120px]">{subject.name}</span>
            {count > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-700'
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

export default SubjectFilter;
