'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  fillArea?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

export function SparklineChart({ 
  data, 
  color = '#3b82f6',
  height = 40,
  fillArea = true,
  trend = 'neutral'
}: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : color;

  if (fillArea) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`sparkline-${trend}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={trendColor}
            strokeWidth={2}
            fill={`url(#sparkline-${trend})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={trendColor}
          strokeWidth={2}
          fill="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
