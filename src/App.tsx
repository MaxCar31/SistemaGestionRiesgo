import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import IncidentsView from './components/Incidents/IncidentsView';
import UsersView from './components/Users/UsersView';
import AuditView from './components/Audit/AuditView';
import RoleManagementView from './components/Users/RoleManagementView';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function AppContent() {
  const [activeView, setActiveView] = useState('dashboard');
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'incidents':
        return <IncidentsView />;
      case 'users':
        return (
          <ProtectedRoute requiredPermission="canManageUsers">
            <UsersView />
          </ProtectedRoute>
        );
      case 'roles':
        return (
          <ProtectedRoute requiredPermission="canManageRoles">
            <RoleManagementView />
          </ProtectedRoute>
        );
      case 'audit':
        return (
          <ProtectedRoute requiredPermission="canViewAuditLogs">
            <AuditView />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute requiredRole="admin">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración del Sistema</h2>
              <p className="text-gray-600">Esta funcionalidad estará disponible próximamente</p>
            </div>
          </ProtectedRoute>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => window.location.reload()} />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;