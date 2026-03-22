'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Subject } from '@/app/admin/types';

// Types
export interface SidebarSection {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  isCollapsed: boolean;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  sectionId: string;
  name: string;
  slug: string;
  emoji?: string;
  icon?: string;
  count?: number;
  order: number;
}

interface DraggableSidebarProps {
  sections: SidebarSection[];
  activeSection: string;
  sidebarOpen: boolean;
  onSectionClick: (sectionId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
  onSectionsChange: (sections: SidebarSection[]) => void;
}

// Sortable Section Header Component
interface SortableSectionProps {
  section: SidebarSection;
  isActive: boolean;
  isExpanded: boolean;
  sidebarOpen: boolean;
  onToggle: () => void;
  onEdit: (section: SidebarSection) => void;
  onDelete: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
}

function SortableSection({
  section,
  isActive,
  isExpanded,
  sidebarOpen,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: 'section', section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);

  const handleSave = () => {
    onEdit({ ...section, name: editName });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(section.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Section Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 mt-2 text-xs font-semibold uppercase tracking-wider',
          'text-gray-500 hover:bg-gray-800 transition-colors cursor-pointer',
          isActive && 'text-blue-400'
        )}
        onClick={onToggle}
      >
        {sidebarOpen ? (
          <>
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-green-400 hover:bg-gray-700 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-400 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex items-center gap-2 pl-4">
                  {section.name}
                </span>
                <div className="flex items-center gap-1">
                  {/* Edit button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-opacity"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${section.name}" section?`)) {
                        onDelete(section.id);
                      }
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-900/50 text-red-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {/* Add button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddItem(section.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-900/50 text-blue-400 rounded transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  {/* Expand/Collapse */}
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          <span className="flex items-center justify-center w-5 h-5">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
      </div>
    </div>
  );
}

// Sortable Item Component
interface SortableItemProps {
  item: SidebarItem;
  sectionId: string;
  isActive: boolean;
  sidebarOpen: boolean;
  onClick: () => void;
  onEdit: (item: SidebarItem) => void;
  onDelete: (itemId: string) => void;
}

function SortableItem({
  item,
  sectionId,
  isActive,
  sidebarOpen,
  onClick,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'item', item, sectionId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const handleSave = () => {
    onEdit({ ...item, name: editName });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Item */}
      {isEditing ? (
        <div
          className="flex items-center gap-2 px-4 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="pl-4">{item.emoji || '📚'}</span>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 outline-none"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-400 hover:bg-gray-700 rounded"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-400 hover:bg-gray-700 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={onClick}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors',
            'hover:bg-gray-800',
            isActive && 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          <span className="flex items-center gap-3 pl-4">
            <span>{item.emoji || item.icon || '📚'}</span>
            {sidebarOpen && <span className="truncate">{item.name}</span>}
          </span>
          {sidebarOpen && (
            <div className="flex items-center gap-1">
              {item.count !== undefined && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-blue-500' : 'bg-gray-700 text-gray-300'
                )}>
                  {item.count}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-opacity"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${item.name}"?`)) {
                    onDelete(item.id);
                  }
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-900/50 text-red-400 rounded transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

// Add Section Button
function AddSectionButton({ onClick, sidebarOpen }: { onClick: () => void; sidebarOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors',
        !sidebarOpen && 'justify-center'
      )}
    >
      <Plus className="w-4 h-4" />
      {sidebarOpen && <span className="ml-2">Add Section</span>}
    </button>
  );
}

// Main DraggableSidebar Component
export function DraggableSidebar({
  sections,
  activeSection,
  sidebarOpen,
  onSectionClick,
  onToggleCollapse,
  onSectionsChange,
}: DraggableSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<SidebarItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const activeData = active.data.current;
    if (activeData?.['type'] === 'item') {
      setActiveItem(activeData['item']);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle item moving between sections
    if (activeData?.['type'] === 'item' && overData?.['type'] === 'section') {
      const activeItem = activeData['item'];
      const overSection = overData['section'];

      if (activeItem.sectionId !== overSection.id) {
        onSectionsChange(
          sections.map((section) => {
            if (section.id === activeItem.sectionId) {
              return {
                ...section,
                items: section.items.filter((item) => item.id !== activeItem.id),
              };
            }
            if (section.id === overSection.id) {
              return {
                ...section,
                items: [...section.items, { ...activeItem, sectionId: overSection.id }],
              };
            }
            return section;
          })
        );
      }
    }
  }, [sections, onSectionsChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Reorder sections
    if (activeData?.['type'] === 'section' && overData?.['type'] === 'section') {
      const oldIndex = sections.findIndex((s) => s.id === activeId);
      const newIndex = sections.findIndex((s) => s.id === overId);

      onSectionsChange(arrayMove(sections, oldIndex, newIndex));
    }

    // Reorder items within section
    if (activeData?.['type'] === 'item' && overData?.['type'] === 'item') {
      const activeItem = activeData['item'];
      const overItem = overData['item'];

      if (activeItem.sectionId === overItem.sectionId) {
        const section = sections.find((s) => s.id === activeItem.sectionId);
        if (section) {
          const oldIndex = section.items.findIndex((i) => i.id === activeId);
          const newIndex = section.items.findIndex((i) => i.id === overId);

          onSectionsChange(
            sections.map((s) =>
              s.id === section.id
                ? { ...s, items: arrayMove(s.items, oldIndex, newIndex) }
                : s
            )
          );
        }
      }
    }

    setActiveId(null);
    setActiveItem(null);
  }, [sections, onSectionsChange]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const handleAddSection = useCallback(() => {
    const newSection: SidebarSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      slug: `new-section-${Date.now()}`,
      icon: 'folder',
      color: 'blue',
      order: sections.length,
      isCollapsed: false,
      items: [],
    };
    onSectionsChange([...sections, newSection]);
  }, [sections, onSectionsChange]);

  const handleAddItem = useCallback((sectionId: string) => {
    const newItem: SidebarItem = {
      id: `item-${Date.now()}`,
      sectionId,
      name: 'New Item',
      slug: `new-item-${Date.now()}`,
      emoji: '📚',
      order: 0,
    };
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    );
  }, [sections, onSectionsChange]);

  const handleEditSection = useCallback((updatedSection: SidebarSection) => {
    onSectionsChange(
      sections.map((section) =>
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  }, [sections, onSectionsChange]);

  const handleEditItem = useCallback((updatedItem: SidebarItem) => {
    onSectionsChange(
      sections.map((section) =>
        section.id === updatedItem.sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              ),
            }
          : section
      )
    );
  }, [sections, onSectionsChange]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    onSectionsChange(sections.filter((section) => section.id !== sectionId));
  }, [sections, onSectionsChange]);

  const handleDeleteItem = useCallback((itemId: string) => {
    onSectionsChange(
      sections.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.id !== itemId),
      }))
    );
  }, [sections, onSectionsChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <nav className="flex-1 overflow-y-auto py-2">
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <div key={section.id}>
              <SortableSection
                section={section}
                isActive={false}
                isExpanded={!section.isCollapsed}
                sidebarOpen={sidebarOpen}
                onToggle={() => onToggleCollapse(section.id)}
                onEdit={handleEditSection}
                onDelete={handleDeleteSection}
                onAddItem={handleAddItem}
              />

              <AnimatePresence>
                {!section.isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <SortableContext
                      items={section.items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {section.items.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          sectionId={section.id}
                          isActive={activeSection === item.slug}
                          sidebarOpen={sidebarOpen}
                          onClick={() => onSectionClick(item.slug)}
                          onEdit={handleEditItem}
                          onDelete={handleDeleteItem}
                        />
                      ))}
                    </SortableContext>

                    {section.items.length === 0 && sidebarOpen && (
                      <div className="px-8 py-2 text-sm text-gray-500 italic">
                        No items yet
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </SortableContext>

        <AddSectionButton onClick={handleAddSection} sidebarOpen={sidebarOpen} />
      </nav>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeId && activeItem ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 text-white opacity-80 rounded">
            <GripVertical className="w-4 h-4" />
            <span>{activeItem.emoji || '📚'}</span>
            <span>{activeItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Helper function to convert subjects to sidebar format
export function subjectsToSidebarSections(subjects: Subject[]): SidebarSection[] {
  return [
    {
      id: 'academic',
      name: 'Academic',
      slug: 'academic',
      icon: 'book',
      color: 'blue',
      order: 0,
      isCollapsed: false,
      items: subjects.map((subject, index) => ({
        id: subject.id,
        sectionId: 'academic',
        name: subject.name,
        slug: subject.slug,
        emoji: subject.emoji,
        order: index,
        count: 0, // Will be populated from API
      })),
    },
    {
      id: 'other-modules',
      name: 'Other Modules',
      slug: 'other-modules',
      icon: 'puzzle',
      color: 'purple',
      order: 1,
      isCollapsed: false,
      items: [
        {
          id: 'jokes',
          sectionId: 'other-modules',
          name: 'Dad Jokes',
          slug: 'jokes',
          icon: 'smile',
          order: 0,
        },
        {
          id: 'riddle-mcq',
          sectionId: 'other-modules',
          name: 'Riddle MCQ',
          slug: 'riddle-mcq',
          icon: 'puzzle',
          order: 1,
        },
        {
          id: 'image-riddles',
          sectionId: 'other-modules',
          name: 'Image Riddles',
          slug: 'image-riddles',
          icon: 'image',
          order: 2,
        },
      ],
    },
    {
      id: 'system',
      name: 'System',
      slug: 'system',
      icon: 'settings',
      color: 'gray',
      order: 2,
      isCollapsed: false,
      items: [
        {
          id: 'users',
          sectionId: 'system',
          name: 'Users',
          slug: 'users',
          icon: 'users',
          order: 0,
        },
        {
          id: 'settings',
          sectionId: 'system',
          name: 'Settings',
          slug: 'settings',
          icon: 'settings',
          order: 1,
        },
      ],
    },
  ];
}

export default DraggableSidebar;
