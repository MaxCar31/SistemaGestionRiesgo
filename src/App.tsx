import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import LoginForm from './components/Auth/LoginForm';
import SecurityQuestionsSetup from './components/Auth/SecurityQuestionsSetup';
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
  const { user, loading, signOut } = useAuth();
  const [needsSecuritySetup, setNeedsSecuritySetup] = useState<boolean | null>(null);

  // Función para forzar logout
  const handleForceLogout = async () => {
    console.log('🚪 Forzando logout...');
    await signOut();
    setNeedsSecuritySetup(null);
    window.location.reload();
  };

  // Verificar preguntas de seguridad cuando el usuario se loguea
  useEffect(() => {
    console.log('🔄 useEffect ejecutado - User:', !!user, 'Loading:', loading, 'NeedsSetup:', needsSecuritySetup);
    
    // Si está cargando, no hacer nada
    if (loading) {
      console.log('⏳ Esperando que termine de cargar...');
      return;
    }

    // Si no hay usuario, resetear estado
    if (!user) {
      console.log('👤 No hay usuario logueado');
      if (needsSecuritySetup !== null) {
        setNeedsSecuritySetup(null);
      }
      return;
    }

    // Si ya hemos determinado el estado, no volver a verificar
    if (needsSecuritySetup !== null) {
      console.log('ℹ️  Estado ya determinado:', needsSecuritySetup);
      return;
    }

    // Verificar preguntas de seguridad
    async function checkSecurityQuestions() {
      if (!user?.id) return;
      
      console.log('🔍 Verificando preguntas de seguridad para usuario:', user.id);

      try {
        // Usar función RPC para verificar si el usuario tiene respuestas configuradas
        const { data: hasAnswers, error } = await supabase.rpc(
          'check_user_has_security_answers',
          { p_user_id: user.id }
        );

        if (error) {
          console.error('Error al verificar preguntas:', error);
          setNeedsSecuritySetup(false);
          return;
        }

        console.log('📊 Usuario tiene preguntas configuradas:', hasAnswers);

        if (!hasAnswers) {
          console.log('🎯 Usuario necesita configurar preguntas de seguridad');
          setNeedsSecuritySetup(true);
        } else {
          console.log('✅ Usuario ya tiene preguntas configuradas');
          setNeedsSecuritySetup(false);
        }
      } catch (error) {
        console.error('Error al verificar preguntas:', error);
        setNeedsSecuritySetup(false);
      }
    }

    checkSecurityQuestions();
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manejar cuando se completa el setup de preguntas
  const handleSecuritySetupComplete = () => {
    console.log('✅ Setup de preguntas completado');
    setNeedsSecuritySetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => {
      console.log('✅ Login exitoso, recargando para verificar preguntas...');
      window.location.reload();
    }} />;
  }

  if (needsSecuritySetup === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Verificando configuración...</p>
          
          {user && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Usuario: {user.email}</p>
              <button
                onClick={handleForceLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => {
      console.log('✅ Login exitoso, recargando para verificar preguntas...');
      window.location.reload();
    }} />;
  }

  if (needsSecuritySetup) {
    return (
      <SecurityQuestionsSetup 
        onComplete={handleSecuritySetupComplete}
        title="Configurar Preguntas de Seguridad"
        isRequired={true}
      />
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;