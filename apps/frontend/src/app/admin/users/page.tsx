'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect shim (plan/12-admin-dashboard.md P1 #3): the dashboard's
 * Users section is the canonical user-management surface (it has role/delete
 * actions). This route deep-links there instead of maintaining a duplicate
 * read-only list. Prior content remains in git history.
 */
export default function AdminUsersRedirectPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?section=users');
  }, [router]);

  return null;
}
