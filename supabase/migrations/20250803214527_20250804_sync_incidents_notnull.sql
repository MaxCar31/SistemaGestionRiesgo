BEGIN;

ALTER TABLE incidents.incidents
  ALTER COLUMN assignedTo     SET DEFAULT '',
  ALTER COLUMN assignedTo     SET NOT NULL,
  ALTER COLUMN reportedBy     SET DEFAULT '',
  ALTER COLUMN reportedBy     SET NOT NULL,
  ALTER COLUMN impact         SET DEFAULT '',
  ALTER COLUMN impact         SET NOT NULL,
  ALTER COLUMN createdAt      SET DEFAULT now(),
  ALTER COLUMN createdAt      SET NOT NULL,
  ALTER COLUMN updatedAt      SET DEFAULT now(),
  ALTER COLUMN updatedAt      SET NOT NULL,
  ALTER COLUMN tags           SET DEFAULT '{}',
  ALTER COLUMN tags           SET NOT NULL,
  ALTER COLUMN affectedSystems SET DEFAULT '{}',
  ALTER COLUMN affectedSystems SET NOT NULL;

COMMIT;
