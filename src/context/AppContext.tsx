import { createContext, useContext, ReactNode } from 'react';
import { User, Incident } from '../types';
import { useAuth, useUsers, useIncidents, usePermissions } from './hooks';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  incidents: Incident[];
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  loadUsersFromSupabase: () => Promise<void>;
  editIncident: (incidentId: string, updatedIncident: Incident) => Promise<boolean>;
  deleteIncident: (incidentId: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Usar los hooks individuales
  const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
  const { users, loadUsersFromSupabase } = useUsers();
  const { incidents, addIncident, editIncident, deleteIncident, updateIncident } = useIncidents(currentUser);
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
      loading: authLoading,
      editIncident,
      deleteIncident,
      setCurrentUser,
      addIncident,
      updateIncident,
      loadUsersFromSupabase,
      hasPermission,
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