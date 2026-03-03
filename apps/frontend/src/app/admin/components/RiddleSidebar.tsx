'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, GripVertical, Puzzle } from 'lucide-react';

interface RiddleSidebarProps {
    chapters: string[];
    activeSection: string;
    activeChapter: string | null;
    sidebarOpen: boolean;
    moduleExpanded: boolean;
    onToggleExpand: () => void;
    onSelectChapter: (chapter: string) => void;
    onReorderChapters: (chapters: string[]) => void;
    chapterCounts?: Record<string, number>;
}

export function RiddleSidebar({
    chapters,
    activeSection,
    activeChapter,
    sidebarOpen,
    moduleExpanded,
    onToggleExpand,
    onSelectChapter,
    onReorderChapters,
    chapterCounts = {},
}: RiddleSidebarProps): JSX.Element {
    const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, chapter: string) => {
        setDraggedChapter(chapter);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', chapter);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetIndex(index);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        setDropTargetIndex(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedName = e.dataTransfer.getData('text/plain');
        setDropTargetIndex(null);

        if (!draggedName || draggedName === '') {
            setDraggedChapter(null);
            return;
        }

        const currentIndex = chapters.findIndex(c => c === draggedName);
        if (currentIndex === -1 || currentIndex === targetIndex) {
            setDraggedChapter(null);
            return;
        }

        // Create new chapters array
        const newChapters = [...chapters];

        // Remove dragged chapter from current position
        newChapters.splice(currentIndex, 1);

        // Insert at new position
        // If we're dragging downwards, the target index shifts by 1 because we removed an item before it
        const insertIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
        newChapters.splice(insertIndex, 0, draggedName);

        onReorderChapters(newChapters);
        setDraggedChapter(null);
    }, [chapters, onReorderChapters]);

    const handleDragEnd = useCallback(() => {
        setDraggedChapter(null);
        setDropTargetIndex(null);
    }, []);

    const isRiddlesActive = activeSection === 'riddles';

    return (
        <div>
            {/* Main Riddles header — styled like other MenuItems */}
            <button
                onClick={onToggleExpand}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-sm font-medium ${isRiddlesActive && !activeChapter
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
            >
                <Puzzle className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                    <>
                        <span className="flex-1 text-left">Riddles</span>
                        <ChevronDown
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${moduleExpanded ? 'rotate-180' : ''}`}
                        />
                    </>
                )}
            </button>

            {/* Chapters List */}
            {moduleExpanded && sidebarOpen && (
                <div className="px-2 mt-1">
                    <div className="rounded-lg border border-transparent">
                        {chapters.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500 italic">
                                No chapters added yet
                            </div>
                        ) : (
                            chapters.map((chapter, index) => {
                                const isDragging = draggedChapter === chapter;
                                const isDragOver = dropTargetIndex === index;
                                // It is active if we are in the riddles section AND this chapter is selected
                                const isActive = activeSection === 'riddles' && activeChapter === chapter;

                                return (
                                    <div
                                        key={`riddle-chapter-${chapter}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, chapter)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onClick={() => onSelectChapter(chapter)}
                                        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer will-change-transform border-t-2 border-b-2 rounded ${isActive
                                            ? 'bg-purple-600 text-white border-transparent'
                                            : isDragOver
                                                ? 'bg-purple-500/20 border-purple-500'
                                                : 'text-gray-300 hover:bg-gray-800 border-transparent text-sm'
                                            } ${isDragging ? 'opacity-50' : ''}`}
                                        style={{ transition: 'background-color 0.15s ease, opacity 0.15s ease, border-color 0.15s ease' }}
                                    >
                                        <span
                                            className={`flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}
                                            title="Drag to reorder"
                                        >
                                            <GripVertical className="w-3 h-3" />
                                        </span>
                                        <span className="text-sm truncate flex-1 leading-tight">{chapter}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                            {chapterCounts[chapter] || 0}
                                        </span>
                                    </div>
                                );
                            })
                        )}

                        {/* Invisible drop zone at the very bottom so we can drag to the end of the list */}
                        {chapters.length > 0 && (
                            <div
                                className={`h-4 border-t-2 border-b-2 w-full transition-colors ${dropTargetIndex === chapters.length ? 'border-purple-500 bg-purple-500/20' : 'border-transparent'}`}
                                onDragOver={(e) => handleDragOver(e, chapters.length)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, chapters.length)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
