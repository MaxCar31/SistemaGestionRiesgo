import { createClient } from "@supabase/supabase-js";

// Tu configuración de Supabase
const supabaseUrl = "https://oyfasotameoxztlfhcvb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmFzb3RhbWVveHp0bGZoY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzkxODUsImV4cCI6MjA2Njk1NTE4NX0.Rl86WNyeQWcjx8KOLDTLHXu6VkyNTnEqwMEFIAiV5rg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarUsuario() {
  console.log("🔍 === VERIFICANDO ESTADO DEL USUARIO ===\n");

  try {
    // Intentar hacer login para ver el estado
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "demo@test.com",
      password: "demo123456",
    });

    if (error) {
      console.log("❌ Error en login:", error.message);
      console.log("📝 Código de error:", error.status);

      if (error.message.includes("Email not confirmed")) {
        console.log("\n💡 SOLUCIÓN:");
        console.log("1. Ve a tu panel de Supabase");
        console.log("2. Authentication → Configuration → Sign In / Providers");
        console.log('3. DESACTIVA "Confirm email"');
        console.log("4. Guarda los cambios");
        console.log("5. Intenta el login nuevamente");
      }

      if (error.message.includes("Invalid login credentials")) {
        console.log("\n🔄 Creando nuevo usuario...");

        // Crear usuario con confirmación automática
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: "demo@test.com",
            password: "demo123456",
          });

        if (signUpError) {
          console.log("❌ Error creando usuario:", signUpError.message);
        } else {
          console.log(
            "✅ Usuario creado. Estado:",
            signUpData.user?.email_confirmed_at
              ? "CONFIRMADO"
              : "PENDIENTE CONFIRMACIÓN"
          );
        }
      }
    } else {
      console.log("✅ Login exitoso!");
      console.log("👤 Usuario ID:", data.user?.id);
      console.log("📧 Email:", data.user?.email);
      console.log(
        "✉️  Email confirmado:",
        data.user?.email_confirmed_at ? "SÍ" : "NO"
      );

      // Cerrar sesión
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

verificarUsuario();
