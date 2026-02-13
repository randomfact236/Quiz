'use client';

import React from 'react';

interface HorizontalBarProps {
  data: Array<{
    label: string;
    value: number;
    percentage: number;
    color?: string;
  }>;
  maxItems?: number;
  showValues?: boolean;
}

export function HorizontalBar({ 
  data, 
  maxItems = 10,
  showValues = true 
}: HorizontalBarProps) {
  const displayData = data.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {displayData.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{item.label}</span>
            {showValues && (
              <span className="text-gray-400">{item.value.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: item.color || '#3b82f6'
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">
              {item.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
