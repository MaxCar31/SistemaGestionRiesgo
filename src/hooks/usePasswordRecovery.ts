import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SecurityQuestion } from '../types/security';

// Estados del proceso de recuperación
interface RecoveryState {
  loading: boolean;
  error: string | null;
  currentStep: 'email' | 'questions' | 'newPassword' | 'success';
  email: string;
  securityQuestions: SecurityQuestion[];
  isVerified: boolean;
  userData: {
    userId: string;
    userEmail: string;
  } | null;
  verifiedAnswers?: Record<number, string>;
}

// Hook simplificado para recuperación de contraseña
export function usePasswordRecovery() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    loading: false,
    error: null,
    currentStep: 'email',
    email: '',
    securityQuestions: [],
    isVerified: false,
    userData: null
  });

  // Iniciar proceso de recuperación
  const initRecovery = useCallback(async (email: string): Promise<boolean> => {
    try {
      setRecoveryState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        email 
      }));

      // 1. Para esta demo, buscaremos directamente en user_security_answers
      // ya que auth.users no es accesible desde el cliente
      // En producción, esto debería hacerse desde el backend
      
      // Buscar si existe un usuario con respuestas de seguridad para este email
      // (usaremos el sistema de auth para validar el email)
      // const { data: existingUser } = await supabase.auth.signInWithPassword({
      //   email: email.toLowerCase().trim(),
      //   password: 'invalid_password_for_check'
      // });

      // Si el email no existe, Supabase devuelve un error específico
      // Si existe pero la contraseña es incorrecta, devuelve otro error
      // Verificaremos las respuestas de seguridad basándonos en el usuario actual o demo

      // Usar la función RPC para obtener preguntas de seguridad por email
      const { data: userQuestionsData, error: questionsError } = await supabase
        .rpc('get_user_security_questions_by_email', {
          user_email: email.toLowerCase().trim()
        });

      if (questionsError || !userQuestionsData) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'No se encontró una cuenta con ese email o no tiene preguntas de seguridad configuradas.'
        }));
        return false;
      }

      // La función RPC retorna JSON, parsearlo si es necesario
      const userQuestions = Array.isArray(userQuestionsData) ? userQuestionsData : JSON.parse(userQuestionsData || '[]');

      if (!userQuestions || userQuestions.length === 0) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'Esta cuenta no tiene preguntas de seguridad configuradas.'
        }));
        return false;
      }

      // Convertir a formato SecurityQuestion
      const questions: SecurityQuestion[] = userQuestions.map((q: {
        question_id: number;
        question_text: string;
        category: string;
      }) => ({
        id: q.question_id,
        question_text: q.question_text,
        category: q.category,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        email: email.toLowerCase().trim(),
        securityQuestions: questions,
        currentStep: 'questions',
        userData: {
          userId: '', // Se llenará después si es necesario
          userEmail: email.toLowerCase().trim()
        }
      }));

      return true;

    } catch (error: unknown) {
      console.error('Error initiating password recovery:', error);
      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al iniciar recuperación'
      }));
      return false;
    }
  }, []);

  // Verificar respuestas de seguridad
  const verifyAnswers = useCallback(async (answers: Record<number, string>): Promise<boolean> => {
    try {
      setRecoveryState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }));

      if (!recoveryState.email) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'No se encontró el email del usuario. Reinicia el proceso.'
        }));
        return false;
      }

      // Usar la función RPC para verificar las respuestas
      const { data: verificationResult, error: verificationError } = await supabase
        .rpc('verify_security_answers_by_email', {
          user_email: recoveryState.email.toLowerCase().trim(),
          provided_answers: answers
        });

      if (verificationError || !verificationResult) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'Una o más respuestas son incorrectas. Verifica tus respuestas e inténtalo de nuevo.'
        }));
        return false;
      }

      // Marcar como verificado y continuar al paso de nueva contraseña
      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        currentStep: 'newPassword',
        isVerified: true,
        verifiedAnswers: answers
      }));

      return true;

    } catch (error: unknown) {
      console.error('Error verifying answers:', error);
      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al verificar respuestas'
      }));
      return false;
    }
  }, [recoveryState.email]);

  // Cambiar contraseña
  const changePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    try {
      setRecoveryState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }));

      if (!recoveryState.email || !recoveryState.verifiedAnswers) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'No se puede cambiar la contraseña. Reinicia el proceso de recuperación.'
        }));
        return false;
      }

      // Usar la función RPC para cambiar la contraseña
      const { data: passwordResult, error: passwordError } = await supabase
        .rpc('change_password_with_verification', {
          user_email: recoveryState.email.toLowerCase().trim(),
          new_password: newPassword,
          verified_answers: recoveryState.verifiedAnswers
        });

      if (passwordError || !passwordResult) {
        setRecoveryState(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cambiar la contraseña. Por favor, inténtalo de nuevo.'
        }));
        return false;
      }

      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        currentStep: 'success'
      }));

      return true;

    } catch (error: unknown) {
      console.error('Error changing password:', error);
      setRecoveryState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cambiar contraseña'
      }));
      return false;
    }
  }, [recoveryState.email, recoveryState.verifiedAnswers]);

  // Resetear estado
  const resetRecovery = useCallback(() => {
    setRecoveryState({
      loading: false,
      error: null,
      currentStep: 'email',
      email: '',
      securityQuestions: [],
      isVerified: false,
      userData: null,
      verifiedAnswers: undefined
    });
  }, []);

  return {
    recoveryState,
    initRecovery,
    verifyAnswers,
    changePassword,
    resetRecovery
  };
}
