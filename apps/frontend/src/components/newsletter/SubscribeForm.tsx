'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Send } from 'lucide-react';

import { api } from '@/lib/api-client';

/**
 * Footer subscribe form (plan/14-newsletter.md P1 #3). Idempotent backend:
 * duplicates report the same success as new subscriptions (anti-enumeration).
 * Includes the honeypot field and the privacy consent line (feature 09).
 */
export function SubscribeForm(): JSX.Element {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — humans never see/fill it
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      await api.post('/newsletter/subscribe', {
        email: email.trim(),
        source: 'footer',
        website,
      });
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('idle');
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Subscription failed. Please try again later.'
      );
    }
  };

  if (status === 'done') {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
        role="status"
      >
        <CheckCircle className="h-5 w-5" />
        You&apos;re on the list! Watch your inbox for new quizzes and riddles.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100"
        />
        {/* Honeypot: hidden from humans, tempting for bots */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={status === 'sending' || email.trim().length === 0}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {status === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Subscribe
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
        By subscribing you agree to our{' '}
        <a href="/privacy" className="underline hover:text-primary-600 dark:hover:text-primary-400">
          privacy policy
        </a>
        . Unsubscribe anytime.
      </p>
    </form>
  );
}
