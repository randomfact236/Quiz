'use client';

import { useState, useCallback } from 'react';
import type { RiddleMcqCategory } from '@/lib/riddle-mcq-api';
import type { RiddleMcqSubject } from '@/types/riddles';
import type { RiddleMcq } from '@/types/riddles';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

interface ModalState<T> {
  open: boolean;
  item?: T;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface MutationMethods {
  delete: (id: string) => void;
  deleteAsync: (id: string) => Promise<unknown>;
  updateAsync: (params: { id: string; dto: any }) => Promise<unknown>;
  createAsync: (dto: any) => Promise<unknown>;
  isPending: boolean;
}

export function useRiddleMcqModals(params: {
  categoriesQuery: MutationMethods;
  subjectsQuery: MutationMethods;
  riddlesQuery: MutationMethods;
}) {
  const { categoriesQuery, subjectsQuery, riddlesQuery } = params;

  const [categoryModal, setCategoryModal] = useState<ModalState<RiddleMcqCategory>>({
    open: false,
  });
  const [subjectModal, setSubjectModal] = useState<ModalState<RiddleMcqSubject>>({ open: false });
  const [riddleModal, setRiddleModal] = useState<ModalState<RiddleMcq>>({ open: false });
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteCategory = useCallback(
    (category: RiddleMcqCategory) => {
      setConfirm({
        open: true,
        title: 'Delete Category',
        message: `Delete category "${category.name}"? This will also delete all subjects and riddles in this category.`,
        onConfirm: () => {
          categoriesQuery.delete(category.id);
          setConfirm((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [categoriesQuery]
  );

  const handleDeleteSubject = useCallback(
    (subject: RiddleMcqSubject) => {
      setConfirm({
        open: true,
        title: 'Delete Subject',
        message: `Delete subject "${subject.name}"? This will also delete all riddles in this subject.`,
        onConfirm: () => {
          subjectsQuery.delete(subject.id);
          setConfirm((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [subjectsQuery]
  );

  const handleDeleteRiddle = useCallback(
    (riddle: RiddleMcq) => {
      setConfirm({
        open: true,
        title: 'Delete Riddle',
        message: `Delete this riddle?`,
        onConfirm: () => {
          riddlesQuery.delete(riddle.id);
          setConfirm((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [riddlesQuery]
  );

  const handleCategorySubmit = useCallback(
    async (data: any) => {
      if (categoryModal.item) {
        await categoriesQuery.updateAsync({ id: categoryModal.item.id, dto: data });
      } else {
        await categoriesQuery.createAsync(data);
      }
      setCategoryModal({ open: false });
    },
    [categoryModal.item, categoriesQuery]
  );

  const handleSubjectSubmit = useCallback(
    async (data: any) => {
      if (subjectModal.item) {
        await subjectsQuery.updateAsync({ id: subjectModal.item.id, dto: data });
      } else {
        await subjectsQuery.createAsync(data);
      }
      setSubjectModal({ open: false });
    },
    [subjectModal.item, subjectsQuery]
  );

  const handleRiddleSubmit = useCallback(
    async (dto: CreateRiddleMcqDto) => {
      if (riddleModal.item) {
        await riddlesQuery.updateAsync({ id: riddleModal.item.id, dto });
      } else {
        await riddlesQuery.createAsync(dto);
      }
      setRiddleModal({ open: false });
    },
    [riddleModal.item, riddlesQuery]
  );

  return {
    categoryModal,
    setCategoryModal,
    subjectModal,
    setSubjectModal,
    riddleModal,
    setRiddleModal,
    confirm,
    setConfirm,
    handleDeleteCategory,
    handleDeleteSubject,
    handleDeleteRiddle,
    handleCategorySubmit,
    handleSubjectSubmit,
    handleRiddleSubmit,
  };
}
