import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Incident, IncidentType, Severity } from '../../types';
import { generateIncidentId } from '../../utils/helpers';

interface CreateIncidentModalProps {
  onClose: () => void;
}

export default function CreateIncidentModal({ onClose }: CreateIncidentModalProps) {
  const { users, addIncident, currentUser } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other' as IncidentType,
    severity: 'medium' as Severity,
    assignedTo: '',
    affectedSystems: '',
    impact: '',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newIncident: Incident = {
      id: generateIncidentId(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      severity: formData.severity,
      status: 'open',
      assignedTo: formData.assignedTo,
      reportedBy: currentUser?.id || '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      affectedSystems: formData.affectedSystems.split(',').map(system => system.trim()).filter(Boolean),
      impact: formData.impact
    };

    addIncident(newIncident);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Incidente</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Título */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Incidente *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe brevemente el incidente"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Incidente *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="malware">Malware</option>
                <option value="phishing">Phishing</option>
                <option value="data_breach">Fuga de Datos</option>
                <option value="unauthorized_access">Acceso No Autorizado</option>
                <option value="ddos">Ataque DDoS</option>
                <option value="ransomware">Ransomware</option>
                <option value="social_engineering">Ingeniería Social</option>
                <option value="system_compromise">Compromiso de Sistema</option>
                <option value="policy_violation">Violación de Políticas</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Severidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severidad *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>

            {/* Asignado a */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignar a
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un analista</option>
                {users.filter(user => user.role !== 'viewer').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Sistemas Afectados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistemas Afectados
              </label>
              <input
                type="text"
                name="affectedSystems"
                value={formData.affectedSystems}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Servidor Web, Base de Datos, etc. (separados por comas)"
              />
            </div>

            {/* Descripción */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe detalladamente el incidente, cómo fue detectado, y cualquier información relevante"
              />
            </div>

            {/* Impacto */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impacto del Incidente
              </label>
              <textarea
                name="impact"
                value={formData.impact}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe el impacto en la organización, usuarios afectados, servicios interrumpidos, etc."
              />
            </div>

            {/* Tags */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Etiquetas para clasificar el incidente (separadas por comas)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Crear Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}