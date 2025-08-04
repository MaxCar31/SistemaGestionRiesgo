import { useState, useEffect } from 'react';
import { Incident, IncidentType, Severity, Status, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuditLogs } from './useAuditLogs';

// Tipo para los datos de Supabase, usando el tipo generado de la base de datos
type SupabaseIncident = Incident;

export function useIncidents(currentUser: User | null) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { addAuditLog } = useAuditLogs();

  // Función para cargar incidentes desde Supabase
  const loadIncidentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error al cargar incidentes desde Supabase:', error);
        return;
      }

      // Make sure data exists and is an array
      if (!data || !Array.isArray(data)) {
        console.error('No se recibieron datos válidos de Supabase');
        return;
      }

      // Mapear los datos de Supabase a nuestro formato
      const mappedIncidents: Incident[] = data.map((item: any) => {
        // Ensure the item has the expected shape
        if (!item || typeof item !== 'object') {
          console.warn('Item inválido en los resultados:', item);
          return null;
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as IncidentType,
          severity: item.severity as Severity,
          status: item.status as Status,
          assignedTo: item.assignedto || '',
          reportedBy: item.reportedby,
          createdAt: new Date(item.createdat),
          updatedAt: new Date(item.updatedat),
          resolvedAt: item.resolvedat ? new Date(item.resolvedat) : undefined,
          tags: item.tags || [],
          affectedSystems: item.affectedsystems || [],
          impact: item.impact || '',
          resolution: item.resolution || undefined
        };
      }).filter((incident): incident is Incident => incident !== null);

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
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        assignedto: incident.assignedTo || '',
        affectedsystems: incident.affectedSystems,
        description: incident.description,
        impact: incident.impact,
        tags: incident.tags,
        createdat: incident.createdAt.toISOString(),
        updatedat: incident.updatedAt.toISOString(),
        reportedby: incident.reportedBy,
        resolvedat: incident.resolvedAt?.toISOString() || null,
        resolution: incident.resolution || null
      };

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('incidents')
        .insert([incidentData])
        .select();

      if (error) {
        console.error('Error al crear incidente en Supabase:', error);
        throw error;
      }

      // Actualizar el estado local solo si la inserción fue exitosa
      setIncidents(prev => [incident, ...prev]);
      
      // Add audit log
      addAuditLog({
        id: `LOG-${Date.now()}`,
        incidentId: incident.id,
        userId: currentUser?.id || '1',
        action: 'incident_created',
        details: `Incidente creado: ${incident.title}`,
        timestamp: new Date()
      });

      console.log('Incidente creado exitosamente:', data);
    } catch (error) {
      console.error('Error al crear incidente:', error);
      alert('Error al crear el incidente. Por favor, inténtalo de nuevo.');
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      // Preparar los datos para Supabase
      const updateData: Partial<SupabaseIncident> = {};
      
      if (updates.status) {
        updateData.status = updates.status;
      }
      if (updates.assignedTo) {
        updateData.assignedto = updates.assignedTo;
      }
      if (updates.resolvedAt) {
        updateData.resolvedat = updates.resolvedAt.toISOString();
      }
      if (updates.resolution) {
        updateData.resolution = updates.resolution;
      }
      
      // Siempre actualizar el timestamp
      updateData.updatedat = new Date().toISOString();
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar incidente en Supabase:', error);
        throw error;
      }

      // Actualizar el estado local
      setIncidents(prev => prev.map(incident => 
        incident.id === id ? { ...incident, ...updates, updatedAt: new Date() } : incident
      ));

      // Add audit log for status changes
      if (updates.status) {
        addAuditLog({
          id: `LOG-${Date.now()}`,
          incidentId: id,
          userId: currentUser?.id || '1',
          action: 'status_updated',
          details: `Estado cambiado a "${updates.status}"`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error al actualizar incidente:', error);
      alert('Error al actualizar el incidente. Por favor, inténtalo de nuevo.');
    }
  };

  return {
    incidents,
    setIncidents,
    loadIncidentsFromSupabase,
    addIncident,
    updateIncident
  };
}
