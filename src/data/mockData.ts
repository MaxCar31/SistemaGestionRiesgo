import { User, Incident, AuditLog, IncidentType, Severity, Status } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@empresa.com',
    role: 'admin',
    department: 'Seguridad IT'
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    role: 'analyst',
    department: 'Seguridad IT'
  },
  {
    id: '3',
    name: 'María Rodriguez',
    email: 'maria.rodriguez@empresa.com',
    role: 'analyst',
    department: 'Operaciones IT'
  },
  {
    id: '4',
    name: 'Juan Martínez',
    email: 'juan.martinez@empresa.com',
    role: 'viewer',
    department: 'RRHH'
  }
];

export const mockIncidents: Incident[] = [
  
  {

  },

  {
    id: 'INC-004',
    title: 'Vulnerabilidad crítica en servidor web público',
    description: 'Se identificó una vulnerabilidad de ejecución remota de código en el servidor web principal.',
    type: 'system_compromise',
    severity: 'critical',
    status: 'in_progress',
    assignedTo: '1',
    reportedBy: '2',
    createdAt: new Date('2024-01-12T13:20:00'),
    updatedAt: new Date('2024-01-14T11:15:00'),
    tags: ['web_server', 'rce', 'public_facing'],
    affectedSystems: ['Web Server WEB-01', 'Load Balancer'],
    impact: 'Exposición crítica de datos y posible compromiso total del servidor'
  },
  {
    id: 'INC-005',
    title: 'Fuga menor de datos en base de datos de desarrollo',
    description: 'Se detectó que datos de prueba con información simulada fueron expuestos temporalmente.',
    type: 'data_breach',
    severity: 'low',
    status: 'closed',
    assignedTo: '3',
    reportedBy: '1',
    createdAt: new Date('2024-01-10T14:30:00'),
    updatedAt: new Date('2024-01-11T10:45:00'),
    resolvedAt: new Date('2024-01-11T10:45:00'),
    tags: ['database', 'development', 'minor_breach'],
    affectedSystems: ['Dev Database DEV-DB-02'],
    impact: 'Exposición de datos de prueba sin información real de clientes',
    resolution: 'Acceso restringido, configuración de seguridad reforzada en entorno de desarrollo.'
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