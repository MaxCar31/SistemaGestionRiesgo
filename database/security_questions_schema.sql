-- Esquema para preguntas de seguridad
-- Este esquema se integra con Supabase Auth
-- Tabla de preguntas de seguridad predefinidas
CREATE TABLE IF NOT EXISTS public.security_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de respuestas de seguridad de los usuarios
CREATE TABLE IF NOT EXISTS public.user_security_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES public.security_questions(id) ON DELETE CASCADE,
    answer_hash TEXT NOT NULL,
    -- Respuesta hasheada por seguridad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Tabla para registro de intentos de recuperación
CREATE TABLE IF NOT EXISTS public.password_recovery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    recovery_token VARCHAR(255) UNIQUE,
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_security_answers_user_id ON public.user_security_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_password_recovery_attempts_user_id ON public.password_recovery_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_password_recovery_attempts_token ON public.password_recovery_attempts(recovery_token);

CREATE INDEX IF NOT EXISTS idx_password_recovery_attempts_expires ON public.password_recovery_attempts(expires_at);

-- Función para actualizar el campo updated_at automáticamente
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_security_questions_updated_at BEFORE
UPDATE
    ON public.security_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_answers_updated_at BEFORE
UPDATE
    ON public.user_security_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_recovery_attempts_updated_at BEFORE
UPDATE
    ON public.password_recovery_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar preguntas de seguridad predefinidas
INSERT INTO
    public.security_questions (question_text, category)
VALUES
    -- Preguntas sobre la infancia
    (
        '¿Cuál era el nombre de tu primera mascota?',
        'infancia'
    ),
    ('¿En qué ciudad naciste?', 'infancia'),
    (
        '¿Cuál era el nombre de tu escuela primaria?',
        'infancia'
    ),
    ('¿Cuál era tu apodo en la infancia?', 'infancia'),
    (
        '¿Cuál era tu juguete favorito cuando eras niño?',
        'infancia'
    ),
    -- Preguntas sobre familia
    (
        '¿Cuál es el nombre de soltera de tu madre?',
        'familia'
    ),
    (
        '¿Cuál es el segundo nombre de tu padre?',
        'familia'
    ),
    (
        '¿Cuál es el nombre de tu hermano/a mayor?',
        'familia'
    ),
    (
        '¿En qué ciudad se conocieron tus padres?',
        'familia'
    ),
    -- Preguntas sobre gustos personales
    ('¿Cuál es tu comida favorita?', 'personal'),
    (
        '¿Cuál es el nombre de tu libro favorito?',
        'personal'
    ),
    ('¿Cuál es tu película favorita?', 'personal'),
    (
        '¿Cuál es el nombre de tu artista musical favorito?',
        'personal'
    ),
    ('¿Cuál es tu color favorito?', 'personal'),
    -- Preguntas sobre lugares
    (
        '¿Cuál fue tu primer destino de vacaciones?',
        'lugares'
    ),
    (
        '¿En qué calle vivías cuando tenías 10 años?',
        'lugares'
    ),
    (
        '¿Cuál es el nombre de la ciudad donde te casaste?',
        'lugares'
    ),
    (
        '¿Cuál es tu lugar favorito para visitar?',
        'lugares'
    ),
    -- Preguntas sobre trabajo/estudio
    ('¿Cuál fue tu primer trabajo?', 'trabajo'),
    (
        '¿Cuál era el nombre de tu universidad?',
        'trabajo'
    ),
    (
        '¿Cuál fue tu materia favorita en la escuela?',
        'trabajo'
    ),
    (
        '¿Cuál es el nombre de tu primer jefe?',
        'trabajo'
    ),
    -- Preguntas sobre objetos/vehículos
    (
        '¿Cuál fue la marca de tu primer automóvil?',
        'objetos'
    ),
    (
        '¿Cuál es el número de tu casa de la infancia?',
        'objetos'
    ),
    (
        '¿Cuál era el modelo de tu primer teléfono móvil?',
        'objetos'
    ) ON CONFLICT (question_text) DO NOTHING;

-- Políticas de seguridad para RLS (Row Level Security)
ALTER TABLE
    public.security_questions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.user_security_answers ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.password_recovery_attempts ENABLE ROW LEVEL SECURITY;

-- Política para preguntas de seguridad (solo lectura para todos los usuarios autenticados)
CREATE POLICY "security_questions_read" ON public.security_questions FOR
SELECT
    USING (is_active = true);

-- Política para respuestas de seguridad (solo el propietario puede ver sus respuestas)
CREATE POLICY "user_security_answers_own" ON public.user_security_answers FOR ALL USING (auth.uid() = user_id);

-- Política para intentos de recuperación (solo el propietario puede ver sus intentos)
CREATE POLICY "password_recovery_attempts_own" ON public.password_recovery_attempts FOR ALL USING (auth.uid() = user_id);

-- Función para limpiar intentos de recuperación expirados
CREATE
OR REPLACE FUNCTION cleanup_expired_recovery_attempts() RETURNS void AS $ $ BEGIN
DELETE FROM
    public.password_recovery_attempts
WHERE
    expires_at < NOW() - INTERVAL '1 day';

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede intentar recuperar contraseña
CREATE
OR REPLACE FUNCTION can_attempt_password_recovery(user_email TEXT) RETURNS BOOLEAN AS $ $ DECLARE recent_attempts INTEGER;

BEGIN
SELECT
    COUNT(*) INTO recent_attempts
FROM
    public.password_recovery_attempts pra
    JOIN auth.users u ON pra.user_id = u.id
WHERE
    u.email = user_email
    AND pra.created_at > NOW() - INTERVAL '1 hour'
    AND pra.attempts_count >= pra.max_attempts;

RETURN recent_attempts = 0;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para hashear respuestas de seguridad (simple hash usando MD5 para demo)
-- En producción, usar bcrypt o similar
CREATE
OR REPLACE FUNCTION hash_security_answer(answer TEXT) RETURNS TEXT AS $ $ BEGIN -- Normalizar la respuesta (minúsculas, sin espacios extra)
RETURN MD5(LOWER(TRIM(answer)));

END;

$ $ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE public.security_questions IS 'Preguntas de seguridad predefinidas para recuperación de contraseña';

COMMENT ON TABLE public.user_security_answers IS 'Respuestas de seguridad de los usuarios (hasheadas)';

COMMENT ON TABLE public.password_recovery_attempts IS 'Registro de intentos de recuperación de contraseña';

COMMENT ON FUNCTION hash_security_answer IS 'Función para hashear respuestas de seguridad de forma consistente';

COMMENT ON FUNCTION can_attempt_password_recovery IS 'Verifica si un usuario puede intentar recuperar su contraseña';

COMMENT ON FUNCTION cleanup_expired_recovery_attempts IS 'Limpia intentos de recuperación expirados';