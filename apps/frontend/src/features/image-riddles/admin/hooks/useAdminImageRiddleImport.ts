/**
 * ============================================================================
 * useAdminImageRiddleImport — CSV/JSON import modal state + flows
 * ============================================================================
 * File upload parsing (CSV via lib parser, JSON via structure validator),
 * preview state, and the confirm flow that creates missing categories and
 * bulk-creates riddles as drafts.
 * ============================================================================
 */

'use client';

import { useCallback, useRef, useState } from 'react';

import { toast } from '@/lib/toast';
import { useClickOutside } from '@/hooks/useClickOutside';
import { bulkCreateImageRiddles, createImageRiddleCategory } from '@/lib/image-riddles-api';
import type { ImageRiddle, ImportResult } from '@/app/admin/types';

import { parseImageRiddleCSV } from '../lib/import-export';
import { validateJSONStructure } from '../lib/json';

import type { AdminImageRiddleCategory } from './useAdminImageRiddleData';

export interface UseAdminImageRiddleImportArgs {
  categories: AdminImageRiddleCategory[];
  setCategories: React.Dispatch<React.SetStateAction<AdminImageRiddleCategory[]>>;
  loadData: () => Promise<void>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

export function useAdminImageRiddleImport({
  setCategories,
  loadData,
  setIsSaving,
}: UseAdminImageRiddleImportArgs) {
  // Import states
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>('');
  const [importPreview, setImportPreview] = useState<ImageRiddle[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    importModalRef,
    () => {
      setShowImportModal(false);
      setImportError('');
      setImportPreview([]);
    },
    showImportModal
  );

  const closeImportModal = useCallback(() => {
    setShowImportModal(false);
    setImportError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const backToUpload = useCallback(() => {
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImportError('');
    setImportWarnings([]);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let result: ImportResult<ImageRiddle>;

        if (file.name.endsWith('.json')) {
          const validation = validateJSONStructure<ImageRiddle>(content, 'imageRiddles');
          if (!validation.isValid || !validation.data) {
            setImportError(validation.errors.join('; '));
            return;
          }
          result = {
            success: true,
            imported: validation.data.map((r) => ({
              ...r,
              id: String(Date.now() + Math.floor(Math.random() * 1000)),
            })) as ImageRiddle[],
            failed: [],
            total: validation.data.length,
          };
        } else {
          result = parseImageRiddleCSV(content);
        }

        if (result.imported.length === 0) {
          setImportError(
            result.failed.map((f) => f.error).join('; ') || 'No valid image riddles found'
          );
          return;
        }

        setImportPreview(result.imported);
        if (result.failed.length > 0) {
          setImportWarnings(result.failed.map((f) => `Row ${f.row}: ${f.error}`));
        }
      } catch (err) {
        setImportError(
          'Failed to parse file: ' + (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    };

    reader.readAsText(file);
  }, []);

  const handleConfirmImport = useCallback(
    async (categories: AdminImageRiddleCategory[]) => {
      setIsSaving(true);
      try {
        // Ensure every referenced category exists; map names -> categoryIds
        const categoryNameToId = new Map(categories.map((c) => [c.name, c.id]));
        for (const riddle of importPreview) {
          const name = riddle.category?.name;
          if (name && !categoryNameToId.has(name)) {
            const created = await createImageRiddleCategory({
              name,
              emoji: riddle.category?.emoji || '🔍',
            });
            categoryNameToId.set(name, created.id);
            setCategories((prev) => [
              ...prev,
              { id: created.id, name: created.name, emoji: created.emoji, count: 0 },
            ]);
          }
        }

        const dtos = importPreview.map((r) => ({
          title: r.title,
          imageUrl: r.imageUrl,
          answer: r.answer,
          hint: r.hint || undefined,
          difficulty: r.difficulty,
          timerSeconds: r.timerSeconds ?? null,
          showTimer: r.showTimer ?? true,
          altText: undefined,
          categoryId: (r.category?.name && categoryNameToId.get(r.category.name)) || null,
        }));

        const result = await bulkCreateImageRiddles(dtos);
        setShowImportModal(false);
        setImportPreview([]);
        setImportWarnings([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast.success(
          `📥 Imported ${result.created} riddles${result.failed > 0 ? ` (${result.failed} failed)` : ''} — saved as drafts.`
        );
        if (result.failed > 0) {
          console.warn('Import failures:', result.errors);
        }
        await loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setIsSaving(false);
      }
    },
    [importPreview, setCategories, loadData, setIsSaving]
  );

  return {
    showImportModal,
    setShowImportModal,
    importError,
    importPreview,
    importWarnings,
    fileInputRef,
    importModalRef,
    closeImportModal,
    backToUpload,
    handleFileUpload,
    handleConfirmImport,
  };
}
