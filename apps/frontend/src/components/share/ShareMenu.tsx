/**
 * ============================================================================
 * ShareMenu — explicit share targets (comments UI feedback, 2026-08-29)
 * ============================================================================
 * Replaces the navigator.share/clipboard-only flow: desktop browsers often
 * have no native share sheet, so users got a silent clipboard copy. This
 * menu always shows the options: Facebook, X, WhatsApp, LinkedIn, Copy
 * Link, and Save (a local device bookmark). Rendered as a small modal so
 * it works from inside 3D-flipped cards and game modals without popover
 * positioning pain.
 * ============================================================================
 */

'use client';

import { useEffect } from 'react';

import { isSaved, toggleSaved } from '@/lib/saved-items';
import { toast } from '@/lib/toast';

export interface ShareMenuProps {
  /** Headline used by share targets (e.g. the joke setup). */
  title: string;
  /** Body text used by share targets. */
  text: string;
  /** URL to share; defaults to the current page URL. */
  url?: string;
  /** Bookmark namespace, e.g. 'jokes' | 'image-riddles'. */
  saveNamespace: string;
  /** Bookmark id within the namespace (joke/riddle id). */
  saveId: string;
  onClose: () => void;
}

interface ShareTarget {
  key: string;
  label: string;
  badge: string;
  badgeClass: string;
  href?: (text: string, url: string) => string;
}

const TARGETS: ShareTarget[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    badge: 'f',
    badgeClass: 'bg-[#1877F2] text-white',
    href: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    badge: '𝕏',
    badgeClass: 'bg-black text-white',
    href: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    badge: '✆',
    badgeClass: 'bg-[#25D366] text-white',
    href: (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    badge: 'in',
    badgeClass: 'bg-[#0A66C2] text-white',
    href: (_text, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export default function ShareMenu({
  title,
  text,
  url,
  saveNamespace,
  saveId,
  onClose,
}: ShareMenuProps) {
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopyLink = () => {
    if (!navigator.clipboard) {
      toast.error('Copy not supported');
      return;
    }
    void navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success('🔗 Link copied!');
        onClose();
      })
      .catch(() => toast.error('Copy failed'));
  };

  const isSavedNow = isSaved(saveNamespace, saveId);

  const handleSave = () => {
    const nowSaved = toggleSaved(saveNamespace, saveId);
    toast.success(nowSaved ? '🔖 Saved!' : 'Removed from saved');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share: ${title}`}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Share</p>
          <p className="mt-0.5 truncate text-sm font-bold text-gray-800">{title}</p>
        </div>
        <div className="p-2">
          {TARGETS.map((target) => (
            <a
              key={target.key}
              href={target.href?.(text, shareUrl) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${target.badgeClass}`}
                aria-hidden="true"
              >
                {target.badge}
              </span>
              <span className="text-sm font-bold text-gray-700">{target.label}</span>
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm"
              aria-hidden="true"
            >
              🔗
            </span>
            <span className="text-sm font-bold text-gray-700">Copy Link</span>
          </button>
          <button
            onClick={handleSave}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm"
              aria-hidden="true"
            >
              {isSavedNow ? '✓' : '🔖'}
            </span>
            <span className="text-sm font-bold text-gray-700">
              {isSavedNow ? 'Saved — tap to remove' : 'Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
