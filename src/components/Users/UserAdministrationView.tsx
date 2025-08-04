import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Mail, User, Shield, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Cliente admin para crear usuarios
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface CreateUserForm {
  email: string;
  password: string;
  name: string;
  department: string;
  role: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface ExistingUser {
  id: string;
  name: string;
  email?: string; // Puede venir de Auth o de un JOIN, pero no de la tabla usuarios
  department: string;
  is_active: boolean;
  role_name: string;
  role_id?: string;
  created_at: string;
}



export default function UserAdministrationView() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    name: '',
    department: '',
    role: ''
  });

  // Estado y lógica de edición
  const [editUser, setEditUser] = useState<ExistingUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', department: '', role: '', email: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const handleEditUser = async (user: ExistingUser) => {
    // Si los roles aún no están cargados, espera y reintenta
    if (!roles || roles.length === 0) {
      setTimeout(() => handleEditUser(user), 100);
      return;
    }
    let emailActual = user.email || '';
    // Buscar email real en Auth si no viene en el objeto user
    if (!emailActual && user.id) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (!error && data && data.user && data.user.email) {
          emailActual = data.user.email;
        }
      } catch (e) {
        // Si falla, dejar email vacío
      }
    }
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      department: user.department || '',
      // Buscar el id del rol actual a partir del nombre del rol
      role: (() => {
        const found = roles.find(r => r.name === user.role_name);
        return found ? found.id : '';
      })(),
      email: emailActual,
      password: '' // Nunca mostrar la contraseña actual
    });
    setEditMessage(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsEditing(true);
    setEditMessage(null);
    try {
      // Actualizar usuario en la base de datos usando función RPC
      const { error } = await supabase.rpc('update_usuario', {
        p_id: editUser.id,
        p_name: editForm.name,
        p_department: editForm.department
      });
      if (error) throw error;
      // Actualizar rol si cambió
      if (editForm.role && editForm.role !== editUser.role_id) {
        await supabase.from('users.user_roles').delete().eq('user_id', editUser.id);
        await supabase.from('users.user_roles').insert({ user_id: editUser.id, role_id: editForm.role });
      }
      // Actualizar email y/o contraseña en Supabase Auth (solo si cambiaron)
      if (editForm.email !== editUser.email || editForm.password) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(editUser.id, {
          email: editForm.email !== editUser.email ? editForm.email : undefined,
          password: editForm.password ? editForm.password : undefined
        });
        if (authError) throw authError;
      }
      setEditMessage('Usuario actualizado correctamente.');
      setEditUser(null);
      await loadExistingUsers();
    } catch (err) {
      setEditMessage('Error al actualizar el usuario.');
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setEditMessage(null);
  };

  const closeEditModal = () => {
    setEditUser(null);
    setEditMessage(null);
  };

  // Cargar roles y usuarios al montar el componente
  useEffect(() => {
    loadRoles();
    loadExistingUsers();
  }, []);

  const loadRoles = async () => {
    try {
      console.log('🔄 Cargando roles disponibles...');
      const { data, error } = await supabase
        .rpc('get_available_roles');

      console.log('📋 Respuesta de get_available_roles - Data:', data, 'Error:', error);
      
      if (error) throw error;
      setRoles(data || []);
      console.log('✅ Roles cargados:', data);
    } catch (error) {
      console.error('❌ Error cargando roles:', error);
    }
  };

  const loadExistingUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('🔄 Cargando usuarios existentes...');
      const { data, error } = await supabase
        .rpc('get_all_users');

      console.log('👥 Respuesta de get_all_users - Data:', data, 'Error:', error);
      
      if (error) throw error;
      setExistingUsers(data || []);
      console.log('✅ Usuarios cargados:', data);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setCreateMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.name) {
      setCreateMessage({ type: 'error', text: 'Todos los campos obligatorios deben ser completados' });
      return false;
    }
    if (!formData.department || formData.department.trim() === '') {
      setCreateMessage({ type: 'error', text: 'El campo Departamento es obligatorio y no puede estar vacío.' });
      return false;
    }
    if (!formData.role || formData.role === '') {
      setCreateMessage({ type: 'error', text: 'Debes seleccionar un rol para el usuario.' });
      return false;
    }
    if (formData.password.length < 6) {
      setCreateMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setCreateMessage({ type: 'error', text: 'El email no tiene un formato válido' });
      return false;
    }
    return true;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    setCreateMessage(null);

    // Timeout para evitar carga infinita
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout - terminando proceso de creación');
      setIsCreating(false);
      setCreateMessage({ 
        type: 'error', 
        text: 'El proceso tomó demasiado tiempo. Verifica si el usuario se creó correctamente.' 
      });
    }, 30000); // 30 segundos timeout

    try {
      console.log('🚀 Iniciando creación completa de usuario:', {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        department: formData.department
      });

      // Obtener el nombre del rol seleccionado
      const selectedRole = roles.find(r => r.id === formData.role);
      if (!selectedRole) {
        throw new Error('Rol seleccionado no válido');
      }

      // Paso 1: Crear usuario en Supabase Auth usando la API Admin
      const departamentoFinal = formData.department.trim();
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          department: departamentoFinal
        }
      });

      if (authError || !authUser.user) {
        throw new Error(`Error creando usuario en Auth: ${authError?.message || 'Usuario no creado'}`);
      }

      console.log('✅ Usuario creado en Supabase Auth:', authUser.user.id);

      // Paso 2: Crear el perfil usando función RPC que sabemos que funciona
      console.log('🔄 Creando perfil usando función RPC...');
      console.log('🟦 Valor de assigned_role enviado:', formData.role);
      console.log('🟢 Enviando a create_user_profile_v2:', {
        auth_user_id: authUser.user.id,
        user_name: formData.name,
        user_department: departamentoFinal,
        assigned_role: formData.role
      });
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_user_profile_v2', {
          auth_user_id: authUser.user.id,
          user_name: formData.name,
          user_department: departamentoFinal,
          assigned_role: formData.role
        });
      console.log('📋 Resultado del perfil:', profileResult, 'Error:', profileError);

      if (profileError) {
        console.error('❌ Error creando perfil con RPC:', profileError);
        // Si falla crear el perfil, eliminar el usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Error creando perfil: ${profileError.message}`);
      }

      if (!profileResult?.success) {
        console.error('❌ Función RPC falló:', profileResult);
        // Si falla crear el perfil, eliminar el usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(profileResult?.error || 'Error desconocido al crear perfil');
      }

      console.log('✅ Perfil creado exitosamente:', profileResult);

      // Mostrar mensaje de éxito
      alert(`🎉 ¡Usuario creado exitosamente!

📧 Email: ${formData.email}
👤 Nombre: ${formData.name}
🏢 Departamento: ${formData.department || 'General'}
🔐 Rol: ${selectedRole.name}

✅ El usuario puede hacer login inmediatamente
🔑 En su primer login, deberá configurar sus preguntas de seguridad`);

      // Limpiar timeout ya que todo salió bien
      clearTimeout(timeoutId);

      setCreateMessage({ 
        type: 'success', 
        text: `Usuario ${formData.name} creado exitosamente. Ya puede hacer login.` 
      });
      
      // Limpiar formulario y cerrar modal
      setFormData({
        email: '',
        password: '',
        name: '',
        department: '',
        role: ''
      });
      
      setShowCreateForm(false);
      
      // Recargar la lista de usuarios
      await loadExistingUsers();

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      alert(`❌ Error al crear usuario

⚠️ ${errorMessage}

Posibles causas:
• Email ya registrado
• Campos obligatorios vacíos
• Sin permisos de administrador
• Service Role Key no configurada
• Error de conexión

Revisa la configuración e intenta nuevamente.`);
      
      setCreateMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      clearTimeout(timeoutId);
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      department: '',
      role: ''
    });
    setCreateMessage(null);
    setShowCreateForm(false);
  };

  // Desactivar o activar usuario
  // Eliminar usuario (borrado lógico)
  const handleDeleteUser = async (user: ExistingUser) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${user.name}? Esta acción es reversible solo por un administrador.`)) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { user_id: user.id });
      if (error) throw error;
      await loadExistingUsers();
    } catch (err) {
      alert('Error al eliminar el usuario.');
      console.error(err);
    }
  };
  const handleToggleActive = async (user: ExistingUser) => {
    if (!window.confirm(`¿Seguro que deseas ${user.is_active ? 'desactivar' : 'activar'} al usuario ${user.name}?`)) return;
    try {
      if (user.is_active) {
        // Desactivar usuario usando función RPC
        const { error } = await supabase.rpc('admin_deactivate_user', { user_id: user.id });
        if (error) throw error;
      } else {
        // Activar usuario usando función RPC
        const { error } = await supabase.rpc('admin_activate_user', { user_id: user.id });
        if (error) throw error;
      }
      await loadExistingUsers();
    } catch (err) {
      alert('Error al cambiar el estado del usuario.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
              <p className="text-gray-600">Crear y gestionar cuentas de usuario del sistema</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Mensaje de resultado */}
      {createMessage && (
        <div className={`p-4 rounded-lg ${
          createMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {createMessage.text}
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Usuario</h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              {/* Departamento */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="IT, Seguridad, etc."
                required
              />
              </div>

              {/* Rol */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Rol *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Crear Usuario</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios existentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Usuarios Existentes</h3>
          <button
            onClick={loadExistingUsers}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Actualizar
          </button>
        </div>
        
        {isLoadingUsers ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : existingUsers.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Departamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900">Creado</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {existingUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.department || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role_name || 'Sin rol'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </td>
                    {/* Acciones */}
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {/* Botón Editar */}
                        <button
                          title="Editar usuario"
                          className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                          onClick={() => handleEditUser(user)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3zm0 0v3a2 2 0 002 2h3" /></svg>
                        </button>
      {/* Modal de edición de usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">

          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-6">Editar Usuario</h2>
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => handleEditInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={e => handleEditInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={editForm.role}
                  onChange={e => handleEditInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name} - {role.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (solo Auth)</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => handleEditInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña (dejar vacío para no cambiar)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => handleEditInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  placeholder="Nueva contraseña"
                />
              </div>
              {editMessage && <div className="text-sm text-red-600">{editMessage}</div>}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isEditing} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isEditing ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
                        {/* Botón Activar/Desactivar */}
                        <button
                          title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
                          className={`p-2 rounded-lg ${user.is_active ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                        onClick={() => handleToggleActive(user)}
                        
                        >
                          {user.is_active ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                        {/* Botón Eliminar */}
                        <button
                          title="Eliminar usuario"
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
                        onClick={() => handleDeleteUser(user)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
