import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { useApp } from '../../context/AppContext';
import { useRoles } from '../../hooks/useRoles';

const RoleManagementView: React.FC = () => {
  const { currentUser, users, hasPermission, loadUsersFromSupabase } = useApp();
  const { roles, getUsersWithRoles, assignRoleToUser, removeRoleFromUser, loading } = useRoles();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Verificar si el usuario actual puede gestionar roles
  const canManageRoles = hasPermission('canManageRoles');

  useEffect(() => {
    if (canManageRoles) {
      loadUsersFromSupabase();
    }
  }, [canManageRoles, loadUsersFromSupabase]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !currentUser) return;

    setIsAssigning(true);
    try {
      await assignRoleToUser(selectedUser.id, selectedRole, currentUser.id);
      await loadUsersFromSupabase(); // Recargar usuarios
      setSelectedUser(null);
      setSelectedRole('');
      alert('Rol asignado exitosamente');
    } catch (error) {
      console.error('Error al asignar rol:', error);
      alert('Error al asignar el rol');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm('¿Está seguro de que desea remover este rol?')) return;

    try {
      await removeRoleFromUser(userId, roleId);
      await loadUsersFromSupabase(); // Recargar usuarios
      alert('Rol removido exitosamente');
    } catch (error) {
      console.error('Error al remover rol:', error);
      alert('Error al remover el rol');
    }
  };

  if (!canManageRoles) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
          <p className="text-red-600 mt-1">
            No tienes permisos para gestionar roles de usuario.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
        <p className="text-gray-600 mt-1">
          Asigna y gestiona roles para los usuarios del sistema
        </p>
      </div>

      {/* Sección para asignar roles */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Asignar Rol</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Usuario
              </label>
              <select
                value={selectedUser?.id || ''}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  setSelectedUser(user || null);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAssignRole}
                disabled={!selectedUser || !selectedRole || isAssigning}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isAssigning ? 'Asignando...' : 'Asignar Rol'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuarios con roles */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Usuarios y Roles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'analyst'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' :
                       user.role === 'analyst' ? 'Analista' : 'Visualizador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.is_active === false ? 'Inactivo' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          // Aquí puedes implementar la lógica para desactivar usuario
                          console.log('Desactivar usuario:', user.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        {user.is_active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementView;
