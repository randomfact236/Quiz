'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Users, MousePointerClick, ShoppingCart } from 'lucide-react';

interface LiveEvent {
  id: string;
  type: 'pageview' | 'click' | 'conversion';
  location: string;
  page: string;
  time: string;
}

interface RealtimeStats {
  activeUsers: number;
  pageViews: number;
  clicks: number;
  conversions: number;
}

export function RealtimeWidget() {
  const [stats, setStats] = useState<RealtimeStats>({
    activeUsers: 0,
    pageViews: 0,
    clicks: 0,
    conversions: 0
  });
  const [recentEvents, setRecentEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time data (replace with WebSocket in production)
    const interval = setInterval(() => {
      // Mock data updates
      setStats({
        activeUsers: Math.floor(Math.random() * 50) + 100,
        pageViews: Math.floor(Math.random() * 200) + 500,
        clicks: Math.floor(Math.random() * 50) + 100,
        conversions: Math.floor(Math.random() * 10) + 5
      });

      // Add new event
      const newEvent: LiveEvent = {
        id: Date.now().toString(),
        type: ['pageview', 'click', 'conversion'][Math.floor(Math.random() * 3)] as LiveEvent['type'],
        location: ['US', 'UK', 'CA', 'DE', 'FR'][Math.floor(Math.random() * 5)],
        page: ['/home', '/products', '/blog', '/reviews'][Math.floor(Math.random() * 4)],
        time: new Date().toLocaleTimeString()
      };

      setRecentEvents(prev => [newEvent, ...prev].slice(0, 10));
      setIsConnected(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: LiveEvent['type']) => {
    switch (type) {
      case 'pageview': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'click': return <MousePointerClick className="w-4 h-4 text-green-400" />;
      case 'conversion': return <ShoppingCart className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-medium">Real-time Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Users className="w-3 h-3" />
            Active Users
          </div>
          <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
          <div className="text-xs text-green-400">+12% vs last hour</div>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <MousePointerClick className="w-3 h-3" />
            Clicks
          </div>
          <div className="text-2xl font-bold text-white">{stats.clicks}</div>
          <div className="text-xs text-green-400">+8% vs last hour</div>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Activity className="w-3 h-3" />
            Page Views
          </div>
          <div className="text-2xl font-bold text-white">{stats.pageViews}</div>
          <div className="text-xs text-gray-400">Same as last hour</div>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <ShoppingCart className="w-3 h-3" />
            Conversions
          </div>
          <div className="text-2xl font-bold text-white">{stats.conversions}</div>
          <div className="text-xs text-green-400">+23% vs last hour</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="border-t border-gray-700 pt-3">
        <h4 className="text-gray-400 text-xs uppercase mb-2">Recent Activity</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 text-sm">
              {getEventIcon(event.type)}
              <span className="text-gray-300 capitalize">{event.type}</span>
              <span className="text-gray-500">from</span>
              <span className="text-gray-400">{event.location}</span>
              <span className="text-gray-500">on</span>
              <span className="text-gray-400 truncate max-w-[100px]">{event.page}</span>
              <span className="text-gray-600 text-xs ml-auto">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
