import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle
} from 'lucide-react';
import { usePasswordRecovery } from '../../hooks/usePasswordRecovery';

interface PasswordRecoveryProps {
  onBackToLogin: () => void;
}

export default function PasswordRecovery({ onBackToLogin }: PasswordRecoveryProps) {
  const { recoveryState, initRecovery, verifyAnswers, changePassword, resetRecovery } = usePasswordRecovery();
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [newPassword, setNewPassword] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    await initRecovery(email);
  };

  const handleAnswersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allAnswered = recoveryState.securityQuestions.every(q => answers[q.id]?.trim());
    if (!allAnswered) return;
    
    await verifyAnswers(answers);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    
    await changePassword(newPassword);
  };

  const handleBack = () => {
    if (recoveryState.currentStep === 'email') {
      onBackToLogin();
    } else {
      resetRecovery();
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {recoveryState.currentStep === 'success' ? '¡Contraseña Actualizada!' : 'Recuperar Contraseña'}
          </h1>
          <p className="text-gray-600">
            {recoveryState.currentStep === 'email' && 'Ingresa tu correo para iniciar la recuperación'}
            {recoveryState.currentStep === 'questions' && 'Responde las preguntas de seguridad'}
            {recoveryState.currentStep === 'newPassword' && 'Crea una nueva contraseña segura'}
            {recoveryState.currentStep === 'success' && 'Tu contraseña ha sido actualizada exitosamente'}
          </p>
        </div>

        {/* Error Message */}
        {recoveryState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{recoveryState.error}</span>
          </div>
        )}

        {/* Step 1: Email Input */}
        {recoveryState.currentStep === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                  disabled={recoveryState.loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recoveryState.loading || !email.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recoveryState.loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {/* Step 2: Security Questions */}
        {recoveryState.currentStep === 'questions' && (
          <form onSubmit={handleAnswersSubmit} className="space-y-6">
            <div className="space-y-4">
              {recoveryState.securityQuestions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question_text}
                  </label>
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu respuesta..."
                    required
                    disabled={recoveryState.loading}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={recoveryState.loading || !recoveryState.securityQuestions.every(q => answers[q.id]?.trim())}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recoveryState.loading ? 'Verificando...' : 'Verificar Respuestas'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {recoveryState.currentStep === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={recoveryState.loading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>

            <button
              type="submit"
              disabled={recoveryState.loading || newPassword.length < 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recoveryState.loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {recoveryState.currentStep === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        )}

        {/* Back Button */}
        {recoveryState.currentStep !== 'success' && (
          <button
            onClick={handleBack}
            className="mt-6 w-full flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={recoveryState.loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {recoveryState.currentStep === 'email' ? 'Volver al inicio de sesión' : 'Volver'}
          </button>
        )}
      </div>
    </div>
  );
}
