import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase (usando las mismas credenciales del proyecto)
const supabaseUrl = "https://xzzzlcwdkqljjwqxkjdt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6enpsY3dka3FsampvcXhramR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5Mjg1NDcsImV4cCI6MjA1MjUwNDU0N30.6w3DzwLHG1q_n1cLpXG3hBECZ-qfwGIz_w7w12k3dNI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlow() {
  console.log("🧪 === PRUEBA DE FLUJO DE PREGUNTAS DE SEGURIDAD ===\n");

  try {
    // 1. Verificar usuario demo
    console.log("1️⃣ Verificando usuario demo...");
    const { data: authResult, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "demo@test.com",
        password: "demo123",
      });

    if (authError) {
      console.log("❌ Error al autenticar usuario demo:", authError.message);
      return;
    }

    console.log("✅ Usuario demo autenticado:", authResult.user.email);

    // 2. Verificar preguntas de seguridad
    console.log("\n2️⃣ Verificando preguntas de seguridad...");
    const { data: questions, error: questionsError } = await supabase
      .from("user_security_answers")
      .select("id, question_id, created_at")
      .eq("user_id", authResult.user.id);

    if (questionsError) {
      console.log("❌ Error al consultar preguntas:", questionsError.message);
      return;
    }

    console.log(`📊 Preguntas configuradas: ${questions.length}`);
    if (questions.length > 0) {
      console.log("📝 Detalles de las preguntas:");
      questions.forEach((q, index) => {
        console.log(
          `   ${index + 1}. ID: ${q.id}, Pregunta: ${q.question_id}, Creado: ${
            q.created_at
          }`
        );
      });
    }

    // 3. Estado esperado para la prueba
    console.log("\n3️⃣ Estado para prueba:");
    if (questions.length === 0) {
      console.log("✅ PERFECTO: Usuario NO tiene preguntas configuradas");
      console.log("   → Debería redirigir a configuración de preguntas");
    } else {
      console.log("⚠️  Usuario YA tiene preguntas configuradas");
      console.log(
        "   → Para probar el flujo, necesitamos eliminar las preguntas"
      );

      // Preguntar si queremos limpiar las preguntas
      console.log("\n🧹 ¿Quieres limpiar las preguntas para probar el flujo?");
      console.log("   Esto permitirá probar la redirección a configuración");
    }

    // 4. Cerrar sesión
    await supabase.auth.signOut();
    console.log("\n4️⃣ Sesión cerrada para prueba");

    console.log("\n🎯 PRÓXIMOS PASOS PARA PROBAR:");
    console.log("1. Ir a http://localhost:5175");
    console.log("2. Hacer login con demo@test.com / demo123");
    console.log("3. Verificar que redirige a configuración de preguntas");
    console.log("4. Configurar las preguntas");
    console.log("5. Verificar que redirige al dashboard");
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Función para limpiar preguntas si es necesario
async function cleanQuestions() {
  console.log("🧹 === LIMPIANDO PREGUNTAS DE SEGURIDAD ===\n");

  try {
    const { data: authResult, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "demo@test.com",
        password: "demo123",
      });

    if (authError) {
      console.log("❌ Error al autenticar:", authError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("user_security_answers")
      .delete()
      .eq("user_id", authResult.user.id);

    if (deleteError) {
      console.log("❌ Error al eliminar preguntas:", deleteError.message);
      return;
    }

    console.log("✅ Preguntas de seguridad eliminadas");
    console.log("🎯 Ahora puedes probar el flujo completo");

    await supabase.auth.signOut();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.includes("--clean")) {
  cleanQuestions();
} else {
  testFlow();
}
