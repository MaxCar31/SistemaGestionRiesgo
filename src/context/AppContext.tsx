import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Incident, AuditLog } from '../types';
import { mockUsers, mockIncidents, mockAuditLogs } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  setCurrentUser: (user: User | null) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
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
      async (event, session) => {
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

  const addIncident = (incident: Incident) => {
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
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
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