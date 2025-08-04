import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Mail, User, Shield, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  email: string;
  department: string;
  is_active: boolean;
  role_name: string;
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
    if (!formData.email || !formData.password || !formData.name || !formData.role) {
      setCreateMessage({ type: 'error', text: 'Todos los campos obligatorios deben ser completados' });
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

    try {
      console.log('🚀 Iniciando creación de usuario usando función RPC:', {
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

      // Usar la función RPC admin_create_user para crear el usuario
      const { data: createResult, error: createError } = await supabase
        .rpc('admin_create_user', {
          user_email: formData.email,
          user_password: formData.password,
          user_name: formData.name,
          user_department: formData.department || 'General',
          assigned_role: selectedRole.name
        });

      console.log('📋 Respuesta de admin_create_user - Data:', createResult, 'Error:', createError);

      if (createError) {
        throw new Error(`Error RPC: ${createError.message}`);
      }

      if (!createResult?.success) {
        throw new Error(createResult?.error || 'Error desconocido al crear usuario');
      }

      console.log('✅ Respuesta exitosa de admin_create_user:', createResult);

      // Mostrar ventana de confirmación de éxito
      alert(`🎉 ¡Usuario preparado exitosamente!

📧 Email: ${formData.email}
👤 Nombre: ${formData.name}
🏢 Departamento: ${formData.department || 'Sin departamento'}
🔐 Rol: ${selectedRole.name}

⚠️ IMPORTANTE: Sigue estos pasos para completar la creación:

1. 🔐 Crear el usuario en Supabase Auth usando la Admin API
2. 📝 Luego usar la función create_user_profile_after_auth()
3. 🔑 En su primer login, el usuario deberá configurar sus preguntas de seguridad

${createResult.message || ''}`);

      // Mostrar mensaje de éxito en la interfaz
      setCreateMessage({ 
        type: 'success', 
        text: `Usuario ${formData.name} preparado. Completa la creación en Supabase Auth siguiendo las instrucciones.` 
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
      
      // Recargar la lista de usuarios para mostrar el nuevo usuario
      console.log('🔄 Recargando lista de usuarios...');
      await loadExistingUsers();
      console.log('✅ Lista de usuarios actualizada');

    } catch (error) {
      console.error('❌ Error registrando usuario:', error);
      
      // Mostrar ventana de error detallada
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar el usuario';
      
      alert(`❌ Error al registrar usuario

⚠️ ${errorMessage}

Por favor, revisa:
• Que el email no esté ya registrado
• Que todos los campos obligatorios estén completos
• Que tengas permisos de administrador
• Tu conexión a internet

Intenta nuevamente o contacta al administrador del sistema.`);
      
      setCreateMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
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
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="IT, Seguridad, etc."
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
