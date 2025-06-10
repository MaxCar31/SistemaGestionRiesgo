import { Incident, IncidentStats, Severity, IncidentType } from '../types';

export const getSeverityColor = (severity: Severity): string => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[severity];
};

export const getStatusColor = (status: string): string => {
  const colors = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getIncidentTypeLabel = (type: IncidentType): string => {
  const labels = {
    malware: 'Malware',
    phishing: 'Phishing',
    data_breach: 'Fuga de Datos',
    unauthorized_access: 'Acceso No Autorizado',
    ddos: 'Ataque DDoS',
    ransomware: 'Ransomware',
    social_engineering: 'Ingeniería Social',
    system_compromise: 'Compromiso de Sistema',
    policy_violation: 'Violación de Políticas',
    other: 'Otro'
  };
  return labels[type];
};

export const getStatusLabel = (status: string): string => {
  const labels = {
    open: 'Abierto',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };
  return labels[status as keyof typeof labels] || status;
};

export const getSeverityLabel = (severity: Severity): string => {
  const labels = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    critical: 'Crítico'
  };
  return labels[severity];
};

export const calculateIncidentStats = (incidents: Incident[]): IncidentStats => {
  const stats = {
    total: incidents.length,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    } as Record<Severity, number>,
    byType: {
      malware: 0,
      phishing: 0,
      data_breach: 0,
      unauthorized_access: 0,
      ddos: 0,
      ransomware: 0,
      social_engineering: 0,
      system_compromise: 0,
      policy_violation: 0,
      other: 0
    } as Record<IncidentType, number>
  };

  incidents.forEach(incident => {
    // Count by status
    switch (incident.status) {
      case 'open':
        stats.open++;
        break;
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'resolved':
        stats.resolved++;
        break;
      case 'closed':
        stats.closed++;
        break;
    }

    // Count by severity
    stats.bySeverity[incident.severity]++;

    // Count by type
    stats.byType[incident.type]++;
  });

  return stats;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateIncidentId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `INC-${timestamp}`;
};