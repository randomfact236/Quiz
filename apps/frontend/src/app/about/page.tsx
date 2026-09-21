import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  alternates: { canonical: '/about' },
  description: 'Learn about the PigZap platform and our mission to make learning fun.',
};

export default function AboutPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-secondary-50 dark:bg-secondary-900 px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-4xl font-bold text-secondary-900 dark:text-secondary-100">
          About PigZap
        </h1>

        <div className="space-y-8">
          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              Our Mission
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
              PigZap is dedicated to making learning fun and accessible for everyone. We believe
              that education should be engaging, interactive, and enjoyable. Our platform combines
              cutting-edge technology with carefully curated content to deliver an unparalleled quiz
              experience.
            </p>
          </section>

          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              What We Offer
            </h2>
            <ul className="space-y-3 text-secondary-600 dark:text-secondary-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>
                  <strong>Interactive Quizzes:</strong> Science, history, geography, and more
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>
                  <strong>Dad Jokes:</strong> Clean humor for the whole family
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>
                  <strong>Brain Teasers:</strong> 10 chapters of riddles from easy to expert
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>
                  <strong>Progress Tracking:</strong> Monitor your improvement over time
                </span>
              </li>
            </ul>
          </section>

          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              Technology
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
              Built with modern, production-grade technology including Next.js 15, NestJS 10,
              PostgreSQL, and Redis. Our platform is designed for speed, reliability, and secure
              first-party handling of your data.
            </p>
          </section>

          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              Contact
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
              Have questions or suggestions? We&apos;d love to hear from you! Reach out to us at{' '}
              <a href="mailto:contact@pigzap.com" className="text-primary-600 hover:underline">
                contact@pigzap.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
