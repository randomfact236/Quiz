/**
 * ============================================================================
 * GameShareButton — per-card share on the games hub (BUG-035)
 * ============================================================================
 * Client island inside the server-rendered hub card: opens the shared
 * ShareMenu (Facebook / X / WhatsApp / copy link) with a discovery blurb for
 * the game. No Save target — game cards already live on the hub, and the
 * static games are dependency-free so they don't import site components.
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

import ShareMenu from '@/components/share/ShareMenu';
import { SITE_URL } from '@/lib/site-url';

export interface GameShareButtonProps {
  slug: string;
  title: string;
  blurb: string;
}

export function GameShareButton({ slug, title, blurb }: GameShareButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          // The card is an <a> — keep the tap from navigating away.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/40 hover:scale-105"
        aria-label={`Share ${title}`}
        title={`Share ${title}`}
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <ShareMenu
          title={title}
          countKey={{ contentType: 'game', contentId: slug }}
          text={`🎮 ${title} on PigZap — ${blurb}`}
          url={`${SITE_URL}/games/${slug}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
