import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Settings,
  Activity,
  Shield,
  LucideIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incidentes', icon: AlertTriangle },
  { id: 'users', label: 'Usuarios', icon: Users, requiredPermission: 'canManageUsers' },
  { id: 'roles', label: 'Gestión de Roles', icon: Shield, requiredPermission: 'canManageRoles' },
  { id: 'audit', label: 'Auditoría', icon: Activity, requiredPermission: 'canViewAuditLogs' },
  { id: 'settings', label: 'Configuración', icon: Settings, adminOnly: true }
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { currentUser, hasPermission } = useApp();

  // Filtrar elementos del menú basado en permisos
  const visibleMenuItems = menuItems.filter(item => {
    if (!currentUser) return false;
    
    if (item.adminOnly && currentUser.role !== 'admin') {
      return false;
    }
    
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }
    
    return true;
  });

  return (
    <aside className="w-64 bg-gray-900 text-white h-full">
      <nav className="mt-8">
        <div className="px-4 mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menú Principal
          </h2>
        </div>
        
        <ul className="space-y-2 px-3">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}