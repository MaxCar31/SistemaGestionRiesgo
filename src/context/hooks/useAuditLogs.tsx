import { useState } from 'react';
import { AuditLog } from '../../types';
import { mockAuditLogs } from '../../data/mockData';

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

  const addAuditLog = (log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  };

  return {
    auditLogs,
    addAuditLog
  };
}
