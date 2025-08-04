import { useState, useEffect } from 'react';
import { Incident, IncidentType, Severity, Status, User } from '../../types';
import { supabase } from '../../lib/supabase';

type SupabaseIncident = Incident;

export function useIncidents(currentUser: User | null) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para cargar incidentes desde Supabase
  const loadIncidentsFromSupabase = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando incidentes desde Supabase...');

      const { data, error } = await supabase
        .schema('incidents')
        .from('incidents')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error al cargar incidentes desde Supabase:', error);
        return;
      }

      if (!data || !Array.isArray(data)) {
        console.error('No se recibieron datos válidos de Supabase');
        return;
      }

      const mappedIncidents: Incident[] = data.map((item: any) => {
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
      console.log('✅ Incidentes cargados exitosamente:', mappedIncidents.length);
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadIncidentsFromSupabase();
    }
  }, [currentUser]);

  const addIncident = async (incident: Incident) => {
    try {
      console.log('🆕 Creando nuevo incidente:', incident.title);

      const incidentData = {
        id: incident.id,
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        assignedto: incident.assignedTo || '',
        affectedsystems: incident.affectedSystems || [],
        description: incident.description,
        impact: incident.impact || '',
        tags: incident.tags || [],
        createdat: incident.createdAt.toISOString(),
        updatedat: incident.updatedAt.toISOString(),
        reportedby: incident.reportedBy,
        resolvedat: incident.resolvedAt?.toISOString() || null,
        resolution: incident.resolution || null
      };

      const { data, error } = await supabase
        .schema('incidents')
        .from('incidents')
        .insert([incidentData])
        .select();

      if (error) {
        console.error('❌ Error al crear incidente:', error);
        throw error;
      }

      // Recargar datos desde la base de datos
      await loadIncidentsFromSupabase();

      console.log('✅ Incidente creado exitosamente:', data);
    } catch (error) {
      console.error('Error al crear incidente:', error);
      throw error;
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      console.log('🔄 Actualizando incidente:', id, updates);

      const updateData: any = {};

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.assignedTo !== undefined) {
        updateData.assignedto = updates.assignedTo;
      }
      if (updates.resolvedAt) {
        updateData.resolvedat = updates.resolvedAt.toISOString();
      }
      if (updates.resolution !== undefined) {
        updateData.resolution = updates.resolution;
      }

      updateData.updatedat = new Date().toISOString();

      const { error } = await supabase
        .schema('incidents')
        .from('incidents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error al actualizar incidente:', error);
        throw error;
      }

      // Recargar datos desde la base de datos
      await loadIncidentsFromSupabase();

      console.log('✅ Incidente actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar incidente:', error);
      throw error;
    }
  };

  const editIncident = async (incidentId: string, updatedIncident: Incident): Promise<boolean> => {
    try {
      console.log('🔄 Editando incidente completo:', incidentId);

      const incidentData = {
        title: updatedIncident.title,
        description: updatedIncident.description,
        type: updatedIncident.type,
        severity: updatedIncident.severity,
        status: updatedIncident.status,
        assignedto: updatedIncident.assignedTo || '',
        affectedsystems: updatedIncident.affectedSystems || [],
        impact: updatedIncident.impact || '',
        tags: updatedIncident.tags || [],
        updatedat: new Date().toISOString(),
        reportedby: updatedIncident.reportedBy,
        resolvedat: updatedIncident.resolvedAt ? updatedIncident.resolvedAt.toISOString() : null,
        resolution: updatedIncident.resolution || null
      };

      console.log('📤 Datos a enviar a Supabase:', incidentData);

      const { data, error } = await supabase
        .schema('incidents')
        .from('incidents')
        .update(incidentData)
        .eq('id', incidentId)
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Respuesta de Supabase:', data);

      // Recargar datos desde la base de datos para asegurar consistencia
      await loadIncidentsFromSupabase();

      console.log('✅ Incidente editado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al editar incidente:', error);
      throw error;
    }
  };

  const deleteIncident = async (incidentId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Eliminando incidente:', incidentId);

      const { error } = await supabase
        .schema('incidents')
        .from('incidents')
        .delete()
        .eq('id', incidentId);

      if (error) {
        console.error('❌ Error al eliminar incidente de Supabase:', error);
        throw error;
      }

      // Recargar datos desde la base de datos
      await loadIncidentsFromSupabase();

      console.log('✅ Incidente eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar incidente:', error);
      return false;
    }
  };

  return {
    incidents,
    loading,
    setIncidents,
    loadIncidentsFromSupabase,
    addIncident,
    updateIncident,
    editIncident,
    deleteIncident
  };
}