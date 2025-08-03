import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ResetPassword from './ResetPassword';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: ''
  });

  useEffect(() => {
    // Verificar si estamos en la URL de reset de contraseña
    const handleHashChange = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const pathname = window.location.pathname;
      
      // Verificar diferentes formatos de URL de recuperación
      const isRecoveryUrl = 
        hash.includes('#reset-password') || 
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        pathname.includes('/auth/v1/verify');
      
      if (isRecoveryUrl) {
        // Si ya tenemos tokens guardados, no procesar de nuevo
        const existingToken = sessionStorage.getItem('recovery_access_token');
        if (existingToken && hash === '#reset-password') {
          setShowResetPassword(true);
          return;
        }
        
        // Manejar diferentes formatos de URL
        if (hash.includes('access_token=') || search.includes('type=recovery') || pathname.includes('/auth/v1/verify')) {
          setShowResetPassword(true);
          
          // Si los tokens están en el hash, procesarlos manualmente
          if (hash.includes('access_token=')) {
            // Extraer los tokens del hash y convertirlos a query params para Supabase
            const hashParts = hash.split('#');
            let tokenString = '';
            
            // Buscar la parte que contiene los tokens
            for (const part of hashParts) {
              if (part.includes('access_token=')) {
                tokenString = part;
                break;
              }
            }
            
            if (tokenString) {
              // Crear una URL temporal con los tokens como query params
              const tempUrl = new URL(window.location.origin + '/?' + tokenString);
              
              // Extraer los parámetros necesarios
              const accessToken = tempUrl.searchParams.get('access_token');
              const refreshToken = tempUrl.searchParams.get('refresh_token');
              const type = tempUrl.searchParams.get('type');
              
              if (accessToken && type === 'recovery') {
                try {
                  // IMPORTANTE: NO establecer la sesión inmediatamente
                  // Solo verificar que el token es válido para mostrar el formulario de reset
                  
                  // Guardar los tokens temporalmente para usar después del reset
                  sessionStorage.setItem('recovery_access_token', accessToken);
                  sessionStorage.setItem('recovery_refresh_token', refreshToken || '');
                  
                  // Limpiar la URL para que sea más legible
                  window.history.replaceState(null, '', `${window.location.origin}/#reset-password`);
                  return;
                } catch {
                  setError('Error al procesar el enlace de recuperación.');
                  setShowResetPassword(false);
                }
              }
            }
          }
        } else {
          // Solo el hash #reset-password sin tokens
          setShowResetPassword(true);
        }
      }
    };

    // Verificar el hash inicial
    handleHashChange();

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Limpiar el listener al desmontar el componente
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleBackToLogin = () => {
    setShowResetPassword(false);
    // Limpiar tokens de recuperación
    sessionStorage.removeItem('recovery_access_token');
    sessionStorage.removeItem('recovery_refresh_token');
    // Limpiar toda la URL hash, incluyendo tokens
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Si estamos en modo reset de contraseña, mostrar ese componente
  if (showResetPassword) {
    return <ResetPassword onBack={handleBackToLogin} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        onSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              department: formData.department,
              role: 'analyst' // Default role
            }
          }
        });

        if (error) throw error;
        
        setSuccessMessage('Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.');
        setIsLogin(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ha ocurrido un error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/#reset-password`
      });

      if (error) throw error;
      
      setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico. Puede tardar unos minutos en llegar.');
      setShowForgotPassword(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ha ocurrido un error al enviar el correo de recuperación';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SecureFlow</h1>
          <p className="text-blue-200">Sistema de Gestión de Incidentes</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showForgotPassword ? 'Recuperar Contraseña' : 
               (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </h2>
            <p className="text-gray-600">
              {showForgotPassword 
                ? 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña'
                : (isLogin 
                  ? 'Accede a tu cuenta para gestionar incidentes de seguridad'
                  : 'Crea una nueva cuenta para acceder al sistema'
                )
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">{successMessage}</span>
            </div>
          )}

          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
            {!showForgotPassword && !isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ej: Seguridad IT, Operaciones"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="tu@empresa.com"
                />
              </div>
            </div>

            {!showForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : (
                showForgotPassword ? 'Enviar Enlace de Recuperación' :
                (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {showForgotPassword ? (
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                  setFormData({ email: '', password: '', name: '', department: '' });
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isLogin 
                  ? '¿No tienes cuenta? Crear una nueva'
                  : '¿Ya tienes cuenta? Iniciar sesión'
                }
              </button>
            )}
          </div>

          {isLogin && !showForgotPassword && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-white text-sm font-medium mb-2">Credenciales de Demo:</p>
          <p className="text-blue-200 text-xs">Email: demo@empresa.com</p>
          <p className="text-blue-200 text-xs">Contraseña: demo123</p>
        </div>
      </div>
    </div>
  );
}