import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SecurityQuestion, SecurityAnswerInput } from '../types/security';
import { useAuth } from './useAuth';

interface SetupState {
  loading: boolean;
  error: string | null;
  hasSetupQuestions: boolean;
}

export default function useSecurityQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [state, setState] = useState<SetupState>({
    loading: true,
    error: null,
    hasSetupQuestions: false
  });

  // Cargar preguntas disponibles
  useEffect(() => {
    loadQuestions();
    if (user) {
      checkIfUserHasQuestions();
    }
  }, [user]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('security_questions')
        .select('*')
        .order('id');

      if (error) throw error;
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
    if (!user) {
      setState(prev => ({ ...prev, error: 'Usuario no autenticado' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Eliminar respuestas existentes
      await supabase
        .from('user_security_answers')
        .delete()
        .eq('user_id', user.id);

      // Insertar nuevas respuestas
      const answersToInsert = answers.map(answer => ({
        user_id: user.id,
        question_id: answer.question_id,
        answer_hash: answer.answer.toLowerCase().trim() // En producción usar hash
      }));

      const { error: insertError } = await supabase
        .from('user_security_answers')
        .insert(answersToInsert);

      if (insertError) throw insertError;

      setState(prev => ({
        ...prev,
        loading: false,
        hasSetupQuestions: true
      }));

      return true;
    } catch (error: any) {
      console.error('Error setting up answers:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al configurar las preguntas de seguridad'
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
