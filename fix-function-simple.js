const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://shzafdmojmhhmkdlhchh.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemFmZG1vam1oaG1rZGxoY2hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc3NDQ1MSwiZXhwIjoyMDUxMzUwNDUxfQ.pJj0mPw7l7f0jDAIHZGU7v8FO3uo1z7xwHzLv8Lb0-Y";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixFunction() {
  console.log("🔧 Eliminando función existente...");

  // Primero eliminar la función
  const { error: dropError } = await supabase.rpc("exec_sql", {
    sql_query: "DROP FUNCTION IF EXISTS get_user_with_role(uuid);",
  });

  if (dropError) {
    console.error("❌ Error al eliminar función:", dropError);
    return;
  }

  console.log("✅ Función eliminada");

  // Ahora crear la nueva función
  console.log("🔧 Creando nueva función...");

  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION get_user_with_role(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  name character varying(100),
  email character varying(255),
  role character varying(50),
  department character varying(100),
  is_active boolean,
  auth_created_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario autenticado existe
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  -- Retornar información del usuario con su rol
  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(u.name, au.raw_user_meta_data->>'name', 'Usuario')::character varying(100) as name,
    au.email::character varying(255),
    COALESCE(r.name, 'analista')::character varying(50) as role,
    COALESCE(u.department, 'Sin departamento')::character varying(100) as department,
    COALESCE(u.is_active, true) as is_active,
    au.created_at as auth_created_at,
    u.created_at,
    u.updated_at
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.roles r ON ur.role_id = r.id
  WHERE au.id = user_uuid;
END;
$$;`;

  const { error: createError } = await supabase.rpc("exec_sql", {
    sql_query: createFunctionSQL,
  });

  if (createError) {
    console.error("❌ Error al crear función:", createError);
    return;
  }

  console.log("✅ Función creada exitosamente con tipos correctos");
}

fixFunction().catch(console.error);
