'use client';

import Link from 'next/link';
import { 
  FlaskConical, 
  Calculator, 
  Scroll, 
  Globe, 
  BookOpen, 
  Laptop, 
  Puzzle, 
  Briefcase, 
  Heart, 
  Baby, 
  HelpCircle,
  Image as ImageIcon,
  Sparkles,
  Gamepad2,
  GraduationCap,
  Leaf,
  Dna,
  Atom,
  Monitor,
  Smartphone,
  Palette,
  Music,
  Camera,
  Film,
  Trophy,
  Utensils,
  type LucideIcon
} from 'lucide-react';

interface TopicCardProps {
  href: string;
  emoji: string;
  label: string;
  soon?: boolean;
}

// Map of icon keys to Lucide components
const iconMap: Record<string, LucideIcon> = {
  science: FlaskConical,
  math: Calculator,
  history: Scroll,
  geography: Globe,
  english: BookOpen,
  technology: Laptop,
  puzzle: Puzzle,
  briefcase: Briefcase,
  heart: Heart,
  baby: Baby,
  'help-circle': HelpCircle,
  image: ImageIcon,
  sparkles: Sparkles,
  gamepad2: Gamepad2,
  'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap,
  leaf: Leaf,
  dna: Dna,
  atom: Atom,
  monitor: Monitor,
  smartphone: Smartphone,
  palette: Palette,
  music: Music,
  camera: Camera,
  film: Film,
  trophy: Trophy,
  utensils: Utensils,
  bookopen: BookOpen,
  'book-open': BookOpen,
  flaskconical: FlaskConical,
  'flask-conical': FlaskConical,
};

function TopicCardContent({ emoji, label }: { emoji: string; label: string }): JSX.Element {
  // Check if emoji is an icon key
  const IconComponent = iconMap[emoji.toLowerCase()];
  
  if (IconComponent) {
    return (
      <>
        <IconComponent className="h-6 w-6 text-indigo-600" />
        <span className="mt-1 text-xs font-medium text-gray-700">{label}</span>
      </>
    );
  }
  
  // Otherwise treat as emoji
  return (
    <>
      <span className="text-2xl">{emoji}</span>
      <span className="mt-1 text-xs font-medium text-gray-700">{label}</span>
    </>
  );
}

export function TopicCard({ href, emoji, label, soon = false }: TopicCardProps): JSX.Element {
  if (soon) {
    return (
      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
        <TopicCardContent emoji={emoji} label={label} />
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md"
    >
      <TopicCardContent emoji={emoji} label={label} />
    </Link>
  );
}
