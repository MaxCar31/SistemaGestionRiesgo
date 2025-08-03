# MIGRACIÓN DE PREGUNTAS DE SEGURIDAD AL ESQUEMA USERS

## 📋 PASOS PARA COMPLETAR LA MIGRACIÓN

### 1. EJECUTAR LA MIGRACIÓN EN SUPABASE

```sql
-- Ejecutar el archivo completo en Supabase SQL Editor:
database/migrate_to_users_schema_FINAL.sql
```

### 2. VERIFICAR LA MIGRACIÓN

```sql
-- Ejecutar el script de verificación:
database/verify_migration.sql
```

### 3. ACTUALIZAR EL CÓDIGO DEL FRONTEND

#### 3.1 Reemplazar el hook actual

- **Reemplazar**: `src/hooks/useSecurityQuestionsDebug.ts`
- **Con**: `src/hooks/useSecurityQuestionsUsers.ts`

#### 3.2 Actualizar la importación en SecurityQuestionsSetup.tsx

```typescript
// CAMBIAR ESTA LÍNEA:
import useSecurityQuestionsDebug from "../../hooks/useSecurityQuestionsDebug";

// POR ESTA:
import useSecurityQuestionsUsers from "../../hooks/useSecurityQuestionsUsers";

// Y CAMBIAR LA LLAMADA AL HOOK:
const { questions, loading, error, setupAnswers, hasSetupQuestions } =
  useSecurityQuestionsUsers(); // <- AQUÍ
```

### 4. PROBAR EL SISTEMA

#### 4.1 Funciones que deberían funcionar:

- ✅ Configurar preguntas de seguridad
- ✅ Recuperación de contraseña por preguntas
- ✅ Verificación de respuestas con hashing

#### 4.2 Esquemas que se utilizan ahora:

- **ANTES**: `public.security_questions`, `public.user_security_answers`
- **AHORA**: `users.security_questions`, `users.user_security_answers`

#### 4.3 Funciones RPC migradas:

- `users.save_user_security_answers_hashed()`
- `users.get_user_security_questions_by_email()`
- `users.verify_security_answers_by_email()`
- `users.change_password_with_verification()`
- Y todas las demás funciones helper

### 5. ELIMINAR DATOS ANTIGUOS (SOLO DESPUÉS DE PROBAR)

⚠️ **IMPORTANTE**: Solo ejecutar después de verificar que todo funciona:

```sql
-- Descomentar y ejecutar las líneas del final de migrate_to_users_schema_FINAL.sql
-- para eliminar las tablas y funciones del esquema public
```

## 🔍 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos archivos:

- `database/migrate_to_users_schema_FINAL.sql` - Script de migración completo
- `database/verify_migration.sql` - Script de verificación
- `src/hooks/useSecurityQuestionsUsers.ts` - Hook actualizado sin errores de lint

### Archivos modificados:

- `src/hooks/useSecurityQuestionsDebug.ts` - Actualizado para usar esquema users
- `src/hooks/usePasswordRecovery.ts` - Actualizado para usar esquema users

## 🎯 RESULTADO ESPERADO

Después de la migración:

- ✅ Todas las tablas de seguridad en el esquema `users`
- ✅ Todas las funciones RPC en el esquema `users`
- ✅ Datos preservados correctamente
- ✅ Sistema de recuperación funcionando
- ✅ Código limpio sin errores de lint
- ✅ Estructura más organizada y consistente

## 🚨 NOTAS IMPORTANTES

1. **Hacer backup** antes de ejecutar la migración
2. **Probar en desarrollo** antes de aplicar en producción
3. **No eliminar** los datos de `public` hasta confirmar que todo funciona
4. **Verificar permisos** después de la migración
5. **Comprobar** que las políticas RLS funcionan correctamente
