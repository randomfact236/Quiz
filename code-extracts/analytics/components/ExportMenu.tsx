'use client';

import React, { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet, Code, Calendar } from 'lucide-react';

interface ExportMenuProps {
  data?: any;
  filename?: string;
  onExport?: (format: string) => void;
}

export function ExportMenu({ data, filename = 'analytics-report', onExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    { id: 'pdf', label: 'PDF Report', icon: FileText, color: '#ef4444' },
    { id: 'csv', label: 'CSV', icon: Table, color: '#22c55e' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: '#16a34a' },
    { id: 'json', label: 'JSON', icon: Code, color: '#3b82f6' },
  ];

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Default export behavior
        await defaultExport(format, data, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const defaultExport = async (format: string, data: any, filename: string) => {
    switch (format) {
      case 'json':
        downloadJSON(data, filename);
        break;
      case 'csv':
        downloadCSV(data, filename);
        break;
      case 'pdf':
        await downloadPDF(filename);
        break;
      case 'excel':
        downloadExcel(data, filename);
        break;
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!Array.isArray(data) || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const downloadPDF = async (filename: string) => {
    // Open print dialog for PDF generation
    window.print();
  };

  const downloadExcel = (data: any, filename: string) => {
    // For now, export as CSV with Excel MIME type
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
    downloadBlob(blob, `${filename}.xls`);
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      return [
        headers.join('\t'),
        ...data.map(row => headers.map(h => row[h]).join('\t'))
      ].join('\n');
    }
    return JSON.stringify(data, null, 2);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-3 py-2 uppercase">Export Format</div>
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                  <format.icon className="w-4 h-4" style={{ color: format.color }} />
                  {format.label}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-700 p-2">
              <button
                onClick={() => handleExport('scheduled')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                Schedule Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Scheduled Reports Component
export function ScheduledReports() {
  const [reports, setReports] = useState([
    { id: 1, name: 'Daily Revenue', frequency: 'daily', format: 'PDF', email: 'admin@site.com', lastSent: '2024-01-15' },
    { id: 2, name: 'Weekly Analytics', frequency: 'weekly', format: 'Excel', email: 'team@site.com', lastSent: '2024-01-14' },
  ]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-medium mb-4">Scheduled Reports</h3>
      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="flex items-center justify-between p-3 bg-gray-900 rounded">
            <div>
              <div className="text-gray-300">{report.name}</div>
              <div className="text-xs text-gray-500">
                {report.frequency} • {report.format} • {report.email}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last sent: {report.lastSent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
