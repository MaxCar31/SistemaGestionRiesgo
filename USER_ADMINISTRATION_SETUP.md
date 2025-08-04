# Configuración de Administración de Usuarios

## Pasos para configurar el sistema de administración de usuarios

### 1. Ejecutar las funciones SQL en Supabase

1. Ve al SQL Editor en tu dashboard de Supabase
2. Ejecuta el contenido del archivo `database/user_administration_functions.sql`
3. Esto creará las funciones necesarias para:
   - `get_available_roles()`: Obtener roles disponibles
   - `can_create_users()`: Verificar permisos de administrador
   - `create_user_profile()`: Crear usuario completo con rol
   - `get_all_users()`: Listar todos los usuarios

### 2. Verificar estructura de tablas

Las siguientes tablas deben existir en el esquema `users`:

```sql
-- Tabla de usuarios
users.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de roles
users.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignación de roles
users.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users.usuarios(id),
  role_id UUID REFERENCES users.roles(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

### 3. Insertar roles básicos

Si no tienes roles creados, ejecuta:

```sql
INSERT INTO users.roles (name, description) VALUES
('admin', 'Administrador del sistema'),
('supervisor', 'Supervisor de operaciones'),
('analista', 'Analista de incidentes')
ON CONFLICT (name) DO NOTHING;
```

### 4. Configurar usuario administrador inicial

Para convertir tu usuario actual en administrador:

```sql
-- Primero, crea tu registro en usuarios si no existe
INSERT INTO users.usuarios (id, name, department, is_active)
SELECT auth.uid(), 'Administrator', 'IT', true
WHERE NOT EXISTS (SELECT 1 FROM users.usuarios WHERE id = auth.uid());

-- Luego asigna el rol de admin
INSERT INTO users.user_roles (user_id, role_id, assigned_by)
SELECT
  auth.uid(),
  (SELECT id FROM users.roles WHERE name = 'admin'),
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM users.user_roles ur
  JOIN users.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid() AND r.name = 'admin'
);
```

### 5. Funcionalidad implementada

El sistema de administración de usuarios incluye:

✅ **Solo administradores pueden acceder**: RLS y verificaciones de permisos
✅ **Crear nuevos usuarios**: Con email, contraseña, nombre, departamento y rol
✅ **Asignación de roles**: Dropdown con roles disponibles
✅ **Lista de usuarios existentes**: Tabla con información completa
✅ **Validaciones de formulario**: Email, contraseña mínima, campos requeridos
✅ **Manejo de errores**: Mensajes claros para el usuario

### 6. Uso del sistema

1. Inicia sesión como administrador
2. Ve a "Administración de Usuarios" en el menú lateral
3. Haz clic en "Crear Usuario" para abrir el formulario
4. Completa los datos requeridos y selecciona un rol
5. El nuevo usuario podrá iniciar sesión con las credenciales creadas

### 7. Seguridad implementada

- **RLS (Row Level Security)**: Solo administradores pueden gestionar usuarios
- **SECURITY DEFINER**: Las funciones se ejecutan con permisos elevados pero validados
- **Validaciones**: Verificación de roles y permisos en cada operación
- **Auditoría**: Se registra quién asigna roles y cuándo

### 8. Próximos pasos opcionales

- [ ] Edición de usuarios existentes
- [ ] Desactivar/activar usuarios
- [ ] Cambio de roles
- [ ] Historial de cambios
- [ ] Exportar lista de usuarios
