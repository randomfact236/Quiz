import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dad Jokes',
  description: 'Hilarious dad jokes to brighten your day. Classic, tech, parenting, and office humor.',
};

const jokeCategories = [
  {
    title: 'Classic Dad Jokes',
    description: 'Timeless classics that never fail to get an eye-roll.',
    icon: '😄',
    color: 'yellow',
  },
  {
    title: 'Tech Geek Dad Jokes',
    description: 'Programming and tech humor for the nerdy dad.',
    icon: '💻',
    color: 'blue',
  },
  {
    title: 'Parenting Dad Jokes',
    description: 'Jokes about the adventures of raising kids.',
    icon: '👶',
    color: 'pink',
  },
  {
    title: 'Work Office Dad Jokes',
    description: 'Corporate humor for the 9-to-5 dad.',
    icon: '💼',
    color: 'gray',
  },
];

export default function JokesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/60 px-4 py-2 text-gray-700 transition-all hover:bg-white/80 hover:shadow-md">
          ← Back to Home
        </Link>

        <h1 className="mb-4 text-center text-4xl font-bold text-gray-800">
          😄 Dad Jokes
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
          Get ready for some serious eye-rolling with our collection of dad jokes!
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {jokeCategories.map((category) => (
            <div
              key={category.title}
              className="cursor-pointer rounded-xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-4xl mb-4 block">{category.icon}</span>
              <h2 className="mb-2 text-xl font-semibold text-gray-800">
                {category.title}
              </h2>
              <p className="text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
            Joke of the Day
          </h2>
          <blockquote className="text-center text-xl text-gray-700 italic">
            &ldquo;Why don&apos;t scientists trust atoms? Because they make up everything!&rdquo;
          </blockquote>
          <p className="mt-4 text-center text-gray-500">😂 Classic Dad Joke</p>
        </div>
      </div>
    </main>
  );
}
