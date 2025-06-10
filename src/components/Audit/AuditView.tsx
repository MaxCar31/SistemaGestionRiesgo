import React, { useState } from 'react';
import { Activity, Search, Filter, Download, User, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

export default function AuditView() {
  const { auditLogs, users } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuario desconocido';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      incident_created: 'Incidente Creado',
      incident_assigned: 'Incidente Asignado',
      status_updated: 'Estado Actualizado',
      incident_resolved: 'Incidente Resuelto',
      incident_closed: 'Incidente Cerrado',
      user_login: 'Inicio de Sesión',
      user_logout: 'Cierre de Sesión'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      incident_created: 'bg-blue-100 text-blue-800',
      incident_assigned: 'bg-purple-100 text-purple-800',
      status_updated: 'bg-yellow-100 text-yellow-800',
      incident_resolved: 'bg-green-100 text-green-800',
      incident_closed: 'bg-gray-100 text-gray-800',
      user_login: 'bg-emerald-100 text-emerald-800',
      user_logout: 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = auditLogs.filter(log =>
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.incidentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(log.userId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
          <p className="text-gray-600 mt-1">
            {filteredLogs.length} registros de actividad del sistema
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exportar Logs
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en los registros de auditoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
              <p className="text-gray-600">Intenta ajustar los términos de búsqueda</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-sm text-gray-500">#{log.incidentId}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                    
                    <p className="text-gray-900 mb-2">{log.details}</p>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      <span>por {getUserName(log.userId)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}