import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useAuth } from './hooks/useAuth'

import LoginForm from './components/Auth/LoginForm'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'

import DashboardView from './components/Dashboard/DashboardView'
import IncidentsView from './components/Incidents/IncidentsView'
import UsersView from './components/Users/UsersView'
import AuditView from './components/Audit/AuditView'

const viewMap: Record<string, string> = {
  dashboard: 'dashboard',
  incidents: 'incidents',
  users: 'users',
  roles: 'roles',
  audit: 'audit',
  settings: 'settings',
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeView, setActiveView] = useState('dashboard')

  useEffect(() => {
    const path = location.pathname.replace('/', '')
    if (viewMap[path]) {
      setActiveView(viewMap[path])
    } else if (location.pathname === '/') {
      navigate('/dashboard', { replace: true })
    } else {
      setActiveView('dashboard')
    }
  }, [location.pathname, navigate])

  const handleViewChange = (view: string) => {
    setActiveView(view)
    const url =
      Object.keys(viewMap).find((key) => viewMap[key] === view) ||
      'dashboard'
    navigate(`/${url}`)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />

      case 'incidents':
        return (
          <ProtectedRoute requiredPermission="admin">
            <IncidentsView />
          </ProtectedRoute>
        )
      case 'users':
        return (
          <ProtectedRoute requiredRole="admin">
            <UsersView />
          </ProtectedRoute>
        )

      case 'audit':
        return (
          <ProtectedRoute requiredRole="admin">
            <AuditView />
          </ProtectedRoute>
        )

      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onSuccess={() => window.location.reload()} />
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Todas las rutas cargan el mismo AppContent */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App


