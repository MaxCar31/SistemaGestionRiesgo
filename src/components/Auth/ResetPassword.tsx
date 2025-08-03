import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordProps {
  onBack: () => void;
}

export default function ResetPassword({ onBack }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar si tenemos tokens de recuperación guardados
    const checkRecoveryTokens = async () => {
      try {
        const recoveryAccessToken = sessionStorage.getItem('recovery_access_token');
        
        if (recoveryAccessToken) {
          // Validar que el token tenga estructura correcta sin establecer sesión
          try {
            // Decodificar el JWT para verificar que es válido y no ha expirado
            const tokenParts = recoveryAccessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const now = Math.floor(Date.now() / 1000);
              
              if (payload.exp && payload.exp > now) {
                // Token válido y no expirado
              } else {
                setError('El enlace de recuperación ha expirado. Por favor, solicita un nuevo enlace.');
                setTimeout(() => onBack(), 3000);
                setSessionLoading(false);
                return;
              }
            } else {
              throw new Error('Formato de token inválido');
            }
          } catch {
            setError('El enlace de recuperación no es válido. Por favor, solicita un nuevo enlace.');
            setTimeout(() => onBack(), 3000);
            setSessionLoading(false);
            return;
          }
        } else {
          setError('No se encontró información de recuperación válida. Por favor, solicita un nuevo enlace.');
          setTimeout(() => onBack(), 3000);
        }
        
        setSessionLoading(false);
      } catch {
        setError('Error inesperado. Por favor, intenta nuevamente.');
        setSessionLoading(false);
      }
    };
    
    checkRecoveryTokens();
  }, [onBack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Obtener los tokens de recuperación guardados
      const recoveryAccessToken = sessionStorage.getItem('recovery_access_token');
      const recoveryRefreshToken = sessionStorage.getItem('recovery_refresh_token');
      
      if (!recoveryAccessToken) {
        throw new Error('No se encontraron tokens de recuperación válidos');
      }
      
      // Establecer sesión temporal con los tokens de recuperación
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryAccessToken,
        refresh_token: recoveryRefreshToken || ''
      });
      
      if (sessionError || !sessionData.session) {
        throw new Error('No se pudo establecer la sesión de recuperación');
      }
      
      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      // Limpiar los tokens de recuperación
      sessionStorage.removeItem('recovery_access_token');
      sessionStorage.removeItem('recovery_refresh_token');
      
      // Cerrar la sesión por seguridad (el usuario debe hacer login con la nueva contraseña)
      await supabase.auth.signOut();

      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        onBack();
      }, 3000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ha ocurrido un error al actualizar la contraseña';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SecureFlow</h1>
            <p className="text-blue-200">Sistema de Gestión de Incidentes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Contraseña Actualizada!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión en unos segundos.
            </p>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Ir al inicio de sesión ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SecureFlow</h1>
            <p className="text-blue-200">Sistema de Gestión de Incidentes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando enlace de recuperación...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu enlace de recuperación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SecureFlow</h1>
          <p className="text-blue-200">Sistema de Gestión de Incidentes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nueva Contraseña
            </h2>
            <p className="text-gray-600">
              Ingresa tu nueva contraseña para completar el proceso de recuperación
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>La contraseña debe tener al menos 6 caracteres.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
