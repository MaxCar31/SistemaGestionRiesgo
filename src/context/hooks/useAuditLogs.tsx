import { useState, useEffect, useCallback } from 'react';
import { supabaseLogs } from '../../lib/supabase';
import { AuditLog } from '../../types';

export interface LogFilter {
  tipo_log?: string;
  fecha?: Date;
}

export interface DatabaseLog {
  tipo_log: string;
  operacion: string;
  entidad: string;
  referencia_id: string;
  nombre_usuario: string;
  rol_usuario: string;
  contenido: any;
  fecha: string;
}

// Transformar datos de DB a AuditLog
const transformDatabaseLogToAuditLog = (log: DatabaseLog): AuditLog => {
  return {
    id: `${log.tipo_log}_${log.referencia_id}_${new Date(log.fecha).getTime()}`,
    action: `${log.tipo_log}_${log.operacion}`,
    userId: log.nombre_usuario || 'Sistema',
    incidentId: log.referencia_id,
    details: `${log.operacion} en ${log.entidad}: ${log.contenido?.titulo || log.contenido?.descripcion || 'Sin título'}`,
    timestamp: new Date(log.fecha),
    metadata: {
      tipo_log: log.tipo_log,
      operacion: log.operacion,
      entidad: log.entidad,
      rol_usuario: log.rol_usuario,
      contenido: log.contenido
    }
  };
};

// Hook principal
export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]); // Todos los logs cargados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilter>({});

  // Función para cargar todos los logs una sola vez
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Llamar a la función de base de datos para obtener logs descifrados
      const { data: logs, error: logsError } = await supabaseLogs
        .rpc('get_log_sistema');

      if (logsError) {
        console.error('Error al cargar logs:', logsError);
        setError(logsError.message);
        return;
      }

      if (!logs || logs.length === 0) {
        setAllLogs([]);
        setAuditLogs([]);
        return;
      }

      // Transformar logs a formato AuditLog
      const transformedLogs = logs.map(log => {
        const dbLog: DatabaseLog = {
          tipo_log: log.tipo_log || 'sistema',
          operacion: log.operacion || 'operacion',
          entidad: log.entidad || 'entidad',
          referencia_id: log.referencia_id || 'ref',
          nombre_usuario: log.nombre_usuario || 'Sistema',
          rol_usuario: log.rol_usuario || 'usuario',
          contenido: log.contenido || {},
          fecha: log.fecha
        };
        return transformDatabaseLogToAuditLog(dbLog);
      });

      setAllLogs(transformedLogs);
      setAuditLogs(transformedLogs); // Mostrar todos inicialmente
    } catch (err) {
      console.error('Error inesperado al cargar logs:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros sobre los datos ya cargados
  const applyFilters = useCallback((filtersToApply: LogFilter, logsToFilter: AuditLog[]) => {
    if (!logsToFilter.length) return [];

    let filteredLogs = logsToFilter;

    // Filtro por tipo de log
    if (filtersToApply.tipo_log) {
      filteredLogs = filteredLogs.filter(log =>
        log.metadata?.tipo_log?.toLowerCase().includes(filtersToApply.tipo_log!.toLowerCase())
      );
    }

    // Filtro por fecha
    if (filtersToApply.fecha) {
      const filterDate = new Date(filtersToApply.fecha);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= filterDate && logDate < nextDay;
      });
    }

    return filteredLogs;
  }, []);

  // Efecto para aplicar filtros cuando cambian los datos o filtros
  useEffect(() => {
    if (allLogs.length > 0) {
      const filtered = applyFilters(filters, allLogs);
      setAuditLogs(filtered);
    }
  }, [allLogs, filters, applyFilters]);

  // Cargar logs iniciales
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Actualizar filtros
  const updateFilters = useCallback((newFilters: LogFilter) => {
    setFilters(newFilters);
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Recargar logs desde la base de datos
  const refreshLogs = useCallback(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    auditLogs,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshLogs,
    loadLogs
  };
}