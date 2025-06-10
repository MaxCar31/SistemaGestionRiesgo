export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  department: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: Severity;
  status: Status;
  assignedTo: string;
  reportedBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: string[];
  affectedSystems: string[];
  impact: string;
  resolution?: string;
}

export type IncidentType = 
  | 'malware'
  | 'phishing'
  | 'data_breach'
  | 'unauthorized_access'
  | 'ddos'
  | 'ransomware'
  | 'social_engineering'
  | 'system_compromise'
  | 'policy_violation'
  | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface AuditLog {
  id: string;
  incidentId: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface IncidentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  bySeverity: Record<Severity, number>;
  byType: Record<IncidentType, number>;
}