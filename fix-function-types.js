const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://shzafdmojmhhmkdlhchh.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemFmZG1vam1oaG1rZGxoY2hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc3NDQ1MSwiZXhwIjoyMDUxMzUwNDUxfQ.pJj0mPw7l7f0jDAIHZGU7v8FO3uo1z7xwHzLv8Lb0-Y";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserFunctionTypes() {
  try {
    console.log("🔧 Corrigiendo tipos de la función get_user_with_role...");

    // Leer el archivo SQL
    const sqlContent = fs.readFileSync(
      path.join(__dirname, "database", "fix_user_function_types.sql"),
      "utf8"
    );

    // Ejecutar el SQL
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: sqlContent,
    });

    if (error) {
      console.error("❌ Error al ejecutar SQL:", error);
      return;
    }

    console.log("✅ Función corregida exitosamente");

    // Probar la función
    console.log("🧪 Probando la función...");
    const { data: testData, error: testError } = await supabase.rpc(
      "get_user_with_role",
      {
        user_uuid: "c1b2a3d4-5e6f-7890-abcd-ef1234567890", // UUID de prueba
      }
    );

    if (testError) {
      console.log("ℹ️ Error esperado (usuario no existe):", testError.message);
    } else {
      console.log("✅ Función funciona correctamente");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fixUserFunctionTypes();
