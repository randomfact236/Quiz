import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Riddles - AI Quiz Platform',
  description: 'Challenge your visual perception with image-based riddles and puzzles!',
};

export default function ImageRiddlesLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
