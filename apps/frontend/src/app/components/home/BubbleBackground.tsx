'use client';

export function BubbleBackground(): JSX.Element {
  // Using deterministic values to avoid hydration mismatch
  const bubbles = [50, 80, 60, 90, 70, 55, 85, 65, 75, 95];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {bubbles.map((size, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-white/10"
          style={{
            width: `${size}px`,
            height: `${size + 10}px`,
            left: `${(i * 10 + 5) % 100}%`,
            top: `${(i * 13 + 7) % 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
