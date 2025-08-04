import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Incident, AuditLog, IncidentType, Severity, Status, Role } from '../types';
import { mockUsers, mockIncidents, mockAuditLogs } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuthWithRoles } from '../hooks/useAuthWithRoles';

// Funciones de mapeo entre estados de DB y estados internos
const mapStatusToEstado = (status: Status): string => {
  const mapping: Record<Status, string> = {
    'open': 'Abiertos',
    'in_progress': 'En Progreso', 
    'resolved': 'Resueltos',
    'closed': 'Cerrados'
  };
  return mapping[status];
};

const mapEstadoToStatus = (estado: string): Status => {
  const mapping: Record<string, Status> = {
    'Abiertos': 'open',
    'En Progreso': 'in_progress',
    'Resueltos': 'resolved', 
    'Cerrados': 'closed'
  };
  return mapping[estado] || 'open';
};

// Tipo para los datos de Supabase
interface SupabaseIncident {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  severidad: string;
  estado: string;
  asignado_a: string | null;
  sistemas_afectados: string | null;
  impacto: string | null;
  etiquetas: string | null;
  creado_en: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  addAuditLog: (log: AuditLog) => void;
  loading: boolean;
  // Funciones relacionadas con roles
  loadUsersFromSupabase: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Usar nuestro hook de autenticación con roles
  const { currentUser: authUser, loading: authLoading } = useAuthWithRoles();
  
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

  // Usar el usuario del hook de autenticación
  const currentUser = authUser;
  const loading = authLoading;

  // Definir permisos por rol (actualizado para nuestros roles)
  const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
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
    supervisor: {
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
    analista: {
      canCreateIncidents: true,
      canEditIncidents: true,
      canDeleteIncidents: false,
      canAssignIncidents: false,
      canViewAuditLogs: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewReports: true,
      canExportData: false,
    },
  };

  // Función para verificar permisos
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    const rolePermissions = ROLE_PERMISSIONS[currentUser.role];
    return rolePermissions?.[permission] || false;
  };

  // Función para cargar usuarios desde Supabase
  const loadUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_con_roles')
        .select('*');

      if (error) {
        console.error('Error al cargar usuarios con roles:', error);
        return;
      }

      const mappedUsers: User[] = data?.map(user => ({
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

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  // Mapear role_id de Supabase a nuestros roles locales
  const mapSupabaseRoleToLocal = (roleId: string): 'admin' | 'analyst' | 'viewer' => {
    // Mapeo basado en los UUIDs de la imagen de Supabase
    switch (roleId) {
      case 'd41a7da5-5241-4f4e-9dc4-f9dd64...': // ID del rol admin
        return 'admin';
      case 'otro-uuid-analyst':
        return 'analyst';
      default:
        return 'viewer';
    }
  };

  // Función para cargar incidentes desde Supabase
  const loadIncidentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents_reporte_incidente')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error al cargar incidentes desde Supabase:', error);
        return;
      }

      // Mapear los datos de Supabase a nuestro formato
      const mappedIncidents: Incident[] = data.map((item: SupabaseIncident) => ({
        id: item.id,
        title: item.titulo,
        description: item.descripcion,
        type: item.tipo as IncidentType,
        severity: item.severidad as Severity,
        status: mapEstadoToStatus(item.estado),
        assignedTo: item.asignado_a || '',
        reportedBy: '1', // Por defecto
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.creado_en),
        tags: item.etiquetas ? item.etiquetas.split(',').filter(Boolean) : [],
        affectedSystems: item.sistemas_afectados ? item.sistemas_afectados.split(',').filter(Boolean) : [],
        impact: item.impacto || ''
      }));

      setIncidents(mappedIncidents);
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
    }
  };

  useEffect(() => {
    // Cargar incidentes al inicializar
    if (currentUser) {
      loadIncidentsFromSupabase();
    }
  }, [currentUser]);

  const addIncident = async (incident: Incident) => {
    try {
      // Preparar los datos para Supabase
      const incidentData = {
        id: incident.id,
        titulo: incident.title,
        tipo: incident.type,
        severidad: incident.severity,
        estado: mapStatusToEstado(incident.status),
        asignado_a: incident.assignedTo || null,
        sistemas_afectados: incident.affectedSystems.join(','),
        descripcion: incident.description,
        impacto: incident.impact,
        etiquetas: incident.tags.join(','),
        creado_en: incident.createdAt.toISOString()
      };

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('incidents_reporte_incidente')
        .insert([incidentData])
        .select();

      if (error) {
        console.error('Error al crear incidente en Supabase:', error);
        throw error;
      }

      // Actualizar el estado local solo si la inserción fue exitosa
      setIncidents(prev => [incident, ...prev]);
      
      // Add audit log
      const auditLog: AuditLog = {
        id: `LOG-${Date.now()}`,
        incidentId: incident.id,
        userId: currentUser?.id || '1',
        action: 'incident_created',
        details: `Incidente creado: ${incident.title}`,
        timestamp: new Date()
      };
      addAuditLog(auditLog);

      console.log('Incidente creado exitosamente:', data);
    } catch (error) {
      console.error('Error al crear incidente:', error);
      alert('Error al crear el incidente. Por favor, inténtalo de nuevo.');
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      // Preparar los datos para Supabase si incluye el estado
      if (updates.status) {
        const updateData: { estado?: string } = {};
        
        if (updates.status) {
          updateData.estado = mapStatusToEstado(updates.status);
        }
        
        // Actualizar en Supabase
        const { error } = await supabase
          .from('incidents_reporte_incidente')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error al actualizar incidente en Supabase:', error);
          throw error;
        }
      }

      // Actualizar el estado local
      setIncidents(prev => prev.map(incident => 
        incident.id === id ? { ...incident, ...updates, updatedAt: new Date() } : incident
      ));

      // Add audit log for status changes
      if (updates.status) {
        const auditLog: AuditLog = {
          id: `LOG-${Date.now()}`,
          incidentId: id,
          userId: currentUser?.id || '1',
          action: 'status_updated',
          details: `Estado cambiado a "${updates.status}"`,
          timestamp: new Date()
        };
        addAuditLog(auditLog);
      }
    } catch (error) {
      console.error('Error al actualizar incidente:', error);
      alert('Error al actualizar el incidente. Por favor, inténtalo de nuevo.');
    }
  };

  const addAuditLog = (log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      incidents,
      auditLogs,
      addIncident,
      updateIncident,
      addAuditLog,
      loading,
      loadUsersFromSupabase,
      hasPermission
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}