'use client';

import React, { useState } from 'react';
import { Search, Calendar, Filter, X, ChevronDown, Save } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'toggle' | 'range';
  options?: string[];
  value?: any;
}

interface SearchFilterBarProps {
  onSearch?: (query: string, filters: Record<string, any>) => void;
  onSaveFilter?: (name: string, filters: Record<string, any>) => void;
  filterOptions?: FilterOption[];
  savedFilters?: Array<{ id: string; name: string; filters: Record<string, any> }>;
}

export function SearchFilterBar({ 
  onSearch, 
  onSaveFilter,
  filterOptions = defaultFilterOptions,
  savedFilters = []
}: SearchFilterBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [isSaving, setIsSaving] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSearch = () => {
    onSearch?.(query, { ...filters, dateRange });
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleSaveFilter = () => {
    if (filterName && onSaveFilter) {
      onSaveFilter(filterName, { ...filters, dateRange });
      setIsSaving(false);
      setFilterName('');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setFilters({});
    setDateRange('7d');
    onSearch?.('', {});
  };

  const dateRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Search Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search metrics, pages, products..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Date Range */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {Object.keys(filters).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>

        {/* Clear Button */}
        {(query || Object.keys(filters).length > 0) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filterOptions.map((filter) => (
              <div key={filter.id}>
                <label className="block text-sm text-gray-400 mb-1">{filter.label}</label>
                {filter.type === 'select' && (
                  <select
                    value={filters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {filter.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {filter.type === 'toggle' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[filter.id] || false}
                      onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          {/* Save Filter */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-700">
            {isSaving ? (
              <>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Filter name"
                  className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSaveFilter}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => setIsSaving(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSaving(true)}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
              >
                <Save className="w-4 h-4" />
                Save Current Filter
              </button>
            )}

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-gray-500 text-sm">Saved:</span>
                {savedFilters.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => setFilters(saved.filters)}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                  >
                    {saved.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => (
            value && (
              <span 
                key={key} 
                className="flex items-center gap-1 px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-sm"
              >
                {key}: {value.toString()}
                <button 
                  onClick={() => handleFilterChange(key, undefined)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}

const defaultFilterOptions: FilterOption[] = [
  { id: 'device', label: 'Device', type: 'select', options: ['Desktop', 'Mobile', 'Tablet'] },
  { id: 'source', label: 'Source', type: 'select', options: ['Organic', 'Social', 'Email', 'Direct', 'Referral'] },
  { id: 'country', label: 'Country', type: 'select', options: ['US', 'UK', 'CA', 'DE', 'FR', 'AU'] },
  { id: 'excludeBots', label: 'Exclude Bots', type: 'toggle' },
];
