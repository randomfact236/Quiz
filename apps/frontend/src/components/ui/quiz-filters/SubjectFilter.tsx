'use client';

import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubjectFilterProps {
  value: string;
  onChange: (value: string) => void;
  subjects: { id?: string; slug: string; name: string; emoji?: string; count?: number | undefined }[];
  onAddSubject?: () => void;
  onEditSubject?: (subject: { id?: string; slug: string; name: string; emoji?: string; category?: string }) => void;
  onDeleteSubject?: (subject: { id?: string; slug: string; name: string }) => void;
  className?: string;
}

export function SubjectFilter({ 
  value, 
  onChange, 
  subjects = [], 
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  className 
}: SubjectFilterProps) {
  const totalCount = subjects.reduce((acc, sub) => acc + (sub.count || 0), 0);

  // Sort subjects alphabetically A-Z
  const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={cn('space-y-2', className)}>
      {/* Pills Row - Label and pills on same row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700 mr-1">
          Subject{value === 'all' ? ': All' : ''}:
        </span>
        
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
          <span>All</span>
          {totalCount > 0 && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
              value === 'all' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-700'
            )}>
              {totalCount}
            </span>
          )}
        </button>
        
        {sortedSubjects.map((subject) => {
          const isActive = value === subject.slug;
          
          return (
            <div
              key={subject.slug}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              )}
            >
              <button
                onClick={() => onChange(subject.slug)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <span>{subject.emoji || '📚'}</span>
                <span className="truncate max-w-[100px]">{subject.name}</span>
                {subject.count !== undefined && subject.count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-700'
                  )}>
                    {subject.count}
                  </span>
                )}
              </button>
              
              {/* Edit/Delete icons */}
              {!isActive && onEditSubject && onDeleteSubject && (
                <div className="flex items-center ml-1 border-l border-blue-200 pl-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSubject(subject);
                    }}
                    className="p-0.5 text-blue-500 hover:text-blue-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubject(subject);
                    }}
                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Only edit icon for active */}
              {isActive && onEditSubject && onDeleteSubject && (
                <div className="flex items-center ml-1 border-l border-blue-400 pl-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSubject(subject);
                    }}
                    className="p-0.5 text-white/80 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubject(subject);
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
        
        {onAddSubject && (
          <button
            onClick={onAddSubject}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        )}
      </div>
    </div>
  );
}

export default SubjectFilter;