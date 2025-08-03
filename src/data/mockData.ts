import { User, Incident, AuditLog, IncidentType, Severity, Status, RoleName, RolePermissions } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@empresa.com',
    roles: ['admin'],
    permissions: [{ all: true }],
    department: 'Seguridad IT',
    is_active: true,
    auth_created_at: '2023-12-01T10:00:00',
    created_at: '2023-12-01T10:00:00',
    updated_at: '2024-01-15T08:30:00'
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    roles: ['analista'],
    permissions: [{ incidents: { read: true }, reporte_incidente: { read: true, update_limited: true } }],
    department: 'Seguridad IT',
    is_active: true,
    auth_created_at: '2023-12-05T11:30:00',
    created_at: '2023-12-05T11:30:00',
    updated_at: '2024-01-10T09:45:00'
  },
  {
    id: '3',
    name: 'María Rodriguez',
    email: 'maria.rodriguez@empresa.com',
    roles: ['analista'],
    permissions: [{ incidents: { read: true }, reporte_incidente: { read: true, update_limited: true } }],
    department: 'Operaciones IT',
    is_active: true,
    auth_created_at: '2023-12-10T14:15:00',
    created_at: '2023-12-10T14:15:00',
    updated_at: '2024-01-05T16:20:00'
  },
  {
    id: '4',
    name: 'Juan Martínez',
    email: 'juan.martinez@empresa.com',
    roles: ['supervisor'],
    permissions: [{ incidents: { read: true }, reporte_incidente: { read: true, create: true, update: true } }],
    department: 'RRHH',
    is_active: true,
    auth_created_at: '2023-12-15T09:00:00',
    created_at: '2023-12-15T09:00:00',
    updated_at: '2024-01-20T10:10:00'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    incidentId: 'INC-001',
    userId: '1',
    action: 'incident_created',
    details: 'Incidente creado: Intento de phishing detectado',
    timestamp: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'LOG-002',
    incidentId: 'INC-001',
    userId: '1',
    action: 'incident_assigned',
    details: 'Incidente asignado a Carlos López',
    timestamp: new Date('2024-01-15T10:35:00')
  },
  {
    id: 'LOG-003',
    incidentId: 'INC-001',
    userId: '2',
    action: 'status_updated',
    details: 'Estado cambiado de "abierto" a "en progreso"',
    timestamp: new Date('2024-01-15T14:20:00')
  }
];