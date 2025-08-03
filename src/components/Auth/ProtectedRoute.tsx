import React from 'react'
import { useApp } from '../../context/AppContext'
import type { RoleName } from '../../types'  // Ajusta la ruta según donde tengas tus tipos

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Nombre de rol según RoleName: 'analista' | 'admin' | 'supervisor' */
  requiredRole?: RoleName
  /** Ruta de permiso, e.g. 'incidents.read' o la que uses en hasPermission */
  requiredPermission?: string
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}) => {
  const { currentUser, hasPermission } = useApp()

  // No hay usuario logueado
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
    )
  }

  // Verificar rol requerido
  if (requiredRole && !currentUser.roles?.includes(requiredRole)) {
    return (
      fallback || (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
            <p className="text-red-600 mt-1">
              Necesitas el rol <strong>{requiredRole}</strong> para ver esta sección.
            </p>
          </div>
        </div>
      )
    )
  }

  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
            <p className="text-red-600 mt-1">
              No tienes permiso <strong>{requiredPermission}</strong> para realizar esta acción.
            </p>
          </div>
        </div>
      )
    )
  }

  // OK: mostrar el contenido protegido
  return <>{children}</>
}

export default ProtectedRoute
