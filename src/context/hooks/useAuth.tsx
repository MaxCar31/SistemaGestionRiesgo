import { useState, useEffect } from 'react';
import { User, RoleName, RolePermissions } from '../../types';
import { supabase } from '../../lib/supabase';
import { ROLE_PERMISSIONS } from './usePermissions';
import { User as SupabaseUser } from '../../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true) // Set initial loading to true
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    // Get initial session and set up auth listener
    const initAuth = async () => {
      try {
        // Add the missing session declaration
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        
        if (session?.user) {
          try {
            // Obtener información completa del usuario desde usuarios_con_roles
            const { data, error } = await supabase
              .from('users.usuarios_con_roles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error('Error al obtener usuario:', error);
              setError(error.message);
              throw error;
            }
            
            if (data) {
              // Si encontramos el usuario en nuestra vista personalizada, usar esos datos
              // Explicitly cast the result to the correct type
              const userData = data as SupabaseUser;
              const mappedUser: User = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                department: userData.department || 'Sin departamento',
                is_active: userData.is_active,
                auth_created_at: userData.auth_created_at,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                roles: (userData.roles as unknown) as RoleName[] || [],
                permissions: (userData.permissions as unknown) as RolePermissions[] || []
              };
              setCurrentUser(mappedUser);
            } else {
              // Fallback a la información básica de auth.users
              const mappedUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                email: session.user.email || '',
                department: session.user.user_metadata?.department || 'Seguridad IT',
                is_active: true,
                auth_created_at: session.user.created_at,
                created_at: null,
                updated_at: null,
                roles: [session.user.user_metadata?.role as RoleName || 'analista'],
                permissions: [ROLE_PERMISSIONS[session.user.user_metadata?.role as RoleName || 'analista']]
              };
              setCurrentUser(mappedUser);
            }
          } catch (err) {
            // En caso de error, usar datos básicos
            setError(err instanceof Error ? err.message : 'Error desconocido al obtener usuario');
            // Fallback a la información básica
            const role = session.user.user_metadata?.role as RoleName || 'analista';
            const mappedUser: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              department: session.user.user_metadata?.department || 'Seguridad IT',
              is_active: true,
              auth_created_at: session.user.created_at,
              created_at: null,
              updated_at: null,
              roles: [role],
              permissions: [ROLE_PERMISSIONS[role]]
            };
            setCurrentUser(mappedUser);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de inicialización de autenticación');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setError(null);
        
        if (session?.user) {
          try {
            // Obtener información completa del usuario desde usuarios_con_roles
            const { data, error } = await supabase
              .from('users.usuarios_con_roles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error al obtener usuario:', error);
              setError(error.message);
              throw error;
            }
            
            if (data) {
              // Explicitly cast the result to the correct type
              const userData = data as SupabaseUser;
              const mappedUser: User = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                department: userData.department || 'Sin departamento',
                is_active: userData.is_active,
                auth_created_at: userData.auth_created_at,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                roles: (userData.roles as unknown) as RoleName[] || [],
                permissions: (userData.permissions as unknown) as RolePermissions[] || []
              };
              setCurrentUser(mappedUser);
            } else {
              // Fallback a la información básica
              const role = session.user.user_metadata?.role as RoleName || 'analista';
              const mappedUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                email: session.user.email || '',
                department: session.user.user_metadata?.department || 'Seguridad IT',
                is_active: true,
                auth_created_at: session.user.created_at,
                created_at: null,
                updated_at: null,
                roles: [role],
                permissions: [ROLE_PERMISSIONS[role]]
              };
              setCurrentUser(mappedUser);
            }
          } catch (error) {
            // En caso de error, usar datos básicos
            const role = session.user.user_metadata?.role as RoleName || 'analista';
            const mappedUser: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              department: session.user.user_metadata?.department || 'Seguridad IT',
              is_active: true,
              auth_created_at: session.user.created_at,
              created_at: null,
              updated_at: null,
              roles: [role],
              permissions: [ROLE_PERMISSIONS[role]]
            };
            setCurrentUser(mappedUser);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Function to fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('users.usuarios_con_roles')
        .select('*');
        
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      if (data) {
        setUsers(data as unknown as User[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    setCurrentUser,
    users,
    loading,
    error,
    fetchUsers
  };
}

