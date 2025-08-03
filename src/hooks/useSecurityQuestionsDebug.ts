import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SecurityQuestion, SecurityAnswerInput } from '../types/security';
import { useAuth } from './useAuth';

interface SetupState {
  loading: boolean;
  error: string | null;
  hasSetupQuestions: boolean;
}

export default function useSecurityQuestionsDebug() {
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

  // Cargar preguntas disponibles
  useEffect(() => {
    loadQuestions();
    if (user) {
      checkIfUserHasQuestions();
    }
  }, [user]);

  const loadQuestions = async () => {
    try {
      console.log('🔍 Debug - Cargando preguntas...');
      
      const { data, error } = await supabase
        .from('security_questions')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) {
        console.error('❌ Error cargando preguntas:', error);
        throw error;
      }

      console.log('✅ Preguntas cargadas:', data?.length);
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar las preguntas de seguridad' 
      }));
    }
  };

  const checkIfUserHasQuestions = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase
        .from('user_security_answers')
        .select('question_id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        loading: false,
        hasSetupQuestions: (data && data.length > 0)
      }));
    } catch (error: any) {
      console.error('Error checking user questions:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al verificar las preguntas de seguridad'
      }));
    }
  };

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

      // Convertir array de respuestas a objeto JSON para la función RPC
      const answersObject: Record<string, string> = {};
      answers.forEach(answer => {
        answersObject[answer.question_id.toString()] = answer.answer;
      });

      console.log('🔍 Debug - Objeto de respuestas para RPC:', answersObject);
      console.log('🔍 Debug - User ID para RPC:', user.id);

      // 🔥 USAR LA FUNCIÓN RPC QUE HASHEA AUTOMÁTICAMENTE
      console.log('🔍 Debug - Llamando a save_user_security_answers_hashed...');
      
      const { data, error } = await supabase.rpc(
        'save_user_security_answers_hashed',
        {
          p_user_id: user.id,
          p_answers: answersObject
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

      if (data === false) {
        console.error('❌ RPC retornó FALSE - revisar logs de Supabase');
        throw new Error('La función RPC falló al guardar. Revisar logs en Supabase Dashboard.');
      }

      if (!data) {
        console.error('❌ RPC retornó null/undefined:', data);
        throw new Error('No se pudieron guardar las respuestas de seguridad - respuesta vacía');
      }

      console.log('✅ Respuestas de seguridad guardadas y hasheadas correctamente');

      setState(prev => ({
        ...prev,
        loading: false,
        hasSetupQuestions: true
      }));

      return true;
    } catch (error: any) {
      console.error('❌ Error completo en setupAnswers:', {
        message: error.message,
        stack: error.stack,
        supabaseError: error
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al configurar las preguntas de seguridad'
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
