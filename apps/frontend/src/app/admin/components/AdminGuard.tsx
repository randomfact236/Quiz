'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

export function AdminGuard({ children }: { children?: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const getToken = (): string | null => {
            if (typeof window === 'undefined') return null;
            return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) 
                || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) 
                || null;
        };
        
        const token = getToken();
        if (!token) {
            router.replace('/admin/login');
            return;
        }

        try {
            // Decode JWT payload
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid token structure');
            const base64Url = parts[1] as string;
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                window.atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);

            if (payload.role !== 'admin') {
                router.replace('/'); // Redirect non-admins to home
                return;
            }

            setIsAuthorized(true);
        } catch (e) {
            console.error('Invalid token payload', e);
            router.replace('/admin/login');
        }
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">
                        Verifying secure access...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
