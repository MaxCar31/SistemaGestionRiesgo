import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import IncidentList from './IncidentList';
import IncidentFilters from './IncidentFilters';
import { useApp } from '../../context/AppContext';
import { Severity, Status, IncidentType } from '../../types';

export default function IncidentsView() {
  const { incidents } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    type: '',
    assignedTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (!filters.severity || incident.severity === filters.severity) &&
      (!filters.status || incident.status === filters.status) &&
      (!filters.type || incident.type === filters.type) &&
      (!filters.assignedTo || incident.assignedTo === filters.assignedTo);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Incidentes</h1>
          <p className="text-gray-600 mt-1">
            {filteredIncidents.length} de {incidents.length} incidentes
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exportar
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
                placeholder="Buscar incidentes por ID, título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <IncidentFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        )}
      </div>

      {/* Incidents List */}
      <IncidentList incidents={filteredIncidents} />
    </div>
  );
}