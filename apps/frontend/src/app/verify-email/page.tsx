'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '@/lib/auth';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;
    setState('verifying');
    authService
      .verifyEmail(token)
      .then((result) => {
        setMessage(result.message);
        setState('success');
      })
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
        setState('error');
      });
  }, [searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMessage('');
    setIsResending(true);
    try {
      const result = await authService.resendVerification(resendEmail);
      setResendMessage(result.message);
    } catch {
      setResendMessage('Could not send the email right now. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center text-white/80 hover:text-white">
          ← Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-white/20">
          {state === 'pending' && (
            <>
              <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
                Check your email
              </h2>
              <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
                We sent you a verification link. Open it to confirm your email address.
              </p>
            </>
          )}

          {state === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Verifying your email…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Email verified</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
              <Link
                href="/login"
                className="inline-block py-2.5 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Verification failed
              </h2>
              <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
              <form className="w-full space-y-3" onSubmit={handleResend}>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your email to receive a new verification link:
                </p>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isResending ? 'Sending…' : 'Resend verification email'}
                </button>
              </form>
              {resendMessage && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{resendMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
