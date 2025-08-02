import React from 'react';
import { useApp } from '../../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: 'admin' | 'analyst' | 'viewer';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback 
}) => {
  const { currentUser, hasPermission } = useApp();

  // Si no hay usuario logueado
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Requerido
          </h3>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  // Verificar rol requerido
  if (requiredRole && currentUser.role !== requiredRole) {
    return fallback || (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
          <p className="text-red-600 mt-1">
            No tienes el rol necesario ({requiredRole}) para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
          <p className="text-red-600 mt-1">
            No tienes permisos suficientes para realizar esta acción.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
