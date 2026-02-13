import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the AI Quiz platform and our mission to make learning fun.',
};

export default function AboutPage(): JSX.Element {
  return (
    <main id="main-content" className="min-h-screen bg-secondary-50 px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-4xl font-bold text-secondary-900">
          About AI Quiz
        </h1>

        <div className="space-y-8">
          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900">Our Mission</h2>
            <p className="text-secondary-600 leading-relaxed">
              AI Quiz is dedicated to making learning fun and accessible for everyone. We believe
              that education should be engaging, interactive, and enjoyable. Our platform combines
              cutting-edge technology with carefully curated content to deliver an unparalleled
              quiz experience.
            </p>
          </section>

          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900">What We Offer</h2>
            <ul className="space-y-3 text-secondary-600">
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
                  <strong>Brain Teasers:</strong> 20 chapters of riddles from easy to expert
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
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900">Technology</h2>
            <p className="text-secondary-600 leading-relaxed">
              Built with enterprise-grade technology including Next.js 15, NestJS 10, PostgreSQL,
              Redis, and more. Our platform is designed for 99.99% uptime and SOC 2 compliance.
            </p>
          </section>

          <section className="card">
            <h2 className="mb-4 text-2xl font-semibold text-secondary-900">Contact</h2>
            <p className="text-secondary-600 leading-relaxed">
              Have questions or suggestions? We'd love to hear from you! Reach out to us at{' '}
              <a href="mailto:contact@aiquiz.com" className="text-primary-600 hover:underline">
                contact@aiquiz.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}