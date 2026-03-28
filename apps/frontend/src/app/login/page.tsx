'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleLoginButton } from '@/components/ui';
import { authService } from '@/lib/auth';
import { setItem, STORAGE_KEYS } from '@/lib/storage';
import { Mail, Lock, AlertCircle, ChevronLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        
        if (token && refreshToken) {
            setItem(STORAGE_KEYS.AUTH_TOKEN, token, rememberMe);
            setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, rememberMe);
            router.push('/');
        }
    }, [searchParams, router, rememberMe]);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isEmailValid = email.length > 0 ? validateEmail(email) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);

        try {
            await authService.login(email, password);
            router.push('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Authentication failed');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = (err: Error) => {
        setError(err.message || 'Google login failed');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center text-white/80 hover:text-white">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Lock className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Sign In
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-white/20">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-md flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email Address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2.5 px-3 border ${isEmailValid === false ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                                    placeholder="you@example.com"
                                />
                                {isEmailValid === false && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                )}
                                {isEmailValid === true && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2.5 px-3 border"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                                    Remember me
                                </label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link 
                                href="/register" 
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Create one →
                            </Link>
                        </p>
                    </div>

                    <div className="mt-5">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-5">
                            <GoogleLoginButton
                                onLoginError={handleGoogleError}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
