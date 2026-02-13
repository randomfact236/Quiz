'use client';

import React, { useState } from 'react';
import { Bell, Plus, Trash2, Edit2, Mail, Slack, Webhook, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface AlertConfig {
  id: string;
  name: string;
  metric: 'conversion_rate' | 'revenue' | 'clicks' | 'epc' | 'active_users';
  condition: 'above' | 'below' | 'drops_by' | 'increases_by';
  threshold: number;
  timeWindow: '1h' | '24h' | '7d';
  channels: ('email' | 'slack' | 'webhook')[];
  isActive: boolean;
  lastTriggered?: string;
}

const metricLabels: Record<string, string> = {
  conversion_rate: 'Conversion Rate',
  revenue: 'Revenue',
  clicks: 'Clicks',
  epc: 'EPC',
  active_users: 'Active Users',
};

const conditionLabels: Record<string, string> = {
  above: 'Above',
  below: 'Below',
  drops_by: 'Drops by %',
  increases_by: 'Increases by %',
};

export function AlertSystem() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: '1',
      name: 'Low Conversion Rate',
      metric: 'conversion_rate',
      condition: 'drops_by',
      threshold: 20,
      timeWindow: '24h',
      channels: ['email', 'slack'],
      isActive: true,
      lastTriggered: '2024-01-15 14:30',
    },
    {
      id: '2',
      name: 'Revenue Milestone',
      metric: 'revenue',
      condition: 'above',
      threshold: 10000,
      timeWindow: '24h',
      channels: ['email'],
      isActive: true,
    },
    {
      id: '3',
      name: 'Traffic Spike',
      metric: 'active_users',
      condition: 'increases_by',
      threshold: 50,
      timeWindow: '1h',
      channels: ['slack', 'webhook'],
      isActive: false,
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);

  const handleCreateAlert = (alert: Omit<AlertConfig, 'id'>) => {
    const newAlert: AlertConfig = {
      ...alert,
      id: Date.now().toString(),
    };
    setAlerts([...alerts, newAlert]);
    setIsCreating(false);
  };

  const handleUpdateAlert = (updatedAlert: AlertConfig) => {
    setAlerts(alerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
    setEditingAlert(null);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-medium">Alert System</h3>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Alert
        </button>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${
              alert.isActive 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-gray-900/50 border-gray-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium">{alert.name}</h4>
                  {!alert.isActive && (
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {metricLabels[alert.metric]} {conditionLabels[alert.condition]} {alert.threshold}
                  {alert.condition.includes('by') ? '%' : ''} in {alert.timeWindow}
                </p>
                
                {/* Channels */}
                <div className="flex items-center gap-2 mt-2">
                  {alert.channels.includes('email') && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  )}
                  {alert.channels.includes('slack') && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Slack className="w-3 h-3" /> Slack
                    </span>
                  )}
                  {alert.channels.includes('webhook') && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Webhook className="w-3 h-3" /> Webhook
                    </span>
                  )}
                </div>

                {alert.lastTriggered && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last triggered: {alert.lastTriggered}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle */}
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    alert.isActive ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      alert.isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <button
                  onClick={() => setEditingAlert(alert)}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingAlert) && (
        <AlertModal
          alert={editingAlert}
          onSave={editingAlert ? handleUpdateAlert : handleCreateAlert}
          onCancel={() => {
            setIsCreating(false);
            setEditingAlert(null);
          }}
        />
      )}
    </div>
  );
}

interface AlertModalProps {
  alert?: AlertConfig | null;
  onSave: (alert: any) => void;
  onCancel: () => void;
}

function AlertModal({ alert, onSave, onCancel }: AlertModalProps) {
  const [formData, setFormData] = useState({
    name: alert?.name || '',
    metric: alert?.metric || 'conversion_rate',
    condition: alert?.condition || 'drops_by',
    threshold: alert?.threshold || 20,
    timeWindow: alert?.timeWindow || '24h',
    channels: alert?.channels || ['email'],
    isActive: alert?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alert) {
      onSave({ ...alert, ...formData });
    } else {
      onSave(formData);
    }
  };

  const toggleChannel = (channel: 'email' | 'slack' | 'webhook') => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          {alert ? 'Edit Alert' : 'Create Alert'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Alert Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Low Conversion Alert"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Metric</label>
              <select
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value as AlertConfig['metric'] })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="conversion_rate">Conversion Rate</option>
                <option value="revenue">Revenue</option>
                <option value="clicks">Clicks</option>
                <option value="epc">EPC</option>
                <option value="active_users">Active Users</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertConfig['condition'] })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="drops_by">Drops by %</option>
                <option value="increases_by">Increases by %</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threshold</label>
              <input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Time Window</label>
              <select
                value={formData.timeWindow}
                onChange={(e) => setFormData({ ...formData, timeWindow: e.target.value as AlertConfig['timeWindow'] })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notification Channels</label>
            <div className="flex gap-3">
              {(['email', 'slack', 'webhook'] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm capitalize ${
                    formData.channels.includes(channel)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-400 border border-gray-700'
                  }`}
                >
                  {channel === 'email' && <Mail className="w-4 h-4" />}
                  {channel === 'slack' && <Slack className="w-4 h-4" />}
                  {channel === 'webhook' && <Webhook className="w-4 h-4" />}
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {alert ? 'Update Alert' : 'Create Alert'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AlertSystem;
