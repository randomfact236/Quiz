'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Users as UsersIcon,
  UserCheck,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastActive?: string;
}

interface GuestUser {
  id: string;
  guestId: string;
  createdAt: string;
  lastActive: string;
}

const USERS_PER_PAGE = 10;

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string | undefined): string {
  if (!name) return 'bg-gray-400';
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] as string;
}

function isRegisteredUser(user: User | GuestUser): user is User {
  return 'email' in user;
}

function getUserSearchableText(user: User | GuestUser): string {
  if (isRegisteredUser(user)) {
    return `${user.name || ''} ${user.email}`.toLowerCase();
  }
  return user.guestId.toLowerCase();
}

export default function AdminUsersPage() {
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
        searchTerm === '' || getUserSearchableText(user).includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [currentUsers, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportToCSV = () => {
    const headers =
      activeTab === 'registered'
        ? ['Name', 'Email', 'Registered', 'Last Active']
        : ['Guest ID', 'First Visit', 'Last Active'];

    const rows = filteredUsers.map((user) => {
      if (isRegisteredUser(user)) {
        return [
          user.name || '-',
          user.email,
          formatDate(user.createdAt),
          formatDate(user.lastActive),
        ];
      }
      return [user.guestId, formatDate(user.createdAt), formatDate(user.lastActive)];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and manage registered users and guest users
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">
                {registeredUsers.length + guestUsers.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Registered</p>
              <p className="text-2xl font-bold text-slate-900">{registeredUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Guests</p>
              <p className="text-2xl font-bold text-slate-900">{guestUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex">
        <button
          onClick={() => {
            setActiveTab('registered');
            setCurrentPage(1);
          }}
          className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
            activeTab === 'registered'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />
          Registered ({registeredUsers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('guests');
            setCurrentPage(1);
          }}
          className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
            activeTab === 'guests'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Guest Users ({guestUsers.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'registered' ? 'Search by name or email...' : 'Search by guest ID...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {activeTab === 'registered' ? (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Last Active
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Guest ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      First Visit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Last Active
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No users found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(isRegisteredUser(user) ? user.name : undefined)} flex items-center justify-center text-white font-semibold text-sm`}
                        >
                          {isRegisteredUser(user) ? getInitials(user.name) : '👤'}
                        </div>
                        <div>
                          {isRegisteredUser(user) ? (
                            <>
                              <p className="font-medium text-slate-900">{user.name || '-'}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </>
                          ) : (
                            <p className="font-medium text-slate-900 font-mono text-sm">
                              {user.guestId.slice(0, 12)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(user.lastActive)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * USERS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
