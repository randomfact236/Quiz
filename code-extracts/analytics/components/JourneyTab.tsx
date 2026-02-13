'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Funnel,
  FunnelChart,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { JourneyStats } from '@/lib/analytics/session-tracker';

// Mock data for demonstration (replace with real data from API)
const mockJourneyStats: JourneyStats = {
  totalSessions: 12456,
  avgSessionDuration: 184, // 3 min 4 sec
  avgPagesPerSession: 3.2,
  bounceRate: 42,
  topEntryPages: [
    { path: '/home', count: 3124, percentage: 25 },
    { path: '/blog/top-10-gadgets', count: 2186, percentage: 18 },
    { path: '/deals', count: 1744, percentage: 14 },
    { path: '/products/summer-sale', count: 1246, percentage: 10 },
    { path: '/reviews/best-laptops', count: 997, percentage: 8 },
  ],
  topExitPages: [
    { path: '/checkout/confirmation', count: 1868, percentage: 15 },
    { path: '/affiliate/redirect', count: 1495, percentage: 12 },
    { path: '/blog/article-end', count: 1246, percentage: 10 },
    { path: '/products/out-of-stock', count: 1121, percentage: 9 },
    { path: '/contact/thank-you', count: 872, percentage: 7 },
  ],
  popularFlows: [
    { path: ['/home', '/products', '/checkout'], count: 1245, percentage: 10 },
    { path: ['/blog', '/blog/post', '/affiliate'], count: 996, percentage: 8 },
    { path: ['/deals', '/product', '/affiliate'], count: 747, percentage: 6 },
    { path: ['/home', '/deals', '/product'], count: 623, percentage: 5 },
    { path: ['/reviews', '/product', '/checkout'], count: 498, percentage: 4 },
  ],
  funnel: [
    { step: 'Landing Page', visitors: 12456, dropOff: 0, conversionRate: 100 },
    { step: 'Product View', visitors: 8720, dropOff: 3736, conversionRate: 70 },
    { step: 'Affiliate Click', visitors: 4360, dropOff: 4360, conversionRate: 50 },
    { step: 'External Checkout', visitors: 1962, dropOff: 2398, conversionRate: 45 },
  ],
};

interface JourneyTabProps {
  stats?: JourneyStats;
}

// Custom tooltip type
interface TooltipData {
  step?: string;
  visitors?: number;
  conversionRate?: number;
  dropOff?: number;
  path?: string;
  pathStr?: string;
  count?: number;
  percentage?: number;
  name?: string;
  value?: number;
}

export function JourneyTab({ stats = mockJourneyStats }: JourneyTabProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Format time
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Colors
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          subtitle="Last 24 hours"
          color="blue"
        />
        <StatCard
          title="Avg. Session Duration"
          value={formatDuration(stats.avgSessionDuration)}
          subtitle="Time on site"
          color="green"
        />
        <StatCard
          title="Avg. Pages / Session"
          value={stats.avgPagesPerSession.toString()}
          subtitle="Page depth"
          color="amber"
        />
        <StatCard
          title="Bounce Rate"
          value={`${stats.bounceRate}%`}
          subtitle="Single page visits"
          color="red"
          isNegative
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-6">Conversion Funnel</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipData }> }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-medium">{data.step}</p>
                          <p className="text-gray-400 text-sm">
                            Visitors: {data.visitors?.toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Conversion: {data.conversionRate}%
                          </p>
                          {data.dropOff && data.dropOff > 0 && (
                            <p className="text-red-400 text-sm">
                              Drop-off: {data.dropOff.toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Funnel
                  dataKey="visitors"
                  data={stats.funnel}
                  isAnimationActive
                  fill="#3b82f6"
                >
                  {stats.funnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList
                    position="inside"
                    fill="#fff"
                    stroke="none"
                    dataKey="step"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3 font-medium">Funnel Step</th>
                  <th className="pb-3 font-medium text-right">Visitors</th>
                  <th className="pb-3 font-medium text-right">Drop-off</th>
                  <th className="pb-3 font-medium text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.funnel.map((step, index) => (
                  <tr key={index} className="border-b border-gray-800 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-white font-medium">{step.step}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-gray-300">
                      {step.visitors.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      {step.dropOff > 0 ? (
                        <span className="text-red-400">-{step.dropOff.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`font-medium ${
                          step.conversionRate >= 70
                            ? 'text-green-400'
                            : step.conversionRate >= 40
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {step.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entry/Exit Pages & User Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Pages */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Top Entry Pages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topEntryPages}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  type="category"
                  dataKey="path"
                  stroke="#9ca3af"
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) =>
                    value.length > 15 ? value.slice(0, 12) + '...' : value
                  }
                />
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipData }> }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-medium">{data.path}</p>
                          <p className="text-gray-400 text-sm">
                            {data.count?.toLocaleString()} entries ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exit Pages */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Top Exit Pages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topExitPages}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  type="category"
                  dataKey="path"
                  stroke="#9ca3af"
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) =>
                    value.length > 15 ? value.slice(0, 12) + '...' : value
                  }
                />
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipData }> }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-medium">{data.path}</p>
                          <p className="text-gray-400 text-sm">
                            {data.count?.toLocaleString()} exits ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources from UTM */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Traffic Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Direct', value: 40, color: '#3b82f6' },
                    { name: 'Organic Search', value: 30, color: '#22c55e' },
                    { name: 'Social Media', value: 15, color: '#f59e0b' },
                    { name: 'Referral', value: 10, color: '#8b5cf6' },
                    { name: 'Email', value: 5, color: '#ec4899' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ value }: { value: number }) => `${value}%`}
                  labelLine={false}
                >
                  {[
                    { color: '#3b82f6' },
                    { color: '#22c55e' },
                    { color: '#f59e0b' },
                    { color: '#8b5cf6' },
                    { color: '#ec4899' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {[
              { name: 'Direct', color: '#3b82f6', value: 40 },
              { name: 'Organic Search', color: '#22c55e', value: 30 },
              { name: 'Social Media', color: '#f59e0b', value: 15 },
              { name: 'Referral', color: '#8b5cf6', value: 10 },
              { name: 'Email', color: '#ec4899', value: 5 },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-300">
                  {item.name}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular User Flows */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Popular User Flows</h3>
        <div className="space-y-4">
          {stats.popularFlows.map((flow, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-gray-500 w-6">#{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {flow.path.map((page, pageIndex) => (
                    <React.Fragment key={pageIndex}>
                      <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {page}
                      </span>
                      {pageIndex < flow.path.length - 1 && (
                        <span className="text-gray-500">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-medium">
                  {flow.count.toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm ml-2">({flow.percentage}%)</span>
              </div>
              <div className="w-32">
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(flow.percentage / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  color,
  isNegative = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'amber' | 'red';
  isNegative?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    red: 'bg-red-500/10 border-red-500/20',
  };

  const textColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold ${textColors[color]} mt-1`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
    </div>
  );
}
