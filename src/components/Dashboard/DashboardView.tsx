import React from 'react';
import { AlertTriangle, Shield, TrendingUp, Clock, CheckCircle, Users } from 'lucide-react';
import StatsCard from './StatsCard';
import IncidentChart from './IncidentChart';
import RecentIncidents from './RecentIncidents';
import { useApp } from '../../context/AppContext';
import { calculateIncidentStats } from '../../utils/helpers';

export default function DashboardView() {
  const { incidents } = useApp();
  const stats = calculateIncidentStats(incidents);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Seguridad</h1>
        <p className="text-gray-600 mt-1">Monitoreo en tiempo real de incidentes de seguridad</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Incidentes"
          value={stats.total}
          icon={AlertTriangle}
          color="bg-blue-500"
          trend={{ value: 12, isPositive: false }}
        />
        <StatsCard
          title="Incidentes Abiertos"
          value={stats.open}
          icon={Shield}
          color="bg-red-500"
          trend={{ value: 8, isPositive: false }}
        />
        <StatsCard
          title="En Progreso"
          value={stats.inProgress}
          icon={Clock}
          color="bg-yellow-500"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Resueltos"
          value={stats.resolved + stats.closed}
          icon={CheckCircle}
          color="bg-green-500"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentChart stats={stats} />
        <RecentIncidents incidents={incidents.slice(0, 5)} />
      </div>

      {/* Severity Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Severidad</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.bySeverity).map(([severity, count]) => (
            <div
              key={severity}
              className={`p-4 rounded-lg border-2 ${
                severity === 'critical' ? 'bg-red-50 border-red-200' :
                severity === 'high' ? 'bg-orange-50 border-orange-200' :
                severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm font-medium text-gray-600 capitalize">{severity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}