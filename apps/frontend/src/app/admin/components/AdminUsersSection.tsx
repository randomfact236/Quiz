'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { adminApi } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
  lastActive?: string;
}

interface GuestUser {
  id: string;
  guestId: string;
  createdAt: string;
  lastActive: string;
}

export function AdminUsersSection(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'registered' | 'guests'>('registered');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api/v1';
    try {
      const [regRes, guestRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('aiquiz:admin-token')}` },
        }),
        fetch(`${apiUrl}/admin/guest-users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('aiquiz:admin-token')}` },
        }),
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setRegisteredUsers(data.data || []);
      }
      if (guestRes.ok) {
        const data = await guestRes.json();
        setGuestUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentUsers = activeTab === 'registered' ? registeredUsers : guestUsers;

  const filteredUsers = useMemo(() => {
    return currentUsers.filter((user) => {
      const matchesSearch =
        searchTerm === '' ||
        (user as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user as any).email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user as any).guestId?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [currentUsers, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredUsers.slice(start, start + 10);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / 10);

  const changeRole = async (user: User, role: string) => {
    try {
      await adminApi.put(`/admin/users/${user.id}`, { role });
      setRegisteredUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Role change failed');
    }
  };

  const deleteUser = async (user: User) => {
    // Confirmation guard (plan/12-admin-dashboard.md P1 #2)
    if (
      !window.confirm(
        `Delete ${user.email}? This permanently removes the account and cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await adminApi.delete(`/admin/users/${user.id}`);
      setRegisteredUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">
            {registeredUsers.length + guestUsers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Registered</p>
          <p className="text-2xl font-bold text-green-600">{registeredUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Guests</p>
          <p className="text-2xl font-bold text-purple-600">{guestUsers.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setActiveTab('registered');
            setCurrentPage(1);
          }}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            activeTab === 'registered'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          Registered ({registeredUsers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('guests');
            setCurrentPage(1);
          }}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            activeTab === 'guests'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          Guest Users ({guestUsers.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-slate-300 flex-1 min-w-[200px]"
        />
        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {activeTab === 'registered' ? (
                <>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Actions
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Guest ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    First Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Last Active
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {'email' in user ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name
                            ? user.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name || '-'}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="font-mono text-sm text-slate-600">
                        {user.guestId.slice(0, 12)}...
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(user.lastActive)}
                  </td>
                  {'email' in user ? (
                    <>
                      <td className="px-6 py-4">
                        <select
                          value={user.role ?? 'user'}
                          onChange={(e) => changeRole(user, e.target.value)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          aria-label={`Role for ${user.email}`}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteUser(user)}
                          className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                          aria-label={`Delete ${user.email}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
