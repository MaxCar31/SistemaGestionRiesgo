import React from 'react';
import { Users, UserPlus, Mail, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function UsersView() {
  const { users } = useApp();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'analyst':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'analyst':
        return 'Analista';
      case 'viewer':
        return 'Observador';
      default:
        return role;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'analyst':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">{users.length} usuarios registrados en el sistema</p>
        </div>
        
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.department}</p>
                </div>
              </div>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                {getRoleIcon(user.roles[0])}
                <span className="ml-1">{getRoleLabel(user.roles[0])}</span>
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                Editar
              </button>
              <button className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Role Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles y Permisos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-red-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Administrador</h4>
              <p className="text-sm text-gray-600 mt-1">
                Acceso completo al sistema, puede gestionar usuarios y configuraciones globales.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Analista</h4>
              <p className="text-sm text-gray-600 mt-1">
                Puede crear, editar y gestionar incidentes. Acceso a reportes y auditoría.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-gray-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Observador</h4>
              <p className="text-sm text-gray-600 mt-1">
                Solo lectura. Puede ver incidentes y reportes, pero no puede modificar información.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}