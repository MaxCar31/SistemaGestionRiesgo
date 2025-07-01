import React from 'react';
import { X, User, Calendar, Clock, Tag, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Incident } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  getSeverityColor, 
  getStatusColor,
  formatDate, 
  getIncidentTypeLabel, 
  getSeverityLabel,
  getStatusLabel
} from '../../utils/helpers';

interface IncidentDetailsModalProps {
  incident: Incident;
  onClose: () => void;
}

export default function IncidentDetailsModal({ incident, onClose }: IncidentDetailsModalProps) {
  const { users } = useApp();

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuario no encontrado';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-6 h-6 ${
              incident.severity === 'critical' ? 'text-red-500' :
              incident.severity === 'high' ? 'text-orange-500' :
              incident.severity === 'medium' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{incident.title}</h2>
              <p className="text-sm text-gray-500">ID: {incident.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Estado</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>
                {getStatusLabel(incident.status)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Severidad</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                {getSeverityLabel(incident.severity)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tipo</span>
              </div>
              <span className="text-sm text-gray-900">{getIncidentTypeLabel(incident.type)}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Asignado a</span>
              </div>
              <span className="text-sm text-gray-900">{getUserName(incident.assignedTo)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{incident.description}</p>
            </div>
          </div>

          {/* Impact */}
          {incident.impact && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Impacto</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800">{incident.impact}</p>
              </div>
            </div>
          )}

          {/* Resolution */}
          {incident.resolution && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolución</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{incident.resolution}</p>
              </div>
            </div>
          )}

          {/* Affected Systems */}
          {incident.affectedSystems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sistemas Afectados</h3>
              <div className="flex flex-wrap gap-2">
                {incident.affectedSystems.map((system, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {system}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {incident.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {incident.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cronología</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Creado:</span>
                <span className="text-gray-900">{formatDate(incident.createdAt)}</span>
                <span className="text-gray-600">por {getUserName(incident.reportedBy)}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Última actualización:</span>
                <span className="text-gray-900">{formatDate(incident.updatedAt)}</span>
              </div>
              
              {incident.resolvedAt && (
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Resuelto:</span>
                  <span className="text-gray-900">{formatDate(incident.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Editar Incidente
          </button>
        </div>
      </div>
    </div>
  );
}