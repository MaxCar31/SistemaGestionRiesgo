import React from 'react';
import { IncidentStats } from '../../types';
import { TrendingUp } from 'lucide-react';

interface IncidentChartProps {
  stats: IncidentStats;
}

export default function IncidentChart({ stats }: IncidentChartProps) {
  const statusData = [
    { label: 'Abiertos', value: stats.open, color: 'bg-red-500' },
    { label: 'En Progreso', value: stats.inProgress, color: 'bg-yellow-500' },
    { label: 'Resueltos', value: stats.resolved, color: 'bg-green-500' },
    { label: 'Cerrados', value: stats.closed, color: 'bg-gray-500' }
  ];

  const maxValue = Math.max(...statusData.map(item => item.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Estado de Incidentes</h3>
        <TrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {statusData.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total de incidentes</span>
          <span className="font-semibold text-gray-900">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}