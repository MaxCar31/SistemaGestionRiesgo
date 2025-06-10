import React from 'react';
import { Clock, User } from 'lucide-react';
import { Incident } from '../../types';
import { getSeverityColor, formatDate, getIncidentTypeLabel } from '../../utils/helpers';

interface RecentIncidentsProps {
  incidents: Incident[];
}

export default function RecentIncidents({ incidents }: RecentIncidentsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Incidentes Recientes</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`w-3 h-3 rounded-full mt-2 ${
              incident.severity === 'critical' ? 'bg-red-500' :
              incident.severity === 'high' ? 'bg-orange-500' :
              incident.severity === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}></div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-900 truncate">{incident.title}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{incident.id}</span>
                <span>•</span>
                <span>{getIncidentTypeLabel(incident.type)}</span>
                <span>•</span>
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  Asignado
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(incident.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Ver todos los incidentes →
        </button>
      </div>
    </div>
  );
}