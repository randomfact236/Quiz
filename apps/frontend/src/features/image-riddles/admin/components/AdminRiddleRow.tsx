/**
 * ============================================================================
 * AdminRiddleRow — a single riddle row in the admin table
 * ============================================================================
 */

'use client';

import Image from 'next/image';

import type { ImageRiddle } from '@/app/admin/types';
import { getDifficultyColor, getStatusBadgeColor } from '@/app/admin/utils';

export interface AdminRiddleRowProps {
  riddle: ImageRiddle;
  index: number;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (riddle: ImageRiddle) => void;
  onDuplicate: (riddle: ImageRiddle) => void;
  onTrash: (riddle: ImageRiddle) => void;
  onCycleStatus: (riddle: ImageRiddle) => void;
}

export default function AdminRiddleRow({
  riddle,
  index,
  isSelected,
  onToggleSelection,
  onEdit,
  onDuplicate,
  onTrash,
  onCycleStatus,
}: AdminRiddleRowProps) {
  return (
    <tr key={`riddle-row-${riddle.id}`} className="group hover:bg-slate-50 transition-colors">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(riddle.id)}
          className="rounded border-gray-300"
          aria-label={`Select riddle: ${riddle.title}`}
        />
      </td>
      <td className="px-4 py-4 text-xs font-mono text-gray-400 text-center">
        {index.toString().padStart(2, '0')}
      </td>
      <td className="px-6 py-4">
        <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
          <Image
            src={riddle.imageUrl}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-110"
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <p
          className="font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors"
          title={`Created: ${riddle.createdAt ? new Date(riddle.createdAt).toLocaleString() : 'N/A'}\nUpdated: ${riddle.updatedAt ? new Date(riddle.updatedAt).toLocaleString() : 'N/A'}`}
        >
          {riddle.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onEdit(riddle)}
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-0.5 rounded shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDuplicate(riddle)}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 px-2 py-0.5 rounded shadow-sm"
          >
            Copy
          </button>
          <button
            onClick={() => onTrash(riddle)}
            className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:text-red-800 transition-colors bg-red-50 px-2 py-0.5 rounded shadow-sm"
          >
            Trash
          </button>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="inline-block max-w-[150px] truncate rounded-lg bg-orange-50 border border-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
          {riddle.answer}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 w-fit">
          <span>{riddle.category?.emoji || '🔍'}</span>
          <span>{riddle.category?.name || 'General'}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${getDifficultyColor(riddle.difficulty)} bg-white border border-current opacity-80`}
        >
          {riddle.difficulty}
        </span>
      </td>
      <td
        className="px-6 py-4 text-center group/status cursor-pointer"
        onClick={() => onCycleStatus(riddle)}
      >
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusBadgeColor(riddle.status)} bg-white border border-current transition-transform group-hover/status:scale-105`}
        >
          {riddle.status}{' '}
          <span className="ml-1 opacity-0 group-hover/status:opacity-100 transition-opacity">
            ⟳
          </span>
        </span>
      </td>
    </tr>
  );
}
