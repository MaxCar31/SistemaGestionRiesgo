import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Incident, AuditLog, IncidentType, Severity, Status } from '../types';
import { mockUsers, mockIncidents, mockAuditLogs } from '../data/mockData';
import { supabase } from '../lib/supabase';

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
  setCurrentUser: (user: User | null) => void;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  addAuditLog: (log: AuditLog) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(mockUsers);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Get initial session and set up auth listener
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Map Supabase user to our User type
        const mappedUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'analyst',
          department: session.user.user_metadata?.department || 'Seguridad IT'
        };
        setCurrentUser(mappedUser);
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const mappedUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'analyst',
            department: session.user.user_metadata?.department || 'Seguridad IT'
          };
          setCurrentUser(mappedUser);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      setCurrentUser,
      addIncident,
      updateIncident,
      addAuditLog,
      loading
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