import { useState, useEffect } from 'react';
import {
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
} from '../../lib/admin';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'client';
  created_at: string;
  auth_users?: {
    email: string;
  };
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, username: string) {
    if (
      !confirm(
        `¿Estás seguro de eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteUserProfile(userId);
      setUsers(users.filter((u) => u.id !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  async function handleUpdateUser(userId: string, updates: any) {
    try {
      await updateUserProfile(userId, updates);
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
      setShowEditModal(false);
      setEditingUser(null);
      alert('Usuario actualizado exitosamente');
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getRoleConfig(role: string) {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          icon: '👑',
          color: 'bg-purple-100 text-purple-800',
        };
      case 'company':
        return {
          label: 'Empresa',
          icon: '🏢',
          color: 'bg-blue-100 text-blue-800',
        };
      case 'client':
        return {
          label: 'Cliente',
          icon: '👤',
          color: 'bg-green-100 text-green-800',
        };
      default:
        return { label: role, icon: '❓', color: 'bg-gray-100 text-gray-800' };
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesRole = filter === 'all' || user.role === filter;
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.auth_users?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800 mb-4">❌ Error: {error}</p>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            👥 Gestión de Usuarios
          </h2>
          <p className="text-gray-600">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado
            {users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/admin/create-user')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          ➕ Crear Usuario
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por nombre, usuario o email..."
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👑 Admins ({users.filter((u) => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setFilter('company')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'company'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🏢 Empresas ({users.filter((u) => u.role === 'company').length})
          </button>
          <button
            onClick={() => setFilter('client')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'client'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 Clientes ({users.filter((u) => u.role === 'client').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Registro
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? '🔍 No se encontraron usuarios con ese criterio'
                      : '👥 No hay usuarios para mostrar'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.auth_users?.email || `${user.username}@ali.com`}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}
                        >
                          <span>{roleConfig.icon}</span>
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.username)
                            }
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                ✏️ Editar Usuario
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, username: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as any,
                    })
                  }
                  className="input-field"
                >
                  <option value="client">👤 Cliente</option>
                  <option value="company">🏢 Empresa</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleUpdateUser(editingUser.id, {
                    username: editingUser.username,
                    full_name: editingUser.full_name,
                    role: editingUser.role,
                  })
                }
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
