import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SecurityQuestion, SecurityAnswerInput } from '../types/security';
import { useAuth } from './useAuth';

interface SetupState {
  loading: boolean;
  error: string | null;
  hasSetupQuestions: boolean;
}

export default function useSecurityQuestionsUsers() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [state, setState] = useState<SetupState>({
    loading: true,
    error: null,
    hasSetupQuestions: false
  });

  // Debug: Log del usuario actual
  useEffect(() => {
    console.log('🔍 Debug - Usuario actual:', user);
    console.log('🔍 Debug - User ID:', user?.id);
    console.log('🔍 Debug - User Email:', user?.email);
  }, [user]);

  const loadQuestions = useCallback(async () => {
    try {
      console.log('🔍 Debug - Cargando preguntas usando RPC del esquema public...');
      
      const { data, error } = await supabase.rpc('get_security_questions');

      if (error) {
        console.error('❌ Error cargando preguntas:', error);
        throw error;
      }

      console.log('✅ Preguntas cargadas:', data?.length);
      setQuestions(data || []);
    } catch (error: unknown) {
      console.error('Error loading questions:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar las preguntas de seguridad' 
      }));
    }
  }, []);

  const checkIfUserHasQuestions = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.rpc(
        'check_user_answers_exist',
        { p_user_id: user.id }
      );

      if (error) throw error;

      setState(prev => ({
        ...prev,
        loading: false,
        hasSetupQuestions: data === true
      }));
    } catch (error: unknown) {
      console.error('Error checking user questions:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al verificar las preguntas de seguridad'
      }));
    }
  }, [user]);

  // Cargar preguntas disponibles
  useEffect(() => {
    loadQuestions();
    if (user) {
      checkIfUserHasQuestions();
    }
  }, [user, loadQuestions, checkIfUserHasQuestions]);

  const setupAnswers = async (answers: SecurityAnswerInput[]): Promise<boolean> => {
    console.log('🔍 Debug - setupAnswers llamado con:', answers);
    
    if (!user) {
      console.error('❌ Usuario no autenticado');
      setState(prev => ({ ...prev, error: 'Usuario no autenticado' }));
      return false;
    }

    console.log('✅ Usuario autenticado:', user.id);

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Convertir array de respuestas al formato que espera la función RPC
      const answersArray = answers.map(answer => ({
        question_id: answer.question_id.toString(),
        answer_hash: answer.answer
      }));

      console.log('🔍 Debug - Array de respuestas para RPC:', answersArray);
      console.log('🔍 Debug - User ID para RPC:', user.id);

      // Usar la función RPC del esquema public que existe
      console.log('🔍 Debug - Llamando a save_user_security_answers...');
      
      const { data, error } = await supabase.rpc(
        'save_user_security_answers',
        {
          p_user_id: user.id,
          p_answers: answersArray
        }
      );

      console.log('🔍 Debug - Resultado RPC data:', data);
      console.log('🔍 Debug - Resultado RPC error:', error);

      if (error) {
        console.error('❌ Error RPC completo:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        throw new Error(`Error RPC: ${error.message} (${error.code})`);
      }

      // La función ahora retorna un objeto con información del resultado
      if (data && data.success === false) {
        console.error('❌ RPC retornó FALSE:', data);
        throw new Error(data.message || 'La función RPC falló al guardar');
      }

      if (!data || !data.success) {
        console.error('❌ RPC retornó resultado inesperado:', data);
        throw new Error('No se pudieron guardar las respuestas de seguridad');
      }

      console.log('✅ Respuestas de seguridad guardadas correctamente:', data);

      setState(prev => ({
        ...prev,
        loading: false,
        hasSetupQuestions: true
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error completo en setupAnswers:', {
        message: errorMessage,
        error: error
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage || 'Error al configurar las preguntas de seguridad'
      }));
      return false;
    }
  };

  return {
    questions,
    loading: state.loading,
    error: state.error,
    hasSetupQuestions: state.hasSetupQuestions,
    setupAnswers
  };
}
