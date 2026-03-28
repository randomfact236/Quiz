'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Download, Users as UsersIcon, UserCheck, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  country?: string;
  sex?: string;
  ageGroup?: string;
  createdAt: string;
  lastActive?: string;
}

interface GuestUser {
  id: string;
  guestId: string;
  country?: string;
  sex?: string;
  ageGroup?: string;
  createdAt: string;
  lastActive: string;
}

const USERS_PER_PAGE = 10;

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'India': '🇮🇳', 'Canada': '🇨🇦',
  'Australia': '🇦🇺', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Brazil': '🇧🇷', 'Japan': '🇯🇵',
  'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Kenya': '🇰🇪', 'Pakistan': '🇵🇰',
  'Philippines': '🇵🇭', 'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾', 'China': '🇨🇳',
  'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱',
  'South Korea': '🇰🇷', 'Russia': '🇷🇺', 'Turkey': '🇹🇷', 'Ukraine': '🇺🇦',
  'Poland': '🇵🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰',
  'Finland': '🇫🇮', 'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'Egypt': '🇪🇬',
  'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴',
  'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪',
  'Israel': '🇮🇱', 'Singapore': '🇸🇬', 'New Zealand': '🇳🇿', 'Ireland': '🇮🇪',
  'default': '🌍'
};

const AGE_GROUPS = ['10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50+'];

function getFlag(country: string | undefined): string {
  if (!country) return COUNTRY_FLAGS['default'] as string;
  return (COUNTRY_FLAGS[country] || COUNTRY_FLAGS['default']) as string;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | undefined): string {
  if (!name) return 'bg-gray-400';
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] as string;
}

function isRegisteredUser(user: User | GuestUser): user is User {
  return 'email' in user;
}

function getUserSearchableText(user: User | GuestUser): string {
  if (isRegisteredUser(user)) {
    return `${user.name || ''} ${user.email} ${user.country || ''}`.toLowerCase();
  }
  return `${user.guestId} ${user.country || ''}`.toLowerCase();
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'registered' | 'guests'>('registered');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSex, setFilterSex] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api/v1';
    try {
      const [regRes, guestRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users/demographics`, {
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
    return currentUsers.filter(user => {
      const matchesSearch = searchTerm === '' ||
        getUserSearchableText(user).includes(searchTerm.toLowerCase());
      
      const matchesCountry = filterCountry === 'all' || user.country === filterCountry;
      const matchesSex = filterSex === 'all' || user.sex === filterSex;
      const matchesAge = filterAge === 'all' || user.ageGroup === filterAge;
      
      return matchesSearch && matchesCountry && matchesSex && matchesAge;
    });
  }, [currentUsers, searchTerm, filterCountry, filterSex, filterAge]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(currentUsers.map(u => u.country).filter(Boolean) as string[]);
    return Array.from(countries).sort();
  }, [currentUsers]);

  const stats = useMemo(() => {
    const total = registeredUsers.length + guestUsers.length;
    const withDemographics = currentUsers.filter(u => u.country && u.sex && u.ageGroup).length;
    const male = currentUsers.filter(u => u.sex === 'male').length;
    const female = currentUsers.filter(u => u.sex === 'female').length;
    const completionRate = currentUsers.length > 0 ? Math.round((withDemographics / currentUsers.length) * 100) : 0;
    
    const ageGroups: Record<string, number> = {};
    AGE_GROUPS.forEach(ag => { ageGroups[ag] = 0; });
    currentUsers.forEach(u => { if (u.ageGroup) ageGroups[u.ageGroup] = (ageGroups[u.ageGroup] || 0) + 1; });
    
    const topCountries: Record<string, number> = {};
    currentUsers.forEach(u => { if (u.country) topCountries[u.country] = (topCountries[u.country] || 0) + 1; });
    const sortedCountries = Object.entries(topCountries).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    return { total, withDemographics, male, female, completionRate, ageGroups, topCountries: sortedCountries };
  }, [registeredUsers, guestUsers, currentUsers]);

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
    const headers = activeTab === 'registered' 
      ? ['Name', 'Email', 'Country', 'Sex', 'Age Group', 'Registered', 'Last Active']
      : ['Guest ID', 'Country', 'Sex', 'Age Group', 'First Visit', 'Last Active'];
    
    const rows = filteredUsers.map(user => {
      if (isRegisteredUser(user)) {
        return [user.name || '-', user.email, user.country || '-', user.sex || '-', user.ageGroup || '-', formatDate(user.createdAt), formatDate(user.lastActive)];
      }
      return [user.guestId, user.country || '-', user.sex || '-', user.ageGroup || '-', formatDate(user.createdAt), formatDate(user.lastActive)];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const maxAgeCount = Math.max(...Object.values(stats.ageGroups), 1);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and analyze registered users and guest users
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{registeredUsers.length + guestUsers.length}</p>
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
        
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Demographics Rate</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completionRate}%</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.completionRate > 50 ? 'bg-green-100' : 'bg-amber-100'}`}>
              <Globe className={`w-6 h-6 ${stats.completionRate > 50 ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Gender Distribution</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-600">Male ({stats.male})</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${currentUsers.length > 0 ? (stats.male / currentUsers.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-sm text-slate-600">Female ({stats.female})</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${currentUsers.length > 0 ? (stats.female / currentUsers.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Age Groups */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Age Groups</h3>
          <div className="space-y-2">
            {AGE_GROUPS.map(ag => {
              const count = stats.ageGroups[ag] || 0;
              const percent = (count / maxAgeCount) * 100;
              return (
                <div key={ag} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12">{ag}</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {stats.topCountries.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet</p>
            ) : (
              stats.topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-lg">{getFlag(country)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{country}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(count / (stats.topCountries[0]?.[1] || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex">
        <button
          onClick={() => { setActiveTab('registered'); setCurrentPage(1); }}
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
          onClick={() => { setActiveTab('guests'); setCurrentPage(1); }}
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or country..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          
          <select
            value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Countries</option>
            {uniqueCountries.map(c => (
              <option key={c} value={c}>{getFlag(c)} {c}</option>
            ))}
          </select>
          
          <select
            value={filterSex}
            onChange={(e) => { setFilterSex(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          
          <select
            value={filterAge}
            onChange={(e) => { setFilterAge(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Ages</option>
            {AGE_GROUPS.map(ag => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
          
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Active</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guest ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">First Visit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Active</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No users found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(isRegisteredUser(user) ? user.name : undefined)} flex items-center justify-center text-white font-semibold text-sm`}>
                          {isRegisteredUser(user) ? getInitials(user.name) : '👤'}
                        </div>
                        <div>
                          {isRegisteredUser(user) ? (
                            <>
                              <p className="font-medium text-slate-900">{user.name || '-'}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </>
                          ) : (
                            <p className="font-medium text-slate-900 font-mono text-sm">{user.guestId.slice(0, 12)}...</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {getFlag(user.country)}
                        <span className="text-slate-700">{user.country || '-'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.sex ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {user.sex === 'male' ? '♂ Male' : '♀ Female'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.ageGroup ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {user.ageGroup}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
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
              Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
