import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import useSecurityQuestions from '../../hooks/useSecurityQuestions';
import { SecurityAnswerInput } from '../../types/security';

interface SecurityQuestionsSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isRequired?: boolean;
  title?: string;
}

export default function SecurityQuestionsSetup({ 
  onComplete, 
  onSkip, 
  isRequired = false,
  title = "Configurar Preguntas de Seguridad"
}: SecurityQuestionsSetupProps) {
  const { 
    questions, 
    loading, 
    error, 
    setupAnswers, 
    hasSetupQuestions 
  } = useSecurityQuestions();

  const [selectedAnswers, setSelectedAnswers] = useState<SecurityAnswerInput[]>([
    { question_id: 0, answer: '' },
    { question_id: 0, answer: '' },
    { question_id: 0, answer: '' }
  ]);
  
  const [showAnswers, setShowAnswers] = useState([false, false, false]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Si el usuario ya tiene preguntas configuradas, mostrar mensaje de completado
  useEffect(() => {
    if (hasSetupQuestions) {
      onComplete();
    }
  }, [hasSetupQuestions, onComplete]);

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Verificar que se seleccionaron 3 preguntas diferentes
    const selectedQuestionIds = selectedAnswers.map(a => a.question_id);
    const uniqueQuestionIds = new Set(selectedQuestionIds);

    if (selectedQuestionIds.includes(0)) {
      errors.push('Debes seleccionar 3 preguntas de seguridad');
    } else if (uniqueQuestionIds.size !== 3) {
      errors.push('Debes seleccionar 3 preguntas diferentes');
    }

    // Verificar que todas las respuestas tengan contenido
    selectedAnswers.forEach((answer, index) => {
      if (!answer.answer.trim()) {
        errors.push(`La respuesta ${index + 1} no puede estar vacía`);
      } else if (answer.answer.trim().length < 2) {
        errors.push(`La respuesta ${index + 1} debe tener al menos 2 caracteres`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Manejar cambio de pregunta seleccionada
  const handleQuestionChange = (index: number, questionId: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[index] = { question_id: questionId, answer: '' };
    setSelectedAnswers(newAnswers);
    setValidationErrors([]);
  };

  // Manejar cambio de respuesta
  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[index] = { ...newAnswers[index], answer };
    setSelectedAnswers(newAnswers);
    setValidationErrors([]);
  };

  // Alternar visibilidad de respuesta
  const toggleAnswerVisibility = (index: number) => {
    const newShowAnswers = [...showAnswers];
    newShowAnswers[index] = !newShowAnswers[index];
    setShowAnswers(newShowAnswers);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await setupAnswers(selectedAnswers);
      
      if (success) {
        onComplete();
      }
    } catch (err) {
      console.error('Error setting up security questions:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener preguntas disponibles para cada dropdown
  const getAvailableQuestions = (currentIndex: number) => {
    const selectedIds = selectedAnswers
      .map((a, i) => i !== currentIndex ? a.question_id : 0)
      .filter(id => id !== 0);
    
    return questions.filter((q: any) => !selectedIds.includes(q.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando preguntas de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-blue-200">
            Configura 3 preguntas de seguridad para proteger tu cuenta y permitir la recuperación de contraseña
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Info Card */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">¿Por qué son importantes?</h3>
                <p className="text-sm text-blue-700">
                  Las preguntas de seguridad te permitirán recuperar tu contraseña si la olvidas. 
                  Elige respuestas que solo tú conozcas y que no cambien con el tiempo.
                </p>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {(error || validationErrors.length > 0) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
                  {validationErrors.map((err, index) => (
                    <p key={index} className="text-sm text-red-700">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {selectedAnswers.map((selectedAnswer, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  Pregunta {index + 1}
                </h3>
                
                {/* Question Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una pregunta
                  </label>
                  <select
                    value={selectedAnswer.question_id}
                    onChange={(e) => handleQuestionChange(index, parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value={0}>Selecciona una pregunta...</option>
                    {getAvailableQuestions(index).map((question: any) => (
                      <option key={question.id} value={question.id}>
                        {question.question_text}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Answer Input */}
                {selectedAnswer.question_id !== 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tu respuesta
                    </label>
                    <div className="relative">
                      <input
                        type={showAnswers[index] ? 'text' : 'password'}
                        value={selectedAnswer.answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Escribe tu respuesta..."
                        required
                        minLength={2}
                      />
                      <button
                        type="button"
                        onClick={() => toggleAnswerVisibility(index)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showAnswers[index] ? 
                          <EyeOff className="w-5 h-5" /> : 
                          <Eye className="w-5 h-5" />
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Configurando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Configurar Preguntas</span>
                  </>
                )}
              </button>

              {!isRequired && onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Configurar más tarde
                </button>
              )}
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Consejos para respuestas seguras:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Usa respuestas que solo tú conozcas</li>
              <li>• Evita información que pueda encontrarse en redes sociales</li>
              <li>• Mantén consistencia en el formato (mayúsculas, espacios, etc.)</li>
              <li>• Elige respuestas que no cambien con el tiempo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
