import { useState, useEffect } from 'react';
import { User, RoleName, RolePermissions } from '../../types';
import { supabase } from '../../lib/supabase';
import { ROLE_PERMISSIONS } from './usePermissions';
import { User as SupabaseUser } from '../../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and set up auth listener
    const initAuth = async () => {
      // Add the missing session declaration
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          // Obtener información completa del usuario desde usuarios_con_roles
          const { data, error } = await supabase
            .schema('users')
            .from('usuarios_con_roles') // Use dot notation for schema instead of .schema() method
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error al obtener usuario:', error);
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
        } catch (error) {
          // En caso de error, usar datos básicos
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
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            // Obtener información completa del usuario desde usuarios_con_roles
            const { data, error } = await supabase
              .schema('users')
              .from('usuarios_con_roles')  // Use dot notation for schema instead of .schema() method
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error al obtener usuario:', error);
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

  return {
    currentUser,
    setCurrentUser,
    loading,          // ← expón el loading
    Error,     
  };
}
    
