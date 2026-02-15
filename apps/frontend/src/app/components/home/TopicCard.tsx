'use client';

import Link from 'next/link';

interface TopicCardProps {
  href: string;
  emoji: string;
  label: string;
  soon?: boolean;
}

export function TopicCard({ href, emoji, label, soon = false }: TopicCardProps): JSX.Element {
  if (soon) {
    return (
      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
        <span className="text-2xl">{emoji}</span>
        <span className="mt-1 text-xs font-medium text-gray-700">{label}</span>
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="mt-1 text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}
