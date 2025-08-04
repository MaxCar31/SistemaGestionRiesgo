import { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Función para cargar usuarios desde Supabase
  const loadUsersFromSupabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando consulta de usuarios...');
      
      // Explicitly specify the "users" schema to avoid the default "incidents.users" path
      const { data, error } = await supabase
      .schema('users')  
      .from('usuarios_con_roles')

      .select('*')                 



      if (error) {
        console.error('Error al cargar usuarios con roles:', error);
        setError(`Error: ${error.message}`);
        return;
      }

      console.log('Datos recibidos:', data);

      if (data && Array.isArray(data)) {
        // Properly cast and map the data
        const mappedUsers: User[] = data.map((user: any) => ({
          id: user.id || null,
          name: user.name || null,
          email: user.email || null,
          department: user.department || 'Sin departamento',
          is_active: user.is_active !== undefined ? user.is_active : null,
          auth_created_at: user.auth_created_at || null,
          created_at: user.created_at || null,
          updated_at: user.updated_at || null,
          roles: Array.isArray(user.roles) ? user.roles : [],
          permissions: user.permissions || []
        }));

        setUsers(mappedUsers);
        console.log('Usuarios cargados:', mappedUsers.length);
      } else {
        console.log('No se recibieron datos o el formato no es correcto');
        setError('No se recibieron datos de usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError(`Error inesperado: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para depurar la conexión a Supabase
  const debugQuery = async () => {
    try {
      console.log('Verificando conexión a Supabase...');
      
      // Explicitly specify the "users" schema here as well
      const { data: tablesData, error: tablesError } = await supabase
        .schema('users')
        .from('usuarios_con_roles')
        .select('count(*)');
        
      if (tablesError) {
        console.error('Error al verificar tablas:', tablesError);
        return false;
      }
      
      console.log('Resultado de prueba de conexión:', tablesData);
      return true;
    } catch (error) {
      console.error('Error en depuración:', error);
      return false;
    }
  };

  // Cargar usuarios automáticamente al montar el componente
  useEffect(() => {
    loadUsersFromSupabase();
  }, []);

  return {
    users,
    setUsers,
    loading,
    error,
    loadUsersFromSupabase,
    debugQuery
  };
}

