-- supabase/migrations/20250803_sync_incidents_schema.sql

BEGIN;

-- 0) Vaciar solo la tabla incidents.incidents (perderás todos los registros actuales)
TRUNCATE TABLE incidents.incidents;

-- 1) Soltar trigger y función antiguos para evitar errores al renombrar
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents.incidents;
DROP FUNCTION IF EXISTS incidents.update_updated_at_column();

-- 2) Renombrar columnas legacy a camelCase / inglés
ALTER TABLE incidents.incidents RENAME COLUMN titulo         TO title;
ALTER TABLE incidents.incidents RENAME COLUMN descripcion    TO description;
ALTER TABLE incidents.incidents RENAME COLUMN tipo           TO type;
ALTER TABLE incidents.incidents RENAME COLUMN severidad      TO severity;
ALTER TABLE incidents.incidents RENAME COLUMN estado         TO status;
ALTER TABLE incidents.incidents RENAME COLUMN asignado_a     TO assignedTo;
ALTER TABLE incidents.incidents RENAME COLUMN reportado_por  TO reportedBy;
ALTER TABLE incidents.incidents RENAME COLUMN creado_en      TO createdAt;
ALTER TABLE incidents.incidents RENAME COLUMN actualizado_en TO updatedAt;
ALTER TABLE incidents.incidents RENAME COLUMN resuelto_en    TO resolvedAt;
ALTER TABLE incidents.incidents RENAME COLUMN impacto        TO impact;

-- 3) Recrear la función de trigger sobre el nuevo campo updatedAt
CREATE OR REPLACE FUNCTION incidents.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- 4) Recrear el trigger
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents.incidents
  FOR EACH ROW
  EXECUTE FUNCTION incidents.update_updated_at_column();

-- 5) Añadir columnas nuevas para tu UI
ALTER TABLE incidents.incidents ADD COLUMN resolution       text;
ALTER TABLE incidents.incidents ADD COLUMN tags             text[]        DEFAULT '{}';
ALTER TABLE incidents.incidents ADD COLUMN affectedSystems text[]        DEFAULT '{}';

-- 6) Eliminar columnas legacy (ya no necesitamos migrar datos)
ALTER TABLE incidents.incidents DROP COLUMN etiquetas;
ALTER TABLE incidents.incidents DROP COLUMN sistemas_afectados;

-- 7) Ajustar el CHECK constraint de status a los valores de tu UI
ALTER TABLE incidents.incidents DROP CONSTRAINT incidents_estado_check;
ALTER TABLE incidents.incidents
  ADD CONSTRAINT incidents_status_check
    CHECK (status IN ('open','in_progress','resolved','closed'));

COMMIT;
