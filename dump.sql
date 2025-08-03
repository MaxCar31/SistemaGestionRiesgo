

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "incidents";


ALTER SCHEMA "incidents" OWNER TO "postgres";


COMMENT ON SCHEMA "incidents" IS 'Schema dedicated to incident management tables';



CREATE SCHEMA IF NOT EXISTS "logs";


ALTER SCHEMA "logs" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "users";


ALTER SCHEMA "users" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "incidents"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "incidents"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_password_simple_debug"("user_email" "text", "new_password" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_uuid uuid;
    update_result integer;
BEGIN
    -- Buscar el UUID del usuario por email
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email
    AND email_confirmed_at IS NOT NULL;
    
    -- Si no se encuentra el usuario, retornar mensaje
    IF user_uuid IS NULL THEN
        RETURN 'ERROR: Usuario no encontrado';
    END IF;
    
    -- Intentar cambiar la contraseña
    UPDATE auth.users
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Verificar cuántas filas se actualizaron
    GET DIAGNOSTICS update_result = ROW_COUNT;
    
    IF update_result = 0 THEN
        RETURN 'ERROR: No se pudo actualizar la contraseña';
    END IF;
    
    RETURN 'SUCCESS: Contraseña actualizada correctamente para usuario ' || user_uuid::text;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."change_password_simple_debug"("user_email" "text", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_uuid uuid;
    verification_result boolean;
BEGIN
    -- Buscar el UUID del usuario por email
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email
    AND email_confirmed_at IS NOT NULL;
    
    -- Si no se encuentra el usuario, retornar false
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar nuevamente las respuestas antes de cambiar la contraseña
    SELECT public.verify_security_answers_by_email(user_email, verified_answers)
    INTO verification_result;
    
    -- Si la verificación falla, retornar false
    IF NOT verification_result THEN
        RETURN false;
    END IF;
    
    -- Cambiar la contraseña en auth.users
    UPDATE auth.users
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- No registrar en password_recovery_attempts por ahora para evitar errores
    -- El cambio de contraseña ya funcionó
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") IS 'Cambia la contraseña de un usuario después de verificar las respuestas de seguridad';



CREATE OR REPLACE FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    answer_count integer;
BEGIN
    SELECT COUNT(*) INTO answer_count
    FROM users.user_security_answers
    WHERE user_id = p_user_id;
    
    RETURN (answer_count > 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") IS 'Verifica si un usuario tiene respuestas de seguridad configuradas';



CREATE OR REPLACE FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE 
    answer_count integer;
BEGIN 
    -- Contar cuántas respuestas tiene el usuario en el esquema users
    SELECT COUNT(*) INTO answer_count
    FROM users.user_security_answers
    WHERE user_id = p_user_id;
    
    -- Retornar true si tiene al menos una respuesta configurada
    RETURN (answer_count > 0);
    
EXCEPTION
    WHEN OTHERS THEN 
        -- En caso de error, asumir que no tiene respuestas
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") IS 'Función RPC accesible desde el cliente para verificar si un usuario tiene preguntas de seguridad configuradas. Consulta la tabla users.user_security_answers.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_recovery_attempts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.password_recovery_attempts 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_recovery_attempts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_recovery_attempts"() IS 'Limpia intentos de recuperación expirados';



CREATE OR REPLACE FUNCTION "public"."get_security_questions"() RETURNS TABLE("id" integer, "question_text" "text", "is_active" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sq.id,
        sq.question_text,
        sq.is_active,
        sq.created_at
    FROM users.security_questions sq
    WHERE sq.is_active = true
    ORDER BY sq.id;
END;
$$;


ALTER FUNCTION "public"."get_security_questions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_security_questions"() IS 'Obtiene todas las preguntas de seguridad activas desde el esquema users';



CREATE OR REPLACE FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") RETURNS TABLE("question_id" integer, "question_text" "text", "category" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Buscar el UUID del usuario por email en auth.users
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email
    AND email_confirmed_at IS NOT NULL;
    
    -- Si no se encuentra el usuario, retornar vacío
    IF user_uuid IS NULL THEN
        RETURN;
    END IF;
    
    -- Retornar las preguntas de seguridad del usuario
    RETURN QUERY
    SELECT 
        sq.id as question_id,
        sq.question_text,
        sq.category
    FROM users.user_security_answers usa
    JOIN users.security_questions sq ON usa.question_id = sq.id
    WHERE usa.user_id = user_uuid
    ORDER BY sq.id;
END;
$$;


ALTER FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") IS 'Obtiene las preguntas de seguridad de un usuario por su email para recuperación de contraseña';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Obtener el ID del rol administrador
  SELECT id INTO admin_role_id FROM users.roles WHERE name = 'administrador' LIMIT 1;
  
  -- Crear el perfil del usuario (inicialmente vacío, se llenará desde la aplicación)
  INSERT INTO users.usuarios (id, nombre, departamento)
  VALUES (new.id, '', '');
  
  -- Asignar rol de administrador al usuario
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO users.user_roles (user_id, role_id)
    VALUES (new.id, admin_role_id);
  END IF;
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    answer_item jsonb;
    result_count integer := 0;
    hashed_answer text;
BEGIN
    -- Eliminar respuestas anteriores si existen
    DELETE FROM users.user_security_answers WHERE user_id = p_user_id;
    
    -- Insertar nuevas respuestas con hashing automático
    FOR answer_item IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        -- Hash la respuesta usando pgsodium (si está disponible) o digest
        BEGIN
            -- Intentar usar pgsodium primero
            SELECT pgsodium.crypto_pwhash(
                answer_item->>'answer_hash',
                pgsodium.crypto_pwhash_saltgen()
            ) INTO hashed_answer;
        EXCEPTION
            WHEN OTHERS THEN
                -- Si pgsodium no está disponible, usar digest simple
                SELECT encode(digest(answer_item->>'answer_hash', 'sha256'), 'hex') INTO hashed_answer;
        END;
        
        INSERT INTO users.user_security_answers (
            user_id,
            question_id,
            answer_hash
        ) VALUES (
            p_user_id,
            (answer_item->>'question_id')::integer,
            hashed_answer
        );
        
        result_count := result_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'answers_saved', result_count,
        'message', 'Respuestas de seguridad guardadas exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Error al guardar las respuestas de seguridad'
        );
END;
$$;


ALTER FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") IS 'Guarda las respuestas de seguridad de un usuario en el esquema users';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profile"("user_id" "uuid", "user_name" "text", "user_department" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE users.usuarios 
  SET 
    nombre = user_name,
    departamento = user_department
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."update_user_profile"("user_id" "uuid", "user_name" "text", "user_department" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_argon2_hash"("stored_hash" "text", "provided_answer" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Verificar usando pgsodium con la sintaxis correcta
    RETURN pgsodium.crypto_pwhash_str_verify(
        stored_hash,
        LOWER(TRIM(provided_answer))
    );
END;
$$;


ALTER FUNCTION "public"."verify_argon2_hash"("stored_hash" "text", "provided_answer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    normalized_answer TEXT;
BEGIN
    normalized_answer := LOWER(TRIM(provided_answer));
    
    -- Si el hash parece ser de pgsodium (hexadecimal largo)
    IF LENGTH(stored_hash) = 64 AND stored_hash ~ '^[a-f0-9]+$' THEN
        BEGIN
            RETURN stored_hash = encode(
                pgsodium.crypto_generichash(normalized_answer::bytea), 
                'hex'
            );
        EXCEPTION WHEN others THEN
            RETURN FALSE;
        END;
    END IF;
    
    -- Si el hash parece ser bcrypt (empieza con $2)
    IF stored_hash LIKE '$2%' THEN
        BEGIN
            RETURN stored_hash = crypt(normalized_answer, stored_hash);
        EXCEPTION WHEN others THEN
            RETURN FALSE;
        END;
    END IF;
    
    -- Si es MD5 legacy (32 caracteres hexadecimales)
    IF LENGTH(stored_hash) = 32 AND stored_hash ~ '^[a-f0-9]+$' THEN
        RETURN stored_hash = MD5(normalized_answer);
    END IF;
    
    -- Comparación directa como último recurso
    RETURN stored_hash = normalized_answer;
END;
$_$;


ALTER FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") IS 'Verifica respuestas hasheadas con compatibilidad hacia atrás';



CREATE OR REPLACE FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_uuid uuid;
    stored_answer text;
    provided_answer text;
    question_key text;
    correct_answers integer := 0;
    total_answers integer := 0;
BEGIN
    -- Buscar el UUID del usuario por email
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email
    AND email_confirmed_at IS NOT NULL;
    
    -- Si no se encuentra el usuario, retornar false
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar cada respuesta proporcionada
    FOR question_key IN SELECT * FROM jsonb_object_keys(provided_answers)
    LOOP
        -- Obtener la respuesta proporcionada
        provided_answer := provided_answers ->> question_key;
        
        -- Obtener la respuesta almacenada (hasheada)
        SELECT answer_hash INTO stored_answer
        FROM users.user_security_answers
        WHERE user_id = user_uuid
        AND question_id = question_key::integer;
        
        -- Si encontramos la respuesta almacenada
        IF stored_answer IS NOT NULL THEN
            total_answers := total_answers + 1;
            
            -- Comparar con hash SHA256 (como se guardó)
            IF stored_answer = encode(digest(provided_answer, 'sha256'), 'hex') THEN
                correct_answers := correct_answers + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Retornar true si todas las respuestas son correctas
    RETURN (total_answers > 0 AND correct_answers = total_answers);
END;
$$;


ALTER FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") IS 'Verifica las respuestas de seguridad de un usuario por email para recuperación de contraseña';



CREATE OR REPLACE FUNCTION "users"."can_attempt_password_recovery"("user_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record record;
  recent_attempts integer;
BEGIN
  -- Buscar usuario por email
  SELECT id INTO user_record
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Contar intentos recientes (últimas 24 horas)
  SELECT COUNT(*)
  INTO recent_attempts
  FROM users.password_recovery_attempts
  WHERE user_id = user_record.id
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Permitir si tiene menos de 3 intentos en 24 horas
  RETURN (recent_attempts < 3);
END;
$$;


ALTER FUNCTION "users"."can_attempt_password_recovery"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."change_password_with_verification"("user_email" "text", "security_answers" "jsonb", "new_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN users.change_password_with_verification_argon2(user_email, security_answers, new_password);
END;
$$;


ALTER FUNCTION "users"."change_password_with_verification"("user_email" "text", "security_answers" "jsonb", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."change_password_with_verification_argon2"("user_email" "text", "security_answers" "jsonb", "new_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record record;
    answers_valid boolean;
BEGIN
    SELECT id, email INTO user_record
    FROM auth.users
    WHERE email = LOWER(TRIM(user_email));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    SELECT users.verify_security_answers_by_email_argon2(user_email, security_answers)
    INTO answers_valid;

    IF NOT answers_valid THEN
        RAISE EXCEPTION 'Las respuestas de seguridad no son correctas';
    END IF;

    -- En producción, se debe realizar una llamada externa para cambiar la contraseña
    -- Aquí se simula el éxito
    RETURN true;
EXCEPTION
    WHEN others THEN RAISE EXCEPTION 'Error al cambiar contraseña: %', SQLERRM;
END;
$$;


ALTER FUNCTION "users"."change_password_with_verification_argon2"("user_email" "text", "security_answers" "jsonb", "new_password" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."change_password_with_verification_argon2"("user_email" "text", "security_answers" "jsonb", "new_password" "text") IS 'Cambia contraseña después de verificar respuestas con Argon2id';



CREATE OR REPLACE FUNCTION "users"."check_user_answers_exist"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users.user_security_answers
        WHERE user_id = p_user_id
        LIMIT 1
    );
END;
$$;


ALTER FUNCTION "users"."check_user_answers_exist"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."check_user_answers_exist"("p_user_id" "uuid") IS 'Verifica si un usuario tiene respuestas de seguridad configuradas en el esquema users';



CREATE OR REPLACE FUNCTION "users"."check_user_has_security_answers"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users.user_security_answers
        WHERE user_id = p_user_id
        LIMIT 1
    );
END;
$$;


ALTER FUNCTION "users"."check_user_has_security_answers"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."check_user_has_security_answers"("p_user_id" "uuid") IS 'Verifica si un usuario tiene respuestas de seguridad configuradas (para App.tsx) en el esquema users';



CREATE OR REPLACE FUNCTION "users"."current_user_has_role"("role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users.user_roles ur
        JOIN users.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = role_name
    );
END;
$$;


ALTER FUNCTION "users"."current_user_has_role"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."current_user_is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN users.current_user_has_role('admin');
END;
$$;


ALTER FUNCTION "users"."current_user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."debug_save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
  success boolean;
BEGIN
  -- Llamar a la función principal
  SELECT users.save_user_security_answers_hashed(p_user_id, p_answers) INTO success;
  
  -- Retornar resultado con debug info
  result = jsonb_build_object(
    'success', success,
    'user_id', p_user_id,
    'answers_count', jsonb_object_keys(p_answers),
    'timestamp', NOW()
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', p_user_id,
      'timestamp', NOW()
    );
END;
$$;


ALTER FUNCTION "users"."debug_save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."get_security_questions"() RETURNS TABLE("id" integer, "question_text" "text", "category" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        sq.id,
        sq.question_text,
        sq.category
    FROM
        users.security_questions sq
    WHERE
        sq.is_active = true
    ORDER BY
        sq.id;
END;
$$;


ALTER FUNCTION "users"."get_security_questions"() OWNER TO "postgres";


COMMENT ON FUNCTION "users"."get_security_questions"() IS 'Obtiene todas las preguntas de seguridad activas del esquema users';



CREATE OR REPLACE FUNCTION "users"."get_user_permissions"("user_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB := '{}';
    role_perms JSONB;
BEGIN
    -- Obtener todos los permisos de los roles del usuario
    FOR role_perms IN 
        SELECT r.permissions 
        FROM users.user_roles ur
        JOIN users.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
    LOOP
        result := result || role_perms;
    END LOOP;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "users"."get_user_permissions"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."get_user_security_questions_by_email"("user_email" "text") RETURNS TABLE("question_id" integer, "question_text" "text", "category" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    sq.id as question_id,
    sq.question_text,
    sq.category
  FROM users.security_questions sq
  INNER JOIN users.user_security_answers usa ON sq.id = usa.question_id
  INNER JOIN auth.users au ON usa.user_id = au.id
  WHERE au.email = LOWER(TRIM(user_email))
    AND sq.is_active = true
  ORDER BY sq.id;
END;
$$;


ALTER FUNCTION "users"."get_user_security_questions_by_email"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Obtener el ID del rol admin
    SELECT id INTO admin_role_id FROM users.roles WHERE name = 'admin';
    
    -- Insertar nuevo usuario en la tabla usuarios
    INSERT INTO users.usuarios (id, name, department)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'General'
    );
    
    -- Asignar rol de admin al nuevo usuario
    INSERT INTO users.user_roles (user_id, role_id)
    VALUES (NEW.id, admin_role_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "users"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."has_permission"("user_uuid" "uuid", "permission_path" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    user_permissions := users.get_user_permissions(user_uuid);
    
    -- Si tiene permisos de admin (all: true), retorna true
    IF user_permissions->>'all' = 'true' THEN
        RETURN true;
    END IF;
    
    -- Verificar el permiso específico
    RETURN (user_permissions #> string_to_array(permission_path, '.'))::boolean IS TRUE;
END;
$$;


ALTER FUNCTION "users"."has_permission"("user_uuid" "uuid", "permission_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."hash_security_answer_argon2"("p_answer" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN pgsodium.crypto_pwhash(LOWER(TRIM(p_answer)));
END;
$$;


ALTER FUNCTION "users"."hash_security_answer_argon2"("p_answer" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."hash_security_answer_argon2"("p_answer" "text") IS 'Hashea una respuesta de seguridad usando Argon2id vía pgsodium';



CREATE OR REPLACE FUNCTION "users"."hash_security_answer_v2"("answer_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN crypt(LOWER(TRIM(answer_text)), gen_salt('bf', 12));
END;
$$;


ALTER FUNCTION "users"."hash_security_answer_v2"("answer_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."save_user_security_answers_argon2"("p_user_id" "uuid", "p_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    question_id_key text;
    answer_text text;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    DELETE FROM users.user_security_answers
    WHERE user_id = p_user_id;

    FOR question_id_key, answer_text IN
        SELECT * FROM jsonb_each_text(p_answers)
    LOOP
        INSERT INTO users.user_security_answers (user_id, question_id, answer_hash)
        VALUES (
            p_user_id,
            question_id_key::integer,
            users.hash_security_answer_argon2(answer_text)
        );
    END LOOP;

    RETURN true;
EXCEPTION
    WHEN others THEN RAISE EXCEPTION 'Error al guardar respuestas: %', SQLERRM;
END;
$$;


ALTER FUNCTION "users"."save_user_security_answers_argon2"("p_user_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."save_user_security_answers_argon2"("p_user_id" "uuid", "p_answers" "jsonb") IS 'Guarda respuestas de seguridad hasheadas con Argon2id';



CREATE OR REPLACE FUNCTION "users"."save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN users.save_user_security_answers_argon2(p_user_id, p_answers);
END;
$$;


ALTER FUNCTION "users"."save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."update_reporte_as_analista"("reporte_id" "uuid", "new_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Verificar que el usuario es analista
    IF NOT users.current_user_has_role('analista') AND NOT users.current_user_is_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para realizar esta operación';
    END IF;
    
    -- Verificar que no se está intentando modificar asignado_a
    IF new_data ? 'asignado_a' THEN
        RAISE EXCEPTION 'Los analistas no pueden modificar el campo asignado_a';
    END IF;
    
    -- Aquí iría la lógica de actualización
    -- Ejemplo (ajustar según tu estructura real):
    /*
    UPDATE incidentes.reporte_incidente 
    SET 
        titulo = COALESCE(new_data->>'titulo', titulo),
        descripcion = COALESCE(new_data->>'descripcion', descripcion),
        estado = COALESCE(new_data->>'estado', estado),
        -- Agregar otros campos según tu estructura
        updated_at = NOW()
    WHERE id = reporte_id;
    */
    
    RETURN true;
END;
$$;


ALTER FUNCTION "users"."update_reporte_as_analista"("reporte_id" "uuid", "new_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "users"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."verify_security_answer"("p_user_id" "uuid", "p_question_id" integer, "p_answer" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Obtener el hash almacenado
  SELECT answer_hash INTO stored_hash
  FROM users.user_security_answers
  WHERE user_id = p_user_id
    AND question_id = p_question_id;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar la respuesta
  RETURN (stored_hash = crypt(LOWER(TRIM(p_answer)), stored_hash));
END;
$$;


ALTER FUNCTION "users"."verify_security_answer"("p_user_id" "uuid", "p_question_id" integer, "p_answer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."verify_security_answer_argon2"("p_answer" "text", "p_hash" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN pgsodium.crypto_pwhash_verify(p_hash, LOWER(TRIM(p_answer)));
EXCEPTION
    WHEN others THEN RETURN false;
END;
$$;


ALTER FUNCTION "users"."verify_security_answer_argon2"("p_answer" "text", "p_hash" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."verify_security_answer_argon2"("p_answer" "text", "p_hash" "text") IS 'Verifica una respuesta de seguridad contra su hash Argon2id';



CREATE OR REPLACE FUNCTION "users"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN users.verify_security_answers_by_email_argon2(user_email, provided_answers);
END;
$$;


ALTER FUNCTION "users"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "users"."verify_security_answers_by_email_argon2"("user_email" "text", "provided_answers" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record record;
    question_id_key text;
    provided_answer text;
    stored_hash text;
    match_count integer := 0;
    total_answers integer := 0;
BEGIN
    SELECT id INTO user_record
    FROM auth.users
    WHERE email = LOWER(TRIM(user_email));

    IF NOT FOUND THEN RETURN false; END IF;

    total_answers := jsonb_object_length(provided_answers);

    FOR question_id_key, provided_answer IN
        SELECT * FROM jsonb_each_text(provided_answers)
    LOOP
        SELECT answer_hash INTO stored_hash
        FROM users.user_security_answers
        WHERE user_id = user_record.id
        AND question_id = question_id_key::integer;

        IF FOUND THEN
            IF users.verify_security_answer_argon2(provided_answer, stored_hash) THEN
                match_count := match_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN match_count > 0 AND match_count = total_answers;
EXCEPTION
    WHEN others THEN RETURN false;
END;
$$;


ALTER FUNCTION "users"."verify_security_answers_by_email_argon2"("user_email" "text", "provided_answers" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "users"."verify_security_answers_by_email_argon2"("user_email" "text", "provided_answers" "jsonb") IS 'Verifica respuestas de seguridad por email usando Argon2id';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "incidents"."incidents" (
    "id" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "severity" character varying(20) NOT NULL,
    "status" character varying(50) NOT NULL,
    "assignedto" character varying(50) DEFAULT ''::character varying NOT NULL,
    "description" "text" NOT NULL,
    "impact" "text" DEFAULT ''::"text" NOT NULL,
    "createdat" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedat" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolvedat" timestamp with time zone,
    "reportedby" character varying(50) DEFAULT ''::character varying NOT NULL,
    "resolution" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "affectedsystems" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "incidents_severidad_check" CHECK ((("severity")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[]))),
    CONSTRAINT "incidents_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying])::"text"[]))),
    CONSTRAINT "incidents_tipo_check" CHECK ((("type")::"text" = ANY ((ARRAY['malware'::character varying, 'phishing'::character varying, 'data_breach'::character varying, 'unauthorized_access'::character varying, 'ddos'::character varying, 'ransomware'::character varying, 'social_engineering'::character varying, 'system_compromise'::character varying, 'policy_violation'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "incidents"."incidents" OWNER TO "postgres";


COMMENT ON TABLE "incidents"."incidents" IS 'Main incidents table with improved structure and naming';



CREATE TABLE IF NOT EXISTS "logs"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "incident_id" character varying(50) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "details" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "logs"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."password_recovery_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" character varying NOT NULL,
    "recovery_token" character varying,
    "expires_at" timestamp with time zone NOT NULL,
    "attempts_count" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "is_used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."password_recovery_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "users"."security_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "users"."security_questions_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."security_questions" (
    "id" integer DEFAULT "nextval"('"users"."security_questions_id_seq"'::"regclass") NOT NULL,
    "question_text" "text" NOT NULL,
    "category" character varying DEFAULT 'general'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."security_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role_id" "uuid",
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."user_security_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" integer NOT NULL,
    "answer_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."user_security_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "users"."usuarios" (
    "id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "department" character varying(100),
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "users"."usuarios" OWNER TO "postgres";


CREATE OR REPLACE VIEW "users"."usuarios_con_roles" AS
 SELECT "u"."id",
    "u"."name",
    "u"."department",
    "u"."is_active",
    "au"."email",
    "au"."created_at" AS "auth_created_at",
    "u"."created_at",
    "u"."updated_at",
    "array_agg"("r"."name") AS "roles",
    "array_agg"("r"."permissions") AS "permissions"
   FROM ((("users"."usuarios" "u"
     LEFT JOIN "auth"."users" "au" ON (("u"."id" = "au"."id")))
     LEFT JOIN "users"."user_roles" "ur" ON (("u"."id" = "ur"."user_id")))
     LEFT JOIN "users"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  GROUP BY "u"."id", "u"."name", "u"."department", "u"."is_active", "au"."email", "au"."created_at", "u"."created_at", "u"."updated_at";


ALTER VIEW "users"."usuarios_con_roles" OWNER TO "postgres";


ALTER TABLE ONLY "incidents"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "logs"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."password_recovery_attempts"
    ADD CONSTRAINT "password_recovery_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."password_recovery_attempts"
    ADD CONSTRAINT "password_recovery_attempts_recovery_token_key" UNIQUE ("recovery_token");



ALTER TABLE ONLY "users"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "users"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."security_questions"
    ADD CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."security_questions"
    ADD CONSTRAINT "security_questions_question_text_key" UNIQUE ("question_text");



ALTER TABLE ONLY "users"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "users"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "users"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_incidents_asignado_a" ON "incidents"."incidents" USING "btree" ("assignedto");



CREATE INDEX "idx_incidents_creado_en" ON "incidents"."incidents" USING "btree" ("createdat");



CREATE INDEX "idx_incidents_estado" ON "incidents"."incidents" USING "btree" ("status");



CREATE INDEX "idx_incidents_severidad" ON "incidents"."incidents" USING "btree" ("severity");



CREATE INDEX "idx_incidents_tipo" ON "incidents"."incidents" USING "btree" ("type");



CREATE INDEX "idx_audit_logs_incident_id" ON "logs"."audit_logs" USING "btree" ("incident_id");



CREATE INDEX "idx_audit_logs_timestamp" ON "logs"."audit_logs" USING "btree" ("timestamp");



CREATE INDEX "idx_audit_logs_user_id" ON "logs"."audit_logs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_incidents_updated_at" BEFORE UPDATE ON "incidents"."incidents" FOR EACH ROW EXECUTE FUNCTION "incidents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "users"."roles" FOR EACH ROW EXECUTE FUNCTION "users"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_usuarios_updated_at" BEFORE UPDATE ON "users"."usuarios" FOR EACH ROW EXECUTE FUNCTION "users"."update_updated_at"();



ALTER TABLE ONLY "logs"."audit_logs"
    ADD CONSTRAINT "audit_logs_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"."incidents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "logs"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."usuarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "users"."password_recovery_attempts"
    ADD CONSTRAINT "password_recovery_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "users"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"."usuarios"("id");



ALTER TABLE ONLY "users"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "users"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "users"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."usuarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "users"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "users"."security_questions"("id");



ALTER TABLE ONLY "users"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "users"."usuarios"
    ADD CONSTRAINT "usuarios_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to create incidents" ON "incidents"."incidents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to update incidents" ON "incidents"."incidents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view incidents" ON "incidents"."incidents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "incidents"."incidents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable all operations for authenticated users" ON "users"."roles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all operations for authenticated users" ON "users"."user_roles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all operations for authenticated users" ON "users"."usuarios" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "users"."password_recovery_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "password_recovery_attempts_own" ON "users"."password_recovery_attempts" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "users"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "users"."security_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_questions_read" ON "users"."security_questions" FOR SELECT USING (("is_active" = true));



ALTER TABLE "users"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "users"."user_security_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_security_answers_own" ON "users"."user_security_answers" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "users"."usuarios" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "incidents" TO "anon";
GRANT USAGE ON SCHEMA "incidents" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


































































































































































GRANT ALL ON FUNCTION "public"."change_password_simple_debug"("user_email" "text", "new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."change_password_simple_debug"("user_email" "text", "new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_password_simple_debug"("user_email" "text", "new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_password_with_verification"("user_email" "text", "new_password" "text", "verified_answers" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_answers_exist"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_has_security_answers"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_recovery_attempts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_recovery_attempts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_recovery_attempts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_security_questions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_security_questions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_security_questions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_security_questions_by_email"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_user_security_answers"("p_user_id" "uuid", "p_answers" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "user_name" "text", "user_department" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "user_name" "text", "user_department" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "user_name" "text", "user_department" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_argon2_hash"("stored_hash" "text", "provided_answer" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_argon2_hash"("stored_hash" "text", "provided_answer" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_argon2_hash"("stored_hash" "text", "provided_answer" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_security_answer"("stored_hash" "text", "provided_answer" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "users"."can_attempt_password_recovery"("user_email" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."change_password_with_verification"("user_email" "text", "security_answers" "jsonb", "new_password" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."change_password_with_verification_argon2"("user_email" "text", "security_answers" "jsonb", "new_password" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."check_user_answers_exist"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "users"."check_user_has_security_answers"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "users"."debug_save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "users"."get_security_questions"() TO "authenticated";



GRANT ALL ON FUNCTION "users"."get_user_security_questions_by_email"("user_email" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."hash_security_answer_argon2"("p_answer" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."hash_security_answer_v2"("answer_text" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."save_user_security_answers_argon2"("p_user_id" "uuid", "p_answers" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "users"."save_user_security_answers_hashed"("p_user_id" "uuid", "p_answers" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "users"."verify_security_answer"("p_user_id" "uuid", "p_question_id" integer, "p_answer" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."verify_security_answer_argon2"("p_answer" "text", "p_hash" "text") TO "authenticated";



GRANT ALL ON FUNCTION "users"."verify_security_answers_by_email"("user_email" "text", "provided_answers" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "users"."verify_security_answers_by_email_argon2"("user_email" "text", "provided_answers" "jsonb") TO "authenticated";


















GRANT ALL ON TABLE "incidents"."incidents" TO "anon";
GRANT ALL ON TABLE "incidents"."incidents" TO "authenticated";












GRANT ALL ON TABLE "users"."password_recovery_attempts" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "users"."security_questions_id_seq" TO "authenticated";



GRANT SELECT ON TABLE "users"."security_questions" TO "authenticated";



GRANT ALL ON TABLE "users"."user_security_answers" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
