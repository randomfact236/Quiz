'use client';

import React from 'react';
import { SparklineChart } from './SparklineChart';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  sparklineData,
  trend = 'neutral',
  icon,
}: KPICardProps) {
  const isPositive = (change || 0) >= 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
        {icon && (
          <div className="p-2 bg-gray-700 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      
      {sparklineData && (
        <div className="my-3">
          <SparklineChart 
            data={sparklineData} 
            trend={trend}
            height={40}
          />
        </div>
      )}
      
      {change !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          {isPositive ? (
            <ArrowUpIcon className="w-4 h-4 text-green-400" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-red-400" />
          )}
          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-gray-500 ml-1">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
