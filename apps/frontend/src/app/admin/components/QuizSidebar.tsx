'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { BookOpen, ChevronDown, Plus, GripVertical, Pencil } from 'lucide-react';
import type { Subject } from '../types';

interface QuizSidebarProps {
  subjects: Subject[];
  activeSection: string;
  sidebarOpen: boolean;
  quizModuleExpanded: boolean;
  onToggleExpand: () => void;
  onSelectSubject: (slug: string) => void;
  onAddSubject: (category: 'academic' | 'professional' | 'entertainment') => void;
  onEditSubject: (subject: Subject) => void;
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
  onEditSubject,
  onReorderSubjects,
}: QuizSidebarProps): JSX.Element {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetCategory, setDropTargetCategory] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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
    // Set drag data
    e.dataTransfer.setData('text/plain', String(subject.id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, category: string, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    setDropTargetCategory(category);
    if (index !== undefined) {
      setDropTargetIndex(index);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDropTargetCategory(null);
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCategory: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedIdStr = e.dataTransfer.getData('text/plain');
    const draggedIdNum = parseInt(draggedIdStr, 10);
    
    setDropTargetCategory(null);
    setDropTargetIndex(null);

    if (!draggedIdStr || isNaN(draggedIdNum)) {
      setDraggedId(null);
      return;
    }

    const draggedSubject = subjects.find(s => s.id === draggedIdNum);
    if (!draggedSubject) {
      setDraggedId(null);
      return;
    }

    // If dropping in same category at same position, do nothing
    if (draggedSubject.category === targetCategory && targetIndex !== undefined) {
      const categorySubjects = subjects.filter(s => s.category === targetCategory).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const currentIndex = categorySubjects.findIndex(s => s.id === draggedIdNum);
      if (currentIndex === targetIndex || currentIndex === targetIndex - 1) {
        setDraggedId(null);
        return;
      }
    }

    // Create new subjects array with updated category
    let newSubjects = subjects.map(s => {
      if (s.id === draggedIdNum) {
        return { ...s, category: targetCategory as 'academic' | 'professional' | 'entertainment' };
      }
      return s;
    });

    // Get subjects in target category
    const categorySubjects = newSubjects.filter(s => s.category === targetCategory).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const otherSubjects = newSubjects.filter(s => s.category !== targetCategory);
    
    // Remove dragged subject from current position
    const movedSubject = categorySubjects.find(s => s.id === draggedIdNum)!;
    let reorderedCategorySubjects = categorySubjects.filter(s => s.id !== draggedIdNum);
    
    // Insert at new position
    const insertIndex = targetIndex !== undefined ? targetIndex : reorderedCategorySubjects.length;
    reorderedCategorySubjects.splice(insertIndex, 0, movedSubject);
    
    // Update order for all subjects in category
    reorderedCategorySubjects = reorderedCategorySubjects.map((s, idx) => ({
      ...s,
      order: idx,
    }));

    onReorderSubjects([...otherSubjects, ...reorderedCategorySubjects]);
    setDraggedId(null);
  }, [subjects, onReorderSubjects]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetCategory(null);
    setDropTargetIndex(null);
  }, []);

  const renderCategorySection = (
    title: string,
    categorySubjects: Subject[],
    category: 'academic' | 'professional' | 'entertainment'
  ) => {
    const isDropTarget = dropTargetCategory === category && dropTargetIndex === null;

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
            categorySubjects.map((subject, index) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                index={index}
                isActive={activeSection === subject.slug}
                isDragging={draggedId === subject.id}
                sidebarOpen={sidebarOpen}
                category={category}
                onSelect={onSelectSubject}
                onEdit={onEditSubject}
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
  index: number;
  isActive: boolean;
  isDragging: boolean;
  sidebarOpen: boolean;
  category: 'academic' | 'professional' | 'entertainment';
  onSelect: (slug: string) => void;
  onEdit: (subject: Subject) => void;
  onDragStart: (e: React.DragEvent, subject: Subject) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, targetCategory: string, targetIndex?: number) => void;
}

const SubjectItem = React.memo(function SubjectItem({
  subject,
  index,
  isActive,
  isDragging,
  sidebarOpen,
  category,
  onSelect,
  onEdit,
  onDragStart,
  onDragEnd,
  onDrop,
}: SubjectItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e, category, index);
  }, [category, index, onDrop]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(subject);
  }, [onEdit, subject]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, subject)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer will-change-transform border-t-2 border-b-2 ${
        isActive
          ? 'bg-blue-600 text-white'
          : isDragOver
            ? 'bg-blue-500/20 border-blue-500'
            : 'text-gray-300 hover:bg-gray-800 border-transparent'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{ transition: 'background-color 0.15s ease, opacity 0.15s ease, border-color 0.15s ease' }}
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
      {sidebarOpen && (
        <>
          <span className="text-sm truncate flex-1">{subject.name}</span>
          <button
            onClick={handleEdit}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-opacity"
            title="Edit subject"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
});
