import { createContext, useContext, ReactNode } from 'react';
import { User, Incident, AuditLog } from '../types';
import { useAuth, useUsers, useIncidents, useAuditLogs, usePermissions } from './hooks';
import { LogFilter } from './hooks/useAuditLogs';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;
  filters: LogFilter;
  setCurrentUser: (user: User | null) => void;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  editIncident: (incidentId: string, updatedIncident: Incident) => Promise<boolean>;
  deleteIncident: (incidentId: string) => Promise<boolean>;
  addAuditLog: (log: AuditLog) => void;
  loadUsersFromSupabase: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  updateFilters: (filters: LogFilter) => void;
  clearFilters: () => void;
  refreshLogs: () => void;
  loadLogs: (filters?: LogFilter) => void;
  getLogById: (id: number) => Promise<{ data: AuditLog | null; error: string | null }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Usar los hooks individuales
  const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
  const { users, loadUsersFromSupabase } = useUsers();
  const { incidents, addIncident, updateIncident, editIncident, deleteIncident } = useIncidents(currentUser);
  const { auditLogs, addAuditLog } = useAuditLogs();
  const { hasPermission: checkPermission } = usePermissions();
  // Función wrapper para comprobar permisos con el usuario currentUser
  const hasPermission = (permission: string): boolean => {
    return checkPermission(permission, currentUser);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      incidents,
      auditLogs,
      loading: authLoading || auditLoading,
      error: auditError,
      filters,
      setCurrentUser,
      addIncident,
      updateIncident,
      editIncident,
      deleteIncident,
      addAuditLog,
      loadUsersFromSupabase,
      hasPermission,
      updateFilters,
      clearFilters,
      refreshLogs,
      loadLogs,
      getLogById
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}