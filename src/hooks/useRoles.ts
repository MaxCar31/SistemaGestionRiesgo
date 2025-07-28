import { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { supabase } from '../lib/supabase';

export interface RolePermissions {
  canCreateIncidents: boolean;
  canEditIncidents: boolean;
  canDeleteIncidents: boolean;
  canAssignIncidents: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewReports: boolean;
  canExportData: boolean;
}

// Definir permisos por rol
const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: true,
    canAssignIncidents: true,
    canViewAuditLogs: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewReports: true,
    canExportData: true,
  },
  analyst: {
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: false,
    canAssignIncidents: true,
    canViewAuditLogs: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewReports: true,
    canExportData: true,
  },
  viewer: {
    canCreateIncidents: false,
    canEditIncidents: false,
    canDeleteIncidents: false,
    canAssignIncidents: false,
    canViewAuditLogs: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewReports: true,
    canExportData: false,
  },
};

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar roles desde Supabase
  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*');

      if (error) {
        console.error('Error al cargar roles:', error);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener usuarios con sus roles desde Supabase
  const getUsersWithRoles = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('usuarios_con_roles')
        .select('*');

      if (error) {
        console.error('Error al cargar usuarios con roles:', error);
        return [];
      }

      return data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || 'Sin departamento',
        role: mapSupabaseRoleToLocal(user.role_id),
        is_active: user.is_active,
        auth_created_at: user.auth_created_at ? new Date(user.auth_created_at) : undefined,
        created_at: user.created_at ? new Date(user.created_at) : undefined,
        updated_at: user.updated_at ? new Date(user.updated_at) : undefined,
      })) || [];
    } catch (error) {
      console.error('Error al cargar usuarios con roles:', error);
      return [];
    }
  };

  // Asignar rol a usuario
  const assignRoleToUser = async (userId: string, roleId: string, assignedBy: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error al asignar rol:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error al asignar rol:', error);
      throw error;
    }
  };

  // Remover rol de usuario
  const removeRoleFromUser = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .match({ user_id: userId, role_id: roleId });

      if (error) {
        console.error('Error al remover rol:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error al remover rol:', error);
      throw error;
    }
  };

  // Obtener permisos de un usuario
  const getUserPermissions = (user: User): RolePermissions => {
    return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.viewer;
  };

  // Verificar si un usuario tiene un permiso específico
  const hasPermission = (user: User, permission: keyof RolePermissions): boolean => {
    const permissions = getUserPermissions(user);
    return permissions[permission];
  };

  // Mapear role_id de Supabase a nuestros roles locales
  const mapSupabaseRoleToLocal = (roleId: string): 'admin' | 'analyst' | 'viewer' => {
    // Aquí mapeas según los IDs que tengas en tu tabla de roles
    // Deberás ajustar estos UUIDs según tu base de datos
    switch (roleId) {
      case 'd41a7da5-5241-4f4e-9dc4-f9dd64...': // ID del rol admin en Supabase
        return 'admin';
      case 'otro-uuid-analyst':
        return 'analyst';
      default:
        return 'viewer';
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return {
    roles,
    loading,
    loadRoles,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser,
    getUserPermissions,
    hasPermission,
    ROLE_PERMISSIONS,
  };
}
