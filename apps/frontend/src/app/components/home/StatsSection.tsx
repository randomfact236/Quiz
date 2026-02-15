'use client';

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps): JSX.Element {
  return (
    <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/80">{label}</p>
    </div>
  );
}

export function StatsSection(): JSX.Element {
  const stats = [
    { value: '500+', label: 'Questions' },
    { value: '200+', label: 'Jokes' },
    { value: '20', label: 'Chapters' },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
      {stats.map((stat) => (
        <StatItem key={stat.label} {...stat} />
      ))}
    </div>
  );
}
