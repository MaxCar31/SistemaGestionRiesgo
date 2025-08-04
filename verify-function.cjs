const { createClient } = require("@supabase/supabase-js");

// Usar las mismas credenciales que la aplicación
const supabaseUrl = "https://oyfasotameoxztlfhcvb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmFzb3RhbWVveHp0bGZoY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzkxODUsImV4cCI6MjA2Njk1NTE4NX0.Rl86WNyeQWcjx8KOLDTLHXu6VkyNTnEqwMEFIAiV5rg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFunction() {
  console.log("🔍 Verificando funciones disponibles...");

  try {
    // Intentar llamar a la función directamente
    console.log("📞 Intentando llamar get_user_with_role...");
    const { data, error } = await supabase.rpc("get_user_with_role", {
      user_uuid: "c1b2a3d4-5e6f-7890-abcd-ef1234567890", // UUID de prueba
    });

    if (error) {
      console.error("❌ Error al llamar función:", error);
      console.error("Detalles:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Función encontrada, datos:", data);
    }

    // Intentar listar todas las funciones disponibles
    console.log("\n🔍 Listando todas las funciones RPC disponibles...");
    const { data: functions, error: funcError } = await supabase
      .from("pg_proc")
      .select("proname")
      .eq("pronamespace", "2200"); // namespace público

    if (funcError) {
      console.error("❌ Error al listar funciones:", funcError);
    } else {
      console.log(
        "📋 Funciones encontradas:",
        functions?.map((f) => f.proname)
      );
    }
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

verifyFunction();
