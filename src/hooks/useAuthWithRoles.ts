import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../lib/supabase';

export function useAuthWithRoles() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mapear nombres de roles de Supabase a nuestros roles locales
  const mapSupabaseRoleToLocal = (roleName: string): 'admin' | 'supervisor' | 'analista' => {
    console.log('🏷️ Mapeando rol:', roleName);
    switch (roleName) {
      case 'admin':
        return 'admin';
      case 'supervisor':
        return 'supervisor';
      case 'analista':
      default:
        return 'analista';
    }
  };

  useEffect(() => {
    // Obtener información completa del usuario incluyendo roles
    const getUserWithRole = async (supabaseUser: SupabaseUser): Promise<User | null> => {
      try {
        // Usar la nueva función RPC que creamos
        const { data, error } = await supabase
          .rpc('get_user_with_role', { user_uuid: supabaseUser.id });

        console.log('🔍 RPC get_user_with_role - Data:', data, 'Error:', error);

        if (error) {
          console.error('Error al obtener usuario con rol:', error);
          // Si hay error, retornar usuario básico
          return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            email: supabaseUser.email || '',
            role: 'analista', // Rol por defecto
            department: 'Sin departamento'
          };
        }

        // La función RPC devuelve un array, tomamos el primer elemento
        const userData = Array.isArray(data) ? data[0] : data;
        console.log('👤 Datos del usuario obtenidos:', userData);
        
        if (!userData) {
          console.log('⚠️ No se encontraron datos del usuario');
          return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            email: supabaseUser.email || '',
            role: 'analista',
            department: 'Sin departamento'
          };
        }

        const finalUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email || supabaseUser.email || '',
          department: userData.department || 'Sin departamento',
          role: mapSupabaseRoleToLocal(userData.role),
          is_active: userData.is_active
        };

        // Si el usuario está inactivo, cerrar sesión automáticamente
        if (userData.is_active === false) {
          alert('Tu cuenta ha sido desactivada. Contacta al administrador.');
          await supabase.auth.signOut();
          return null;
        }

        console.log('✅ Usuario final mapeado:', finalUser);
        return finalUser;
      } catch (error) {
        console.error('Error al mapear usuario:', error);
        return {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
          email: supabaseUser.email || '',
          role: 'analista',
          department: 'Sin departamento'
        };
      }
    };

    // Obtener sesión inicial
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const mappedUser = await getUserWithRole(session.user);
        setCurrentUser(mappedUser);
      }
      
      setLoading(false);
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
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
  };
}
