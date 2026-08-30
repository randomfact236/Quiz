'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserIcon, Mail, AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved'>('loading');
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) return;
    api
      .get<ProfileData>('/users/profile')
      .then((response) => {
        setProfile(response.data);
        setName(response.data.name || '');
        setAvatar(response.data.avatar || '');
        setStatus('ready');
      })
      .catch(() => {
        setError('Could not load your profile. Please try again later.');
        setStatus('ready');
      });
  }, [authLoading, isAuthenticated, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const response = await api.put<ProfileData>('/users/profile', {
        name,
        avatar: avatar || undefined,
      });
      setProfile(response.data);
      setStatus('saved');
      setTimeout(() => setStatus('ready'), 2000);
    } catch {
      setError('Could not save your profile. Please try again.');
      setStatus('ready');
    }
  };

  const handleResendVerification = async () => {
    if (!profile) return;
    setResendMessage('');
    try {
      const result = await api.post<{ message: string }>('/auth/resend-verification', {
        email: profile.email,
      });
      setResendMessage(result.data.message);
    } catch {
      setResendMessage('Could not send the email right now. Please try again later.');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center text-white/80 hover:text-white">
          ← Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-white/20">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Avatar" className="h-16 w-16 object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-indigo-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h2>
            {profile && (
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                {profile.email}
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="h-3.5 w-3.5" /> verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-indigo-600 dark:text-indigo-400 text-xs underline"
                  >
                    not verified — resend link
                  </button>
                )}
              </p>
            )}
            {resendMessage && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {resendMessage}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSave}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Display name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2.5 text-sm"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Avatar URL <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="avatar"
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2.5 text-sm"
                placeholder="https://example.com/me.png"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
            >
              {status === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
