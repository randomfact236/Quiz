'use client';

import { useState, useEffect, useMemo } from 'react';

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

export function AdminUsersSection(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'registered' | 'guests'>('registered');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSex, setFilterSex] = useState('all');
  const [filterAge, _setFilterAge] = useState('all');
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
        (user as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user as any).email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user as any).guestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user as any).country?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = filterCountry === 'all' || user.country === filterCountry;
      const matchesSex = filterSex === 'all' || user.sex === filterSex;
      const matchesAge = filterAge === 'all' || user.ageGroup === filterAge;
      
      return matchesSearch && matchesCountry && matchesSex && matchesAge;
    });
  }, [currentUsers, searchTerm, filterCountry, filterSex, filterAge]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredUsers.slice(start, start + 10);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / 10);

  const AGE_GROUPS = ['10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50+'];

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

  const getFlag = (country?: string): string => {
    if (!country) return COUNTRY_FLAGS['default'] as string;
    return (COUNTRY_FLAGS[country] || COUNTRY_FLAGS['default']) as string;
  };

  const stats = useMemo(() => {
    const male = currentUsers.filter(u => u.sex === 'male').length;
    const female = currentUsers.filter(u => u.sex === 'female').length;
    const completionRate = currentUsers.length > 0 ? Math.round(((male + female) / currentUsers.length) * 100) : 0;
    
    const ageGroups: Record<string, number> = {};
    AGE_GROUPS.forEach(ag => { ageGroups[ag] = 0; });
    currentUsers.forEach(u => { if (u.ageGroup) ageGroups[u.ageGroup] = (ageGroups[u.ageGroup] || 0) + 1; });
    
    const topCountries: Record<string, number> = {};
    currentUsers.forEach(u => { if (u.country) topCountries[u.country] = (topCountries[u.country] || 0) + 1; });
    const sortedCountries = Object.entries(topCountries).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    return { male, female, completionRate, ageGroups, topCountries: sortedCountries };
  }, [currentUsers]);

  const maxAgeCount = Math.max(...Object.values(stats.ageGroups), 1);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{registeredUsers.length + guestUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Registered</p>
          <p className="text-2xl font-bold text-green-600">{registeredUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Guests</p>
          <p className="text-2xl font-bold text-purple-600">{guestUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Completion Rate</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => { setActiveTab('registered'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            activeTab === 'registered'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          Registered ({registeredUsers.length})
        </button>
        <button
          onClick={() => { setActiveTab('guests'); setCurrentPage(1); }}
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
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 rounded-lg border border-slate-300 flex-1 min-w-[200px]"
        />
        <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(1); }} className="px-4 py-2 rounded-lg border border-slate-300">
          <option value="all">All Countries</option>
        </select>
        <select value={filterSex} onChange={(e) => { setFilterSex(e.target.value); setCurrentPage(1); }} className="px-4 py-2 rounded-lg border border-slate-300">
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <button onClick={fetchUsers} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Refresh</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {activeTab === 'registered' ? (
                <><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Country</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Gender</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Age</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Registered</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Last Active</th></>
              ) : (
                <><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Guest ID</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Country</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Gender</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Age</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">First Visit</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Last Active</th></>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div></td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {'email' in user ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name || '-'}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="font-mono text-sm text-slate-600">{user.guestId.slice(0, 12)}...</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.country || '-'}</td>
                  <td className="px-6 py-4">
                    {user.sex ? (
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {user.sex === 'male' ? '♂ Male' : '♀ Female'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">{user.ageGroup || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.lastActive)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
