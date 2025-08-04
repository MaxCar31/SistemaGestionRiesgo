// Tipos para el sistema de preguntas de seguridad y recuperación de contraseña

export interface SecurityQuestion {
  id: number;
  question_text: string;
  category: 'infancia' | 'familia' | 'personal' | 'lugares' | 'trabajo' | 'objetos' | 'general';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSecurityAnswer {
  id: string;
  user_id: string;
  question_id: number;
  answer_hash: string;
  created_at: string;
  updated_at: string;
  security_questions?: SecurityQuestion; // Relación con la pregunta
}

export interface SecurityAnswerInput {
  question_id: number;
  answer: string;
}

export interface SecurityAnswerSetup {
  answers: SecurityAnswerInput[];
}

export interface PasswordRecoveryAttempt {
  id: string;
  user_id: string;
  email: string;
  recovery_token: string | null;
  attempts_count: number;
  max_attempts: number;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordRecoveryVerification {
  email: string;
  recovery_token: string;
  answers: SecurityAnswerInput[];
}

export interface PasswordRecoveryReset {
  recovery_token: string;
  new_password: string;
}

// Estados del proceso de recuperación
export type RecoveryStep = 
  | 'email_input'      // Ingreso del email
  | 'questions'        // Respuesta a preguntas de seguridad
  | 'new_password'     // Ingreso de nueva contraseña
  | 'success'          // Proceso completado
  | 'error';           // Error en el proceso

export interface RecoveryState {
  step: RecoveryStep;
  email: string;
  recovery_token: string | null;
  questions: SecurityQuestion[];
  error: string | null;
  loading: boolean;
}

// Respuestas de la API
export interface SecurityQuestionsResponse {
  success: boolean;
  data: SecurityQuestion[];
  error?: string;
}

export interface UserSecurityAnswersResponse {
  success: boolean;
  data: UserSecurityAnswer[];
  error?: string;
}

export interface RecoveryInitResponse {
  success: boolean;
  data: {
    recovery_token: string;
    questions: SecurityQuestion[];
    expires_at: string;
  };
  error?: string;
}

export interface RecoveryVerifyResponse {
  success: boolean;
  data: {
    can_reset: boolean;
    message: string;
  };
  error?: string;
}

export interface RecoveryResetResponse {
  success: boolean;
  data: {
    message: string;
  };
  error?: string;
}

// Configuración de seguridad
export interface SecurityConfig {
  MIN_QUESTIONS_REQUIRED: number;
  MAX_RECOVERY_ATTEMPTS: number;
  RECOVERY_TOKEN_EXPIRY_HOURS: number;
  RATE_LIMIT_WINDOW_MINUTES: number;
}

// Constantes de configuración por defecto
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  MIN_QUESTIONS_REQUIRED: 3,
  MAX_RECOVERY_ATTEMPTS: 3,
  RECOVERY_TOKEN_EXPIRY_HOURS: 24,
  RATE_LIMIT_WINDOW_MINUTES: 60,
};

// Errores específicos del sistema de seguridad
export enum SecurityErrorCode {
  INSUFFICIENT_QUESTIONS = 'INSUFFICIENT_QUESTIONS',
  INVALID_ANSWERS = 'INVALID_ANSWERS',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  QUESTIONS_NOT_SETUP = 'QUESTIONS_NOT_SETUP',
}

export interface SecurityError {
  code: SecurityErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// Utilidades para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Tipos para hooks
export interface UseSecurityQuestionsReturn {
  questions: SecurityQuestion[];
  userAnswers: UserSecurityAnswer[];
  loading: boolean;
  error: string | null;
  setupAnswers: (answers: SecurityAnswerInput[]) => Promise<boolean>;
  updateAnswers: (answers: SecurityAnswerInput[]) => Promise<boolean>;
  verifyAnswers: (answers: SecurityAnswerInput[]) => Promise<boolean>;
  hasSetupQuestions: boolean;
  refreshQuestions: () => Promise<void>;
}

export interface UsePasswordRecoveryReturn {
  state: RecoveryState;
  initRecovery: (email: string) => Promise<boolean>;
  verifyAnswers: (answers: SecurityAnswerInput[]) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<boolean>;
  resetState: () => void;
}