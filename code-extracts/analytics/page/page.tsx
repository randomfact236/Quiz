'use client';

import React, { useState, useEffect } from 'react';
import {
  KPICard,
  AnalyticsTabs,
  DonutChart,
  PieChartCard,
  HorizontalBar,
  CountryFlag,
  ProgressBar,
  SparklineChart,
  RealtimeWidget,
  ExportMenu,
  SearchFilterBar,
} from '@/components/analytics';
import { JourneyTab } from '@/components/analytics/JourneyTab';
import {
  CurrencyDollarIcon,
  CursorArrowRaysIcon,
  ChartPieIcon,
  UsersIcon,
  ShoppingBagIcon,
  EyeIcon,
  BoltIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'journey', label: 'Journey' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'content', label: 'Content' },
  { id: 'audience', label: 'Audience' },
  { id: 'performance', label: 'Performance' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'devices', label: 'Devices' },
  { id: 'links', label: 'Links' },
  { id: 'seo', label: 'SEO' },
];

interface DashboardData {
  kpis: {
    revenue: { value: string; change: number; sparkline: number[] };
    clicks: { value: string; change: number; sparkline: number[] };
    conversionRate: { value: string; change: number; sparkline: number[] };
    visitors: { value: string; change: number; sparkline: number[] };
    sales: { value: string; change: number; sparkline: number[] };
    pageviews: { value: string; change: number; sparkline: number[] };
  };
  genderSplit: { male: { percentage: number }; female: { percentage: number } };
  newVsReturning: { new: { percentage: number }; returning: { percentage: number } };
  ageDistribution: Array<{ range: string; percentage: number; count: number }>;
  interests: Array<{ name: string; percentage: number; count: number }>;
  devices: Array<{ type: string; percentage: number; count: number }>;
  countries: Array<{ code: string; name: string; percentage: number; count: number }>;
  socialSources: Array<{ name: string; percentage: number; count: number }>;
  categories: Array<{ name: string; percentage: number; count: number }>;
  placements: Array<{ type: string; percentage: number; count: number }>;
  landingPages: Array<{ url: string; visits: number; percentage: number; ctr: number }>;
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(
        `${apiUrl}/analytics/dashboard?tab=${activeTab}&range=${dateRange}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Use mock data for development
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): DashboardData => ({
    kpis: {
      revenue: { value: '$24,563', change: 12.5, sparkline: [20, 35, 30, 45, 40, 55, 60] },
      clicks: { value: '15,847', change: 8.2, sparkline: [30, 40, 35, 50, 45, 60, 65] },
      conversionRate: { value: '3.24%', change: -2.1, sparkline: [4, 3.5, 3.8, 3.2, 3.5, 3.1, 3.24] },
      visitors: { value: '45,231', change: 15.3, sparkline: [35, 40, 38, 50, 48, 60, 65] },
      sales: { value: '1,247', change: 10.8, sparkline: [25, 30, 28, 40, 38, 50, 55] },
      pageviews: { value: '128,456', change: 18.7, sparkline: [40, 50, 45, 60, 55, 70, 75] },
    },
    genderSplit: {
      male: { percentage: 58.3 },
      female: { percentage: 41.7 },
    },
    newVsReturning: {
      new: { percentage: 64.2 },
      returning: { percentage: 35.8 },
    },
    ageDistribution: [
      { range: '18-24', percentage: 38, count: 6022 },
      { range: '25-34', percentage: 28, count: 4437 },
      { range: '35-44', percentage: 18, count: 2853 },
      { range: '45-54', percentage: 10, count: 1585 },
      { range: '55+', percentage: 6, count: 951 },
    ],
    interests: [
      { name: 'Technology Enthusiasts', percentage: 42, count: 18980 },
      { name: 'Business Professionals', percentage: 28, count: 12653 },
      { name: 'Shopping Lovers', percentage: 18, count: 8134 },
      { name: 'Travel & Tourism', percentage: 12, count: 5423 },
    ],
    devices: [
      { type: 'Desktop', percentage: 52, count: 32000 },
      { type: 'Mobile', percentage: 40, count: 24615 },
      { type: 'Tablet', percentage: 8, count: 4923 },
    ],
    countries: [
      { code: 'us', name: 'United States', percentage: 45, count: 27692 },
      { code: 'gb', name: 'United Kingdom', percentage: 18, count: 11077 },
      { code: 'ca', name: 'Canada', percentage: 12, count: 7385 },
      { code: 'au', name: 'Australia', percentage: 10, count: 6154 },
      { code: 'de', name: 'Germany', percentage: 8, count: 4923 },
      { code: 'in', name: 'India', percentage: 7, count: 4308 },
    ],
    socialSources: [
      { name: 'Facebook', percentage: 42, count: 8500 },
      { name: 'Twitter', percentage: 28, count: 5667 },
      { name: 'Instagram', percentage: 18, count: 3643 },
      { name: 'LinkedIn', percentage: 8, count: 1619 },
      { name: 'Other', percentage: 4, count: 810 },
    ],
    categories: [
      { name: 'Blog', percentage: 40, count: 12500 },
      { name: 'Tools', percentage: 30, count: 9375 },
      { name: 'Services', percentage: 20, count: 6250 },
      { name: 'Product', percentage: 10, count: 3125 },
    ],
    placements: [
      { type: 'Sidebar', percentage: 35, count: 15500 },
      { type: 'In-Content', percentage: 30, count: 13286 },
      { type: 'Header', percentage: 20, count: 8857 },
      { type: 'Footer', percentage: 10, count: 4429 },
      { type: 'Popup', percentage: 5, count: 2214 },
    ],
    landingPages: [
      { url: '/home', visits: 12456, percentage: 25, ctr: 3.2 },
      { url: '/products/summer-sale', visits: 8934, percentage: 18, ctr: 4.5 },
      { url: '/blog/top-10-gadgets', visits: 6721, percentage: 14, ctr: 2.8 },
      { url: '/reviews/best-laptops-2024', visits: 5432, percentage: 11, ctr: 3.9 },
      { url: '/deals', visits: 4210, percentage: 9, ctr: 5.1 },
    ],
  });

  const genderData = [
    { name: 'Male', value: data?.genderSplit?.male?.percentage || 0, color: '#3b82f6' },
    { name: 'Female', value: data?.genderSplit?.female?.percentage || 0, color: '#ec4899' },
  ].filter(item => item.value > 0);

  const newVsReturningData = [
    { name: 'New', value: data?.newVsReturning?.new?.percentage || 0, color: '#22c55e' },
    { name: 'Returning', value: data?.newVsReturning?.returning?.percentage || 0, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const deviceColors = ['#3b82f6', '#22c55e', '#f59e0b'];
  const deviceData = (data?.devices || []).map((d, i) => ({
    name: d.type,
    value: d.percentage,
    color: deviceColors[i % deviceColors.length],
  }));

  const categoryColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
  const categoryData = (data?.categories || []).map((c, i) => ({
    name: c.name,
    value: c.percentage,
    color: categoryColors[i % categoryColors.length],
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h1>
          <p className="text-gray-400 mb-4">Failed to load analytics data.</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track your affiliate performance and audience insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu 
              data={data}
              filename={`analytics-report-${new Date().toISOString().split('T')[0]}`}
            />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 rounded-t-lg">
          <AnalyticsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-b-lg p-6">
          {/* Search & Filter Bar */}
          <div className="mb-6">
            <SearchFilterBar 
              onSearch={(query, filters) => {
                console.log('Search:', query, filters);
                // Implement search logic
              }}
              onSaveFilter={(name, filters) => {
                console.log('Save filter:', name, filters);
              }}
              savedFilters={[
                { id: '1', name: 'Mobile Users', filters: { device: 'Mobile' } },
                { id: '2', name: 'US Traffic', filters: { country: 'US' } },
              ]}
            />
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Real-time Widget + KPI Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <RealtimeWidget />
                </div>
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <KPICard
                    title="Total Revenue"
                    value={data.kpis?.revenue?.value || '$0'}
                    change={data.kpis?.revenue?.change || 0}
                    sparklineData={data.kpis?.revenue?.sparkline || []}
                    trend={(data.kpis?.revenue?.change || 0) >= 0 ? 'up' : 'down'}
                    icon={<CurrencyDollarIcon className="w-5 h-5 text-blue-400" />}
                  />
                  <KPICard
                    title="Clicks"
                    value={data.kpis?.clicks?.value || '0'}
                    change={data.kpis?.clicks?.change || 0}
                    sparklineData={data.kpis?.clicks?.sparkline || []}
                    trend={(data.kpis?.clicks?.change || 0) >= 0 ? 'up' : 'down'}
                    icon={<CursorArrowRaysIcon className="w-5 h-5 text-green-400" />}
                  />
                  <KPICard
                    title="Conversion Rate"
                    value={data.kpis?.conversionRate?.value || '0%'}
                    change={data.kpis?.conversionRate?.change || 0}
                    sparklineData={data.kpis?.conversionRate?.sparkline || []}
                    trend={(data.kpis?.conversionRate?.change || 0) >= 0 ? 'up' : 'down'}
                    icon={<ChartPieIcon className="w-5 h-5 text-purple-400" />}
                  />
                </div>
              </div>

              {/* KPI Cards Row 2 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KPICard
                  title="Visitors"
                  value={data.kpis?.visitors?.value || '0'}
                  change={data.kpis?.visitors?.change || 0}
                  sparklineData={data.kpis?.visitors?.sparkline || []}
                  trend={(data.kpis?.visitors?.change || 0) >= 0 ? 'up' : 'down'}
                  icon={<UsersIcon className="w-5 h-5 text-orange-400" />}
                />
                <KPICard
                  title="Sales"
                  value={data.kpis?.sales?.value || '0'}
                  change={data.kpis?.sales?.change || 0}
                  sparklineData={data.kpis?.sales?.sparkline || []}
                  trend={(data.kpis?.sales?.change || 0) >= 0 ? 'up' : 'down'}
                  icon={<ShoppingBagIcon className="w-5 h-5 text-pink-400" />}
                />
                <KPICard
                  title="Pageviews"
                  value={data.kpis?.pageviews?.value || '0'}
                  change={data.kpis?.pageviews?.change || 0}
                  sparklineData={data.kpis?.pageviews?.sparkline || []}
                  trend={(data.kpis?.pageviews?.change || 0) >= 0 ? 'up' : 'down'}
                  icon={<EyeIcon className="w-5 h-5 text-cyan-400" />}
                />
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gender Split */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Gender Split</h3>
                  <DonutChart
                    data={genderData}
                    centerValue={`${data.genderSplit?.male?.percentage || 0}%`}
                    centerLabel="Male"
                    height={200}
                  />
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-300 text-sm">
                        Male {data.genderSplit?.male?.percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-gray-300 text-sm">
                        Female {data.genderSplit?.female?.percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* New vs Returning */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">New vs Returning</h3>
                  <DonutChart
                    data={newVsReturningData}
                    centerValue={`${data.newVsReturning?.new?.percentage || 0}%`}
                    centerLabel="New"
                    height={200}
                  />
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-300 text-sm">
                        New {data.newVsReturning?.new?.percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                      <span className="text-gray-300 text-sm">
                        Returning {data.newVsReturning?.returning?.percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device Breakdown */}
                <PieChartCard data={deviceData} title="Device Breakdown" />
              </div>

              {/* Third Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Age Distribution */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Age Distribution</h3>
                  <HorizontalBar
                    data={data.ageDistribution?.map(a => ({
                      label: a.range,
                      value: a.count,
                      percentage: a.percentage,
                      color: '#3b82f6',
                    })) || []}
                  />
                </div>

                {/* Top Interests */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Interests</h3>
                  <HorizontalBar
                    data={data.interests?.map(i => ({
                      label: i.name,
                      value: i.count,
                      percentage: i.percentage,
                      color: '#22c55e',
                    })) || []}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Social Sources */}
                <PieChartCard
                  data={data.socialSources?.map((s, i) => ({
                    name: s.name,
                    value: s.percentage,
                    color: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#6b7280'][i],
                  })) || []}
                  title="Social Sources"
                />

                {/* Top Countries */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Countries</h3>
                  <div className="space-y-3">
                    {data.countries?.map((country, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CountryFlag code={country.code} size="md" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{country.name}</span>
                            <span className="text-gray-400">
                              {country.count?.toLocaleString()}
                            </span>
                          </div>
                          <ProgressBar
                            value={country.percentage}
                            color="#3b82f6"
                            showPercentage={false}
                            size="sm"
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {country.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Row 1: Blog Categories, Product Categories, Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PieChartCard
                  data={[
                    { name: 'Blog', value: 890, color: '#3b82f6' },
                    { name: 'Tools', value: 630, color: '#22c55e' },
                    { name: 'Services', value: 505, color: '#f59e0b' },
                    { name: 'Product', value: 380, color: '#8b5cf6' },
                    { name: 'Email', value: 378, color: '#ec4899' },
                    { name: 'SSL', value: 126, color: '#ef4444' },
                  ]}
                  title="Blog Categories"
                  height={280}
                  showLegend={true}
                />
                <PieChartCard
                  data={[
                    { name: 'Product A', value: 1240, color: '#3b82f6' },
                    { name: 'Product B', value: 820, color: '#22c55e' },
                    { name: 'Product C', value: 620, color: '#f59e0b' },
                    { name: 'Other', value: 230, color: '#ef4444' },
                  ]}
                  title="Product Categories"
                  height={280}
                  showLegend={true}
                />
                <PieChartCard
                  data={[
                    { name: '#review', value: 650, color: '#3b82f6' },
                    { name: '#tutorial', value: 510, color: '#22c55e' },
                    { name: '#compare', value: 418, color: '#f59e0b' },
                    { name: '#pricing', value: 348, color: '#8b5cf6' },
                    { name: '#deal', value: 278, color: '#ec4899' },
                    { name: '#guide', value: 116, color: '#6b7280' },
                  ]}
                  title="Tags"
                  height={280}
                  showLegend={true}
                />
              </div>

              {/* Row 2: Ribbons, Placement Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartCard
                  data={[
                    { name: 'Featured', value: 920, color: '#f59e0b' },
                    { name: 'Hot Deal', value: 805, color: '#ef4444' },
                    { name: 'New', value: 575, color: '#22c55e' },
                  ]}
                  title="Ribbons"
                  height={280}
                  showLegend={true}
                />
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Placement Performance</h3>
                  <HorizontalBar
                    data={[
                      { label: 'Sidebar', value: 15500, percentage: 35, color: '#3b82f6' },
                      { label: 'In-Content', value: 13286, percentage: 30, color: '#22c55e' },
                      { label: 'Header', value: 8857, percentage: 20, color: '#f59e0b' },
                      { label: 'Footer', value: 4429, percentage: 10, color: '#8b5cf6' },
                      { label: 'Popup', value: 2214, percentage: 5, color: '#ec4899' },
                    ]}
                  />
                </div>
              </div>

              {/* Row 3: Entry Pages, Exit Pages */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Entry Pages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                          <th className="pb-3 font-medium">Page URL</th>
                          <th className="pb-3 font-medium text-right">Entries</th>
                          <th className="pb-3 font-medium text-right">%</th>
                          <th className="pb-3 font-medium text-right">Bounce Rate</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {[
                          { url: '/home', entries: 12456, percentage: 25, bounceRate: 32 },
                          { url: '/products/summer-sale', entries: 8934, percentage: 18, bounceRate: 28 },
                          { url: '/blog/top-10-gadgets', entries: 6721, percentage: 14, bounceRate: 45 },
                          { url: '/reviews/best-laptops-2024', entries: 5432, percentage: 11, bounceRate: 38 },
                          { url: '/deals', entries: 4210, percentage: 9, bounceRate: 25 },
                        ].map((page, index) => (
                          <tr key={index} className="border-b border-gray-800 last:border-0">
                            <td className="py-3 text-gray-300 truncate max-w-xs">{page.url}</td>
                            <td className="py-3 text-right text-gray-300">{page.entries.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-400">{page.percentage}%</td>
                            <td className="py-3 text-right">
                              <span className={page.bounceRate > 40 ? 'text-red-400' : 'text-green-400'}>
                                {page.bounceRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Exit Pages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                          <th className="pb-3 font-medium">Page URL</th>
                          <th className="pb-3 font-medium text-right">Exits</th>
                          <th className="pb-3 font-medium text-right">%</th>
                          <th className="pb-3 font-medium text-right">Exit Rate</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {[
                          { url: '/checkout/confirmation', exits: 5234, percentage: 22, exitRate: 98 },
                          { url: '/products/out-of-stock', exits: 3890, percentage: 16, exitRate: 85 },
                          { url: '/affiliate/amazon-redirect', exits: 3456, percentage: 14, exitRate: 92 },
                          { url: '/blog/article-end', exits: 2890, percentage: 12, exitRate: 65 },
                          { url: '/contact/thank-you', exits: 2123, percentage: 9, exitRate: 95 },
                        ].map((page, index) => (
                          <tr key={index} className="border-b border-gray-800 last:border-0">
                            <td className="py-3 text-gray-300 truncate max-w-xs">{page.url}</td>
                            <td className="py-3 text-right text-gray-300">{page.exits.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-400">{page.percentage}%</td>
                            <td className="py-3 text-right">
                              <span className={page.exitRate > 80 ? 'text-yellow-400' : 'text-green-400'}>
                                {page.exitRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Core Web Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Largest Contentful Paint (LCP)</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-green-400">1.2s</h3>
                    <span className="text-green-400 text-sm mb-1">Good</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Target: &lt; 2.5s</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">First Input Delay (FID)</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-green-400">12ms</h3>
                    <span className="text-green-400 text-sm mb-1">Good</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Target: &lt; 100ms</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Cumulative Layout Shift (CLS)</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-yellow-400">0.08</h3>
                    <span className="text-yellow-400 text-sm mb-1">Needs Improvement</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Target: &lt; 0.1</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Avg. Page Load Time</p>
                  <h3 className="text-2xl font-bold text-white mt-1">1.8s</h3>
                  <span className="text-green-400 text-sm">↓ 12% vs last week</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Time to First Byte (TTFB)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">89ms</h3>
                  <span className="text-green-400 text-sm">↓ 5% vs last week</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">First Contentful Paint (FCP)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">0.9s</h3>
                  <span className="text-green-400 text-sm">↓ 8% vs last week</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <h3 className="text-2xl font-bold text-white mt-1">99.98%</h3>
                  <span className="text-gray-400 text-sm">Last 30 days</span>
                </div>
              </div>

              {/* Page Performance Table */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Slowest Pages</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                        <th className="pb-3 font-medium">Page URL</th>
                        <th className="pb-3 font-medium text-right">Load Time</th>
                        <th className="pb-3 font-medium text-right">Page Size</th>
                        <th className="pb-3 font-medium text-right">Requests</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { url: '/blog/top-10-gadgets', loadTime: '2.8s', size: '1.2 MB', requests: 45, status: 'slow' },
                        { url: '/products/comparison', loadTime: '2.4s', size: '980 KB', requests: 38, status: 'slow' },
                        { url: '/reviews/detailed-guide', loadTime: '2.1s', size: '850 KB', requests: 42, status: 'warning' },
                        { url: '/deals/summer-sale', loadTime: '1.9s', size: '720 KB', requests: 35, status: 'warning' },
                        { url: '/home', loadTime: '1.2s', size: '450 KB', requests: 28, status: 'good' },
                      ].map((page, index) => (
                        <tr key={index} className="border-b border-gray-800 last:border-0">
                          <td className="py-3 text-gray-300">{page.url}</td>
                          <td className="py-3 text-right text-gray-300">{page.loadTime}</td>
                          <td className="py-3 text-right text-gray-400">{page.size}</td>
                          <td className="py-3 text-right text-gray-400">{page.requests}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              page.status === 'good' ? 'bg-green-500/20 text-green-400' :
                              page.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {page.status === 'good' ? 'Good' : page.status === 'warning' ? 'Warning' : 'Slow'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resource Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Resource Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { type: 'Images', size: '2.4 MB', percentage: 45, color: 'bg-blue-500' },
                      { type: 'JavaScript', size: '1.1 MB', percentage: 28, color: 'bg-yellow-500' },
                      { type: 'CSS', size: '680 KB', percentage: 15, color: 'bg-purple-500' },
                      { type: 'Fonts', size: '320 KB', percentage: 8, color: 'bg-pink-500' },
                      { type: 'Other', size: '180 KB', percentage: 4, color: 'bg-gray-500' },
                    ].map((resource) => (
                      <div key={resource.type} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-24">{resource.type}</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full ${resource.color} rounded-full`} style={{ width: `${resource.percentage}%` }} />
                        </div>
                        <span className="text-gray-300 text-sm w-20 text-right">{resource.size}</span>
                        <span className="text-gray-500 text-xs w-10 text-right">{resource.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Error Rates</h3>
                  <div className="space-y-4">
                    {[
                      { code: '4xx Errors', count: 234, rate: '0.8%', trend: 'down' },
                      { code: '5xx Errors', count: 12, rate: '0.04%', trend: 'stable' },
                      { code: 'Timeout', count: 45, rate: '0.15%', trend: 'up' },
                      { code: 'Broken Links', count: 8, rate: '0.03%', trend: 'down' },
                    ].map((error) => (
                      <div key={error.code} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-gray-300 font-medium">{error.code}</p>
                          <p className="text-gray-500 text-xs">{error.count} occurrences</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{error.rate}</p>
                          <span className={`text-xs ${
                            error.trend === 'down' ? 'text-green-400' :
                            error.trend === 'up' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {error.trend === 'down' ? '↓ Improving' :
                             error.trend === 'up' ? '↑ Increasing' : '→ Stable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Top Landing Pages</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                        <th className="pb-3 font-medium">Page URL</th>
                        <th className="pb-3 font-medium text-right">Visits</th>
                        <th className="pb-3 font-medium text-right">%</th>
                        <th className="pb-3 font-medium text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {data.landingPages?.map((page, index) => (
                        <tr key={index} className="border-b border-gray-800 last:border-0">
                          <td className="py-3 text-gray-300 truncate max-w-xs">
                            {page.url}
                          </td>
                          <td className="py-3 text-right text-gray-300">
                            {page.visits?.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-400">
                            {page.percentage}%
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-green-400">{page.ctr}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Revenue KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Commission</p>
                  <h3 className="text-2xl font-bold text-white mt-1">$12,847</h3>
                  <span className="text-green-400 text-sm">+15.3% vs last period</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">EPC (Earnings Per Click)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">$0.81</h3>
                  <span className="text-green-400 text-sm">+8.2% vs last period</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Average Order Value</p>
                  <h3 className="text-2xl font-bold text-white mt-1">$142</h3>
                  <span className="text-red-400 text-sm">-2.1% vs last period</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Conversion Rate</p>
                  <h3 className="text-2xl font-bold text-white mt-1">3.24%</h3>
                  <span className="text-green-400 text-sm">+5.4% vs last period</span>
                </div>
              </div>

              {/* Commission Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Commission by Product Category</h3>
                  <HorizontalBar
                    data={[
                      { label: 'Electronics', value: 5240, percentage: 42, color: '#3b82f6' },
                      { label: 'Software', value: 3850, percentage: 30, color: '#22c55e' },
                      { label: 'Services', value: 2567, percentage: 20, color: '#f59e0b' },
                      { label: 'Other', value: 1190, percentage: 8, color: '#6b7280' },
                    ]}
                  />
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Daily Revenue Trend</h3>
                  <div className="h-48">
                    <SparklineChart
                      data={[1800, 2200, 1950, 2800, 2400, 3100, 2900, 3400, 3200, 3800, 3600, 4200]}
                      trend="up"
                      height={180}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Link Performance */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Link Performance by Placement</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                        <th className="pb-3 font-medium">Placement</th>
                        <th className="pb-3 font-medium text-right">Clicks</th>
                        <th className="pb-3 font-medium text-right">Conv.</th>
                        <th className="pb-3 font-medium text-right">Revenue</th>
                        <th className="pb-3 font-medium text-right">EPC</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { placement: 'Sidebar', clicks: 15500, conversions: 542, revenue: 4494, epc: 0.29 },
                        { placement: 'In-Content', clicks: 13286, conversions: 612, revenue: 5076, epc: 0.38 },
                        { placement: 'Header', clicks: 8857, conversions: 354, revenue: 2937, epc: 0.33 },
                        { placement: 'Footer', clicks: 4429, conversions: 133, revenue: 1102, epc: 0.25 },
                        { placement: 'Popup', clicks: 2214, conversions: 89, revenue: 738, epc: 0.33 },
                      ].map((link, index) => (
                        <tr key={index} className="border-b border-gray-800 last:border-0">
                          <td className="py-3 text-gray-300">{link.placement}</td>
                          <td className="py-3 text-right text-gray-300">{link.clicks.toLocaleString()}</td>
                          <td className="py-3 text-right text-gray-400">{link.conversions}</td>
                          <td className="py-3 text-right text-green-400">${link.revenue}</td>
                          <td className="py-3 text-right text-gray-400">${link.epc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Performing Links */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Performing Links</h3>
                  <HorizontalBar
                    data={[
                      { label: '/products/summer-sale', value: 8934, percentage: 85, color: '#22c55e' },
                      { label: '/blog/top-10-gadgets', value: 6721, percentage: 64, color: '#22c55e' },
                      { label: '/reviews/best-laptops', value: 5432, percentage: 52, color: '#3b82f6' },
                      { label: '/deals', value: 4210, percentage: 40, color: '#3b82f6' },
                      { label: '/tools/price-comparison', value: 3890, percentage: 37, color: '#f59e0b' },
                    ]}
                  />
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Link Click Distribution</h3>
                  <PieChartCard
                    data={[
                      { name: 'Direct', value: 45, color: '#3b82f6' },
                      { name: 'Social', value: 30, color: '#22c55e' },
                      { name: 'Email', value: 15, color: '#f59e0b' },
                      { name: 'Referral', value: 10, color: '#8b5cf6' },
                    ]}
                    title=""
                    height={200}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="space-y-6">
              {/* Audience Demographics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gender Split */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Gender Split</h3>
                  <DonutChart
                    data={genderData}
                    centerValue={`${data?.genderSplit?.male?.percentage || 0}%`}
                    centerLabel="Male"
                    height={180}
                  />
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-300 text-sm">
                        Male {data?.genderSplit?.male?.percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-gray-300 text-sm">
                        Female {data?.genderSplit?.female?.percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Age Distribution */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Age Distribution</h3>
                  <HorizontalBar
                    data={data?.ageDistribution?.map(a => ({
                      label: a.range,
                      value: a.count,
                      percentage: a.percentage,
                      color: '#3b82f6',
                    })) || []}
                  />
                </div>

              </div>

              {/* Interests & Behavior */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Interests</h3>
                  <HorizontalBar
                    data={data?.interests?.map(i => ({
                      label: i.name,
                      value: i.count,
                      percentage: i.percentage,
                      color: '#22c55e',
                    })) || []}
                  />
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Visitor Type</h3>
                  <div className="flex items-center justify-around">
                    <DonutChart
                      data={newVsReturningData}
                      centerValue={`${data?.newVsReturning?.new?.percentage || 0}%`}
                      centerLabel="New"
                      height={180}
                    />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-300 text-sm">
                          New {data?.newVsReturning?.new?.percentage || 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                        <span className="text-gray-300 text-sm">
                          Returning {data?.newVsReturning?.returning?.percentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages & Timezones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Languages</h3>
                  <HorizontalBar
                    data={[
                      { label: 'English (US)', value: 35000, percentage: 57, color: '#3b82f6' },
                      { label: 'English (UK)', value: 8900, percentage: 14.5, color: '#22c55e' },
                      { label: 'Spanish', value: 6200, percentage: 10.1, color: '#f59e0b' },
                      { label: 'French', value: 4300, percentage: 7, color: '#8b5cf6' },
                      { label: 'German', value: 3153, percentage: 5.1, color: '#ec4899' },
                    ]}
                  />
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Timezones</h3>
                  <HorizontalBar
                    data={[
                      { label: 'America/New_York', value: 22000, percentage: 35.8, color: '#3b82f6' },
                      { label: 'America/Los_Angeles', value: 15000, percentage: 24.4, color: '#22c55e' },
                      { label: 'Europe/London', value: 8900, percentage: 14.5, color: '#f59e0b' },
                      { label: 'Europe/Berlin', value: 6200, percentage: 10.1, color: '#8b5cf6' },
                      { label: 'Asia/Tokyo', value: 4300, percentage: 7, color: '#ec4899' },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'journey' && <JourneyTab />}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              {/* Device KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Desktop Users</p>
                  <h3 className="text-2xl font-bold text-white mt-1">52%</h3>
                  <span className="text-green-400 text-sm">32,000 users</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Mobile Users</p>
                  <h3 className="text-2xl font-bold text-white mt-1">40%</h3>
                  <span className="text-blue-400 text-sm">24,615 users</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Touch Capable</p>
                  <h3 className="text-2xl font-bold text-white mt-1">55.5%</h3>
                  <span className="text-purple-400 text-sm">34,153 devices</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Avg Screen Size</p>
                  <h3 className="text-2xl font-bold text-white mt-1">1920x1080</h3>
                  <span className="text-yellow-400 text-sm">Most common</span>
                </div>
              </div>

              {/* Device Types & Browsers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartCard
                  data={[
                    { name: 'Desktop', value: 52, color: '#3b82f6' },
                    { name: 'Mobile', value: 40, color: '#22c55e' },
                    { name: 'Tablet', value: 8, color: '#f59e0b' },
                  ]}
                  title="Device Types"
                  height={250}
                />
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Top Browsers</h3>
                  <HorizontalBar
                    data={[
                      { label: 'Chrome', value: 38000, percentage: 62, color: '#3b82f6' },
                      { label: 'Safari', value: 14700, percentage: 24, color: '#22c55e' },
                      { label: 'Firefox', value: 5500, percentage: 9, color: '#f59e0b' },
                      { label: 'Edge', value: 3077, percentage: 5, color: '#8b5cf6' },
                    ]}
                  />
                </div>
              </div>

              {/* Operating Systems & Screen Resolutions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Operating Systems</h3>
                  <HorizontalBar
                    data={[
                      { label: 'Windows', value: 28000, percentage: 46, color: '#3b82f6' },
                      { label: 'macOS', value: 18300, percentage: 30, color: '#22c55e' },
                      { label: 'iOS', value: 9200, percentage: 15, color: '#f59e0b' },
                      { label: 'Android', value: 5500, percentage: 9, color: '#8b5cf6' },
                    ]}
                  />
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Screen Resolutions</h3>
                  <HorizontalBar
                    data={[
                      { label: '1920x1080', value: 28000, percentage: 46, color: '#3b82f6' },
                      { label: '2560x1440', value: 12300, percentage: 20, color: '#22c55e' },
                      { label: '1366x768', value: 8900, percentage: 14.5, color: '#f59e0b' },
                      { label: '390x844', value: 6500, percentage: 10.6, color: '#8b5cf6' },
                      { label: '414x896', value: 4300, percentage: 7, color: '#ec4899' },
                    ]}
                  />
                </div>
              </div>

              {/* Connection & Color Scheme */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Connection Types</h3>
                  <HorizontalBar
                    data={[
                      { label: '4G/LTE', value: 42000, percentage: 68.3, color: '#22c55e' },
                      { label: 'WiFi', value: 12000, percentage: 19.5, color: '#3b82f6' },
                      { label: '3G', value: 5538, percentage: 9, color: '#f59e0b' },
                      { label: '2G', value: 2000, percentage: 3.2, color: '#ef4444' },
                    ]}
                  />
                </div>
                <PieChartCard
                  data={[
                    { name: 'Light Mode', value: 70, color: '#f59e0b' },
                    { name: 'Dark Mode', value: 25, color: '#1f2937' },
                    { name: 'No Preference', value: 5, color: '#6b7280' },
                  ]}
                  title="Color Scheme Preference"
                  height={250}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
