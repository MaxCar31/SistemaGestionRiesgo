import { User } from '../../types';
import { RoleName, RolePermissions } from '../../types';

// Definir permisos por rol
export const ROLE_PERMISSIONS: Record<RoleName, RolePermissions> = {
  admin: {
    all: true
  },
  analista: {
    incidents: { read: true },
    reporte_incidente: { read: true, update_limited: true }
  },
  supervisor: {
    incidents: { read: true },
    reporte_incidente: { read: true, create: true, update: true }
  }
};

export function usePermissions() {
  // Función para verificar permisos
  const hasPermission = (permission: string, user: User | null): boolean => {
    if (!user || !user.roles || !user.permissions) return false;
    
    // Si el usuario tiene rol de admin, tiene todos los permisos
    if (user.roles.includes('admin')) return true;
    
    // Verificar en los permisos del usuario
    const permParts = permission.split('.');
    
    for (const permObj of user.permissions) {
      // Verificar que permObj sea un objeto válido antes de usar el operador 'in'
      if (permObj && typeof permObj === 'object' && 'all' in permObj && permObj.all === true) return true;
      
      let current: any = permObj;
      for (const part of permParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      
      if (current === true) return true;
    }
    
    return false;
  };

  return {
    ROLE_PERMISSIONS,
    hasPermission
  };
}
