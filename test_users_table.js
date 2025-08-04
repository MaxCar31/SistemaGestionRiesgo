import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyfasotameoxztlfhcvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmFzb3RhbWVveHp0bGZoY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MzgwMTcsImV4cCI6MjA1MDMxNDAxN30.sJLMqwjD5AlNY9Z9WqNHLg44y_6l1KkbP2PlqJfGz8Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar estructura de la tabla users
async function checkUsersTable() {
    try {
        // Intentar obtener un usuario para ver la estructura
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        console.log('Estructura de tabla users:');
        console.log('Data:', data);
        console.log('Error:', error);
        
        // También verificar si podemos insertar con pending_auth_setup
        const testId = 'test-' + Date.now();
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert({
                id: testId,
                name: 'Test User',
                email: 'test@example.com',
                pending_auth_setup: true
            })
            .select();
            
        console.log('\nTest insert con pending_auth_setup:');
        console.log('Data:', insertData);
        console.log('Error:', insertError);
        
        // Limpiar test
        if (insertData) {
            await supabase.from('users').delete().eq('id', testId);
            console.log('Test data cleaned');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsersTable();
