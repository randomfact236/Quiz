import Link from 'next/link';

export default function NotFoundPage(): JSX.Element {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-9xl font-bold text-primary-600">404</h1>
        <h2 className="mb-4 text-3xl font-semibold text-secondary-900">Page Not Found</h2>
        <p className="mb-8 text-lg text-secondary-600">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/quiz" className="btn-outline">
            Take a Quiz
          </Link>
        </div>
      </div>
    </main>
  );
}