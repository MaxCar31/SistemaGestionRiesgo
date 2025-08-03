// SCRIPT DE DIAGNÓSTICO PARA EL NAVEGADOR
// =====================================
// Copiar y pegar este script en la consola del navegador para probar

async function diagnosticoCompleto() {
  console.log("🧪 DIAGNÓSTICO COMPLETO DEL SISTEMA");
  console.log("===================================");

  try {
    // 1. Verificar conexión con Supabase
    console.log("\n1️⃣ Verificando conexión con Supabase...");
    const { data: user } = await supabase.auth.getUser();
    console.log("✅ Usuario actual:", user?.user?.email || "No autenticado");

    // 2. Test de funciones RPC
    console.log("\n2️⃣ Probando funciones RPC del esquema users...");

    // Test get_security_questions
    console.log("🔍 Probando users.get_security_questions...");
    const { data: questions, error: questionsError } = await supabase.rpc(
      "users.get_security_questions"
    );

    if (questionsError) {
      console.error("❌ Error en get_security_questions:", questionsError);
    } else {
      console.log(
        `✅ get_security_questions: ${questions?.length} preguntas encontradas`
      );
      console.log("📋 Primeras 3 preguntas:", questions?.slice(0, 3));
    }

    // Test check_user_has_security_answers (solo si hay usuario)
    if (user?.user) {
      console.log("\n🔍 Probando users.check_user_has_security_answers...");
      const { data: hasAnswers, error: checkError } = await supabase.rpc(
        "users.check_user_has_security_answers",
        { p_user_id: user.user.id }
      );

      if (checkError) {
        console.error(
          "❌ Error en check_user_has_security_answers:",
          checkError
        );
      } else {
        console.log(`✅ check_user_has_security_answers: ${hasAnswers}`);
      }
    }

    // 3. Verificar estado de las tablas del esquema users
    console.log("\n3️⃣ Verificando estado de las tablas...");

    const { data: questionsCount, error: countError } = await supabase
      .from("users.security_questions")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(
        "❌ Error accediendo a users.security_questions:",
        countError
      );
    } else {
      console.log(
        `✅ Tabla users.security_questions: ${
          questionsCount?.length || "No disponible"
        } registros`
      );
    }

    console.log("\n🎉 DIAGNÓSTICO COMPLETADO");
    console.log("========================");
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

// Ejecutar automáticamente
diagnosticoCompleto();
