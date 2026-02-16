'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { BookOpen, ChevronDown, Plus, GripVertical } from 'lucide-react';
import type { Subject } from '../types';

interface QuizSidebarProps {
  subjects: Subject[];
  activeSection: string;
  sidebarOpen: boolean;
  quizModuleExpanded: boolean;
  onToggleExpand: () => void;
  onSelectSubject: (slug: string) => void;
  onAddSubject: (category: 'academic' | 'professional' | 'entertainment') => void;
  onReorderSubjects: (subjects: Subject[]) => void;
}

const subjectIcons: Record<string, React.ReactNode> = {
  science: '🧪',
  math: '🔢',
  history: '📜',
  geography: '🌍',
  english: '📚',
  technology: '💻',
};

export function QuizSidebar({
  subjects,
  activeSection,
  sidebarOpen,
  quizModuleExpanded,
  onToggleExpand,
  onSelectSubject,
  onAddSubject,
  onReorderSubjects,
}: QuizSidebarProps): JSX.Element {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Group subjects by category - memoized to prevent recalculation
  const academicSubjects = useMemo(() => 
    subjects.filter(s => s.category === 'academic').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects]
  );
  const professionalSubjects = useMemo(() => 
    subjects.filter(s => s.category === 'professional').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects]
  );
  const entertainmentSubjects = useMemo(() => 
    subjects.filter(s => s.category === 'entertainment').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects]
  );

  const handleDragStart = useCallback((e: React.DragEvent, subject: Subject) => {
    setDraggedId(subject.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== category) {
      setDropTarget(category);
    }
  }, [dropTarget]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    // Small delay to prevent flickering when moving between child elements
    setTimeout(() => {
      setDropTarget(null);
    }, 50);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCategory: string, targetIndex?: number) => {
    e.preventDefault();
    setDropTarget(null);

    if (draggedId === null) return;

    const draggedSubject = subjects.find(s => s.id === draggedId);
    if (!draggedSubject) return;

    // Get subjects in target category
    const targetSubjects = subjects.filter(s => s.category === targetCategory).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    // Create new subjects array
    const newSubjects = subjects.map(s => {
      if (s.id === draggedId) {
        return { ...s, category: targetCategory as 'academic' | 'professional' | 'entertainment' };
      }
      return s;
    });

    // Reorder within the target category
    if (targetIndex !== undefined) {
      const categorySubjects = newSubjects.filter(s => s.category === targetCategory);
      const otherSubjects = newSubjects.filter(s => s.category !== targetCategory);
      
      const movedSubject = categorySubjects.find(s => s.id === draggedId)!;
      const otherCategorySubjects = categorySubjects.filter(s => s.id !== draggedId);
      
      otherCategorySubjects.splice(targetIndex, 0, movedSubject);
      
      // Update order for all subjects in category
      const reorderedCategorySubjects = otherCategorySubjects.map((s, idx) => ({
        ...s,
        order: idx,
      }));

      onReorderSubjects([...otherSubjects, ...reorderedCategorySubjects]);
    } else {
      onReorderSubjects(newSubjects);
    }

    setDraggedId(null);
  }, [draggedId, subjects, onReorderSubjects]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTarget(null);
  }, []);

  const renderCategorySection = (
    title: string,
    categorySubjects: Subject[],
    category: 'academic' | 'professional' | 'entertainment'
  ) => {
    const isDropTarget = dropTarget === category;

    return (
      <div
        className={`mb-4 rounded-lg border-2 will-change-transform ${
          isDropTarget ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'
        }`}
        style={{ transition: 'background-color 0.15s ease, border-color 0.15s ease' }}
        onDragOver={(e) => handleDragOver(e, category)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, category, categorySubjects.length)}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-t-lg">
          {sidebarOpen ? (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {title}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-500" />
          )}
          {sidebarOpen && (
            <button
              onClick={() => onAddSubject(category)}
              className="flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 transition-colors"
              title={`Add ${title} Subject`}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        {/* Subjects List */}
        <div className="py-1">
          {categorySubjects.length === 0 ? (
            <div className={`px-3 py-2 text-xs text-gray-500 ${sidebarOpen ? '' : 'text-center'}`}>
              {sidebarOpen ? 'No subjects yet' : '-'}
            </div>
          ) : (
            categorySubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                isActive={activeSection === subject.slug}
                isDragging={draggedId === subject.id}
                sidebarOpen={sidebarOpen}
                category={category}
                onSelect={onSelectSubject}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-2">
      {/* Quiz Module Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-800 transition-colors"
      >
        {sidebarOpen ? (
          <>
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Quiz Module
            </span>
            <span className={`transition-transform ${quizModuleExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-3 h-3" />
            </span>
          </>
        ) : (
          <span className="flex items-center justify-center w-5 h-5">
            <BookOpen className="w-4 h-4" />
          </span>
        )}
      </button>

      {/* Category Sections */}
      {quizModuleExpanded && (
        <div className="px-2 mt-2">
          {renderCategorySection('Academic', academicSubjects, 'academic')}
          {renderCategorySection('Professional & Life', professionalSubjects, 'professional')}
          {renderCategorySection('Entertainment & Culture', entertainmentSubjects, 'entertainment')}
        </div>
      )}
    </div>
  );
}

// Memoized Subject Item component to prevent unnecessary re-renders
interface SubjectItemProps {
  subject: Subject;
  isActive: boolean;
  isDragging: boolean;
  sidebarOpen: boolean;
  category: 'academic' | 'professional' | 'entertainment';
  onSelect: (slug: string) => void;
  onDragStart: (e: React.DragEvent, subject: Subject) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, targetCategory: string, targetIndex?: number) => void;
}

const SubjectItem = React.memo(function SubjectItem({
  subject,
  isActive,
  isDragging,
  sidebarOpen,
  category,
  onSelect,
  onDragStart,
  onDragEnd,
  onDrop,
}: SubjectItemProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    onDrop(e, category);
  }, [category, onDrop]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, subject)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer will-change-transform ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{ transition: 'background-color 0.1s ease, opacity 0.1s ease' }}
      onClick={() => onSelect(subject.slug)}
    >
      <span
        className="flex items-center justify-center text-gray-500 group-hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </span>
      <span className="flex items-center justify-center w-5 h-5 shrink-0 text-lg">
        {subjectIcons[subject.emoji] || subject.emoji || '📚'}
      </span>
      {sidebarOpen && <span className="text-sm truncate">{subject.name}</span>}
    </div>
  );
});
