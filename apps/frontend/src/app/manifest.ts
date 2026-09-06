import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Quiz Platform',
    short_name: 'AI Quiz',
    description: 'Play quizzes across science, math, riddles, jokes and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
  };
}
