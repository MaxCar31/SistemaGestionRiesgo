import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../lib/supabase';

export function useAuthWithRoles() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener información completa del usuario incluyendo roles
  const getUserWithRole = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios_con_roles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error al obtener usuario con rol:', error);
        // Si no existe en la tabla usuarios_con_roles, crear entrada básica
        return {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
          email: supabaseUser.email || '',
          role: 'viewer', // Rol por defecto
          department: 'Sin departamento'
        };
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        department: data.department || 'Sin departamento',
        role: mapSupabaseRoleToLocal(data.role_id),
        is_active: data.is_active,
        auth_created_at: data.auth_created_at ? new Date(data.auth_created_at) : undefined,
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      };
    } catch (error) {
      console.error('Error al mapear usuario:', error);
      return null;
    }
  };

  // Mapear role_id de Supabase a nuestros roles locales
  const mapSupabaseRoleToLocal = (roleId: string): 'admin' | 'analyst' | 'viewer' => {
    // Basado en los UUIDs que veo en tu imagen de Supabase
    switch (roleId) {
      case 'd41a7da5-5241-4f4e-9dc4-f9dd64...': // Ajusta según tu UUID real de admin
        return 'admin';
      case 'analyst-uuid': // Ajusta según tu UUID real de analyst
        return 'analyst';
      default:
        return 'viewer';
    }
  };

  // Crear entrada en la tabla usuarios si no existe
  const ensureUserExists = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (!existingUser) {
        // Crear usuario en la tabla usuarios
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            email: supabaseUser.email,
            department: 'Sin departamento',
            is_active: true,
            auth_created_at: supabaseUser.created_at,
          });

        if (insertError) {
          console.error('Error al crear usuario:', insertError);
          return;
        }

        // Asignar rol por defecto (viewer)
        const { data: viewerRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'viewer')
          .single();

        if (viewerRole) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: supabaseUser.id,
              role_id: viewerRole.id,
              assigned_by: supabaseUser.id, // Auto-asignado
              assigned_at: new Date().toISOString(),
            });
        }
      }
    } catch (error) {
      console.error('Error al asegurar la existencia del usuario:', error);
    }
  };

  useEffect(() => {
    // Obtener sesión inicial
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await ensureUserExists(session.user);
        const mappedUser = await getUserWithRole(session.user);
        setCurrentUser(mappedUser);
      }
      
      setLoading(false);
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await ensureUserExists(session.user);
          const mappedUser = await getUserWithRole(session.user);
          setCurrentUser(mappedUser);
        } else {
          setUser(null);
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUp = async (email: string, password: string, userData?: { name?: string; department?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  return {
    user,
    currentUser,
    loading,
    signOut,
    signIn,
    signUp,
    getUserWithRole,
  };
}
