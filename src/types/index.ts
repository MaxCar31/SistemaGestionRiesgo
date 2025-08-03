export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: JSON | null;
  created_at: string | null;
  updated_at: string | null;

}

export type RoleName = 'analista' | 'admin' | 'supervisor'


export interface User {
  id: string | null;
  name: string | null;
  department: string | null;
  is_active: boolean | null;
  email: string | null;
  auth_created_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles: RoleName[] | null;         
  permissions: JSON[] | null;  
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