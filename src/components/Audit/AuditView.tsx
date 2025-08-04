import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Search, User, Calendar, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuditLogs } from '../../context/hooks/useAuditLogs';
import { formatDate } from '../../utils/helpers';

// Funciones auxiliares para la vista
const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    incident_created: 'Incidente Creado',
    incident_assigned: 'Incidente Asignado',
    status_updated: 'Estado Actualizado',
    incident_resolved: 'Incidente Resuelto',
    incident_closed: 'Incidente Cerrado',
    user_login: 'Inicio de Sesión',
    user_logout: 'Cierre de Sesión',
    incident_updated: 'Incidente Actualizado',
    user_action: 'Acción de Usuario',
    login: 'Inicio de Sesión',
    auth_login: 'Inicio de Sesión',
    sistema_operacion: 'Operación Sistema',
    incidente_crear: 'Crear Incidente',
    incidente_actualizar: 'Actualizar Incidente',
    incidente_eliminar: 'Eliminar Incidente'
  };
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    incident_created: 'bg-blue-100 text-blue-800',
    incident_assigned: 'bg-purple-100 text-purple-800',
    status_updated: 'bg-yellow-100 text-yellow-800',
    incident_resolved: 'bg-green-100 text-green-800',
    incident_closed: 'bg-gray-100 text-gray-800',
    user_login: 'bg-emerald-100 text-emerald-800',
    user_logout: 'bg-red-100 text-red-800',
    incident_updated: 'bg-orange-100 text-orange-800',
    user_action: 'bg-indigo-100 text-indigo-800',
    login: 'bg-emerald-100 text-emerald-800',
    auth_login: 'bg-emerald-100 text-emerald-800',
    sistema_operacion: 'bg-indigo-100 text-indigo-800',
    incidente_crear: 'bg-blue-100 text-blue-800',
    incidente_actualizar: 'bg-orange-100 text-orange-800',
    incidente_eliminar: 'bg-red-100 text-red-800'
  };
  return colors[action] || 'bg-gray-100 text-gray-800';
};

// Función para obtener el color del rol
const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-purple-100 text-purple-800',
    analyst: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-800',
    guest: 'bg-yellow-100 text-yellow-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

// Función para obtener la etiqueta del rol
const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    analyst: 'Analista',
    user: 'Usuario',
  };
  return labels[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

export default function AuditView() {
  // Usar directamente useAuditLogs
  const {
    auditLogs,
    loading,
    error,
    refreshLogs,
    loadLogs
  } = useAuditLogs();

  const [searchTerm, setSearchTerm] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Cargar logs al montar el componente
  useEffect(() => {
    loadLogs();
  }, []);

  // Filtrado local para búsqueda en tiempo real - SOLO por operación y usuario
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;

    const searchLower = searchTerm.toLowerCase();
    return auditLogs.filter(log => {
      // Filtrar por operación (action o metadata.operacion)
      const operacionMatch =
        log.action.toLowerCase().includes(searchLower) ||
        (log.metadata?.operacion && log.metadata.operacion.toLowerCase().includes(searchLower)) ||
        getActionLabel(log.action).toLowerCase().includes(searchLower);

      // Filtrar por usuario (userId o metadata.nombre_usuario)
      const usuarioMatch =
        log.userId.toLowerCase().includes(searchLower) ||
        (log.metadata?.nombre_usuario && log.metadata.nombre_usuario.toLowerCase().includes(searchLower));

      return operacionMatch || usuarioMatch;
    });
  }, [auditLogs, searchTerm]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredLogs.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
          <p className="text-gray-600 mt-1">
            {filteredLogs.length} registros de actividad del sistema
            {filteredLogs.length > logsPerPage && (
              <span className="ml-2 text-sm">
                (Página {currentPage} de {totalPages})
              </span>
            )}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={refreshLogs}
            disabled={loading}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Search Only - SOLO para operación y usuario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por operación (acción) o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
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
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Cargando registros...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
              <p className="text-gray-600">Intenta ajustar los términos de búsqueda</p>
            </div>
          ) : (
            currentLogs.map((log) => (
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
                        {log.incidentId && log.incidentId !== 'system' && log.incidentId !== 'ref' && (
                          <span className="text-sm text-gray-500">#{log.incidentId}</span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>

                    <p className="text-gray-900 mb-3">{log.details}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>por {log.metadata?.nombre_usuario || log.userId}</span>
                        </div>

                        {log.metadata?.rol_usuario && (
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(log.metadata.rol_usuario)}`}>
                              {getRoleLabel(log.metadata.rol_usuario)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Información adicional del contenido si existe */}
                      {log.metadata?.contenido && typeof log.metadata.contenido === 'object' && (
                        <div className="text-xs text-gray-400">
                          {log.metadata.contenido.email && (
                            <span className="mr-2">Email: {log.metadata.contenido.email}</span>
                          )}
                          {log.metadata.contenido.exito !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${log.metadata.contenido.exito ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {log.metadata.contenido.exito ? 'Exitoso' : 'Fallido'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {filteredLogs.length > logsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} de {filteredLogs.length} registros
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 text-sm rounded ${currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}