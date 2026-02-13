import type { Metadata } from 'next';

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
    <main id="main-content" className="min-h-screen bg-secondary-50 px-4 py-12">
      <div className="container mx-auto">
        <h1 className="mb-4 text-center text-4xl font-bold text-secondary-900">
          😄 Dad Jokes
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-secondary-600">
          Get ready for some serious eye-rolling with our collection of dad jokes!
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {jokeCategories.map((category) => (
            <div
              key={category.title}
              className="card hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
            >
              <span className="text-4xl mb-4 block">{category.icon}</span>
              <h2 className="mb-2 text-xl font-semibold text-secondary-900">
                {category.title}
              </h2>
              <p className="text-secondary-600">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white p-8 shadow-soft">
          <h2 className="mb-6 text-center text-2xl font-bold text-secondary-900">
            Joke of the Day
          </h2>
          <blockquote className="text-center text-xl text-secondary-700 italic">
            &ldquo;Why don't scientists trust atoms? Because they make up everything!&rdquo;
          </blockquote>
          <p className="mt-4 text-center text-secondary-500">😂 Classic Dad Joke</p>
        </div>
      </div>
    </main>
  );
}
