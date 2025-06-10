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
    id: 'INC-001',
    title: 'Intento de phishing detectado en correos corporativos',
    description: 'Se detectaron múltiples emails de phishing dirigidos a empleados del departamento de finanzas.',
    type: 'phishing',
    severity: 'high',
    status: 'in_progress',
    assignedTo: '2',
    reportedBy: '1',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
    tags: ['email', 'finanzas', 'credential_theft'],
    affectedSystems: ['Exchange Server', 'Outlook Web App'],
    impact: 'Posible compromiso de credenciales de 15 usuarios del departamento de finanzas'
  },
  {
    id: 'INC-002',
    title: 'Acceso no autorizado a servidor de archivos',
    description: 'Se detectó acceso desde una IP externa no autorizada al servidor de archivos compartidos.',
    type: 'unauthorized_access',
    severity: 'critical',
    status: 'open',
    assignedTo: '2',
    reportedBy: '3',
    createdAt: new Date('2024-01-14T16:45:00'),
    updatedAt: new Date('2024-01-14T16:45:00'),
    tags: ['network', 'file_server', 'external_access'],
    affectedSystems: ['File Server FS-01', 'Network Firewall'],
    impact: 'Acceso potencial a documentos confidenciales de la empresa'
  },
  {
    id: 'INC-003',
    title: 'Malware detectado en estación de trabajo',
    description: 'El antivirus corporativo detectó y bloqueó malware en la computadora del usuario en el área de contabilidad.',
    type: 'malware',
    severity: 'medium',
    status: 'resolved',
    assignedTo: '3',
    reportedBy: '2',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T15:30:00'),
    resolvedAt: new Date('2024-01-13T15:30:00'),
    tags: ['endpoint', 'malware', 'contabilidad'],
    affectedSystems: ['PC-CONT-05', 'Symantec Endpoint Protection'],
    impact: 'Sistema comprometido temporalmente, sin propagación detectada',
    resolution: 'Malware eliminado, sistema limpio y actualizado. Usuario capacitado sobre mejores prácticas.'
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