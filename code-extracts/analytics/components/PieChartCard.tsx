'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartCardProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function PieChartCard({ 
  data, 
  title, 
  height = 250,
  showLegend = true 
}: PieChartCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-white font-medium mb-4">{title}</h4>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value, percent }: { name: string; value: number; percent: number }) => `${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => {
                const percentage = total > 0 && value ? ((Number(value) / total) * 100).toFixed(1) : '0';
                return [`${value} (${percentage}%)`, name];
              }}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-300 truncate">{item.name}: {item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
