import { useState } from 'react';
import { User, RoleName, RolePermissions } from '../../types';
import { mockUsers } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

export function useUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Función para cargar usuarios desde Supabase
  const loadUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_con_roles')
        .select('*')
        .schema('users');

      if (error) {
        console.error('Error al cargar usuarios con roles:', error);
        return;
      }

      if (data) {
        // Properly cast and map the data
        const mappedUsers: User[] = data.map((user: User) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department || 'Sin departamento',
          is_active: user.is_active,
          auth_created_at: user.auth_created_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          roles: (user.roles as unknown) as RoleName[] || [],
          permissions: (user.permissions as unknown) as RolePermissions[] || []
        }));

        setUsers(mappedUsers);
        console.log('Usuarios cargados:', mappedUsers.length);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  return {
    users,
    setUsers,
    loadUsersFromSupabase
  };
}
