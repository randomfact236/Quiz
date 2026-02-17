'use client';

import Link from 'next/link';

interface ModeCardProps {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}

function ModeCard({ href, emoji, title, subtitle }: ModeCardProps): JSX.Element {
  return (
    <Link 
      href={href} 
      className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
    >
      <span className="text-4xl">{emoji}</span>
      <span className="mt-2 font-bold text-gray-800">{title}</span>
      <span className="text-sm text-gray-500">{subtitle}</span>
    </Link>
  );
}

export function ModeCards(): JSX.Element {
  const modes = [
    { href: '/quiz/timer-challenge', emoji: '⏱️', title: 'Timer Challenges', subtitle: 'Mix - All Subjects' },
    { href: '/quiz/practice-mode', emoji: '🎯', title: 'Practice Mode', subtitle: 'Mix - No Timer' },
    { href: '/riddles', emoji: '🎭', title: 'Riddles', subtitle: 'Brain Teasers' },
    { href: '/image-riddles', emoji: '🖼️', title: 'Image Riddles', subtitle: 'Visual Puzzles' },
    { href: '/jokes', emoji: '😂', title: 'Dad Jokes', subtitle: 'Fun Time' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {modes.map((mode) => (
        <ModeCard key={mode.title} {...mode} />
      ))}
    </div>
  );
}
