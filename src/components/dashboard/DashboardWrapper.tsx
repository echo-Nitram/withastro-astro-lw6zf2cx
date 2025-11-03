import { useEffect, useState } from 'react';
import { getCurrentUser, getProfile, signOut } from '../../lib/supabase';
import AvailableTemplates from '../client/AvailableTemplates';
import Analytics from './Analytics';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'client';
}

export default function DashboardWrapper() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      setLoading(true);

      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        window.location.href = '/login';
        return;
      }

      setEmail(user.email || '');

      const { data: profileData, error: profileError } = await getProfile(
        user.id
      );

      if (profileError || !profileData) {
        setError('Error al cargar perfil');
        return;
      }

      setProfile(profileData as Profile);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            ❌ {error || 'Error al cargar perfil'}
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="btn-primary"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  const roleEmoji = {
    admin: '👑',
    company: '🏢',
    client: '👤',
  };

  const roleText = {
    admin: 'Administrador',
    company: 'Empresa',
    client: 'Cliente',
  };

  const roleColor = {
    admin: 'bg-purple-100 text-purple-800',
    company: 'bg-blue-100 text-blue-800',
    client: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">🎯 CERTIA</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                roleColor[profile.role]
              }`}
            >
              {roleEmoji[profile.role]} {roleText[profile.role]}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido, {profile.full_name || profile.username}! 👋
            </h2>
            <p className="text-gray-600">
              Panel de control - {roleText[profile.role]}
            </p>
          </div>

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Email</p>
              <p className="text-lg font-bold text-blue-900">{email}</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">
                Usuario
              </p>
              <p className="text-lg font-bold text-purple-900">
                {profile.username}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium mb-1">Rol</p>
              <p className="text-lg font-bold text-green-900">
                {roleEmoji[profile.role]} {roleText[profile.role]}
              </p>
            </div>
          </div>

          {/* Dashboard Content by Role */}
          {profile.role === 'admin' && (
            <div className="space-y-6">
              {/* Botón Principal */}
              <button
                onClick={() => (window.location.href = '/admin')}
                className="w-full p-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-left"
              >
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-2xl font-bold mb-2">
                  Panel de Administración
                </h3>
                <p className="text-lg opacity-90">
                  Gestión completa de usuarios y sistema
                </p>
              </button>

              {/* Info Panel */}
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-3">
                  👑 Panel de Administrador
                </h3>
                <div className="space-y-2 text-purple-700">
                  <p>✅ Gestión completa de usuarios</p>
                  <p>✅ Crear, editar y eliminar usuarios</p>
                  <p>✅ Asignar y cambiar roles</p>
                  <p>✅ Estadísticas del sistema</p>
                  <p>✅ Vista general de la plataforma</p>
                </div>
              </div>
            </div>
          )}

          {profile.role === 'company' && (
            <div className="space-y-6">
              {/* Botones principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => (window.location.href = '/templates')}
                  className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-left"
                >
                  <div className="text-4xl mb-3">📋</div>
                  <h3 className="text-xl font-bold mb-2">Mis Templates</h3>
                  <p className="text-sm opacity-90">
                    Ver y gestionar templates creados
                  </p>
                </button>

                <button
                  onClick={() => (window.location.href = '/designer')}
                  className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-left"
                >
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="text-xl font-bold mb-2">Diseñador Visual</h3>
                  <p className="text-sm opacity-90">
                    Crear nuevo template de certificado
                  </p>
                </button>

                <button
                  onClick={() => (window.location.href = '/submissions')}
                  className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl text-left"
                >
                  <div className="text-4xl mb-3">📬</div>
                  <h3 className="text-xl font-bold mb-2">
                    Formularios Recibidos
                  </h3>
                  <p className="text-sm opacity-90">
                    Revisar y aprobar solicitudes
                  </p>
                </button>

                <button
                  onClick={() => (window.location.href = '/submissions')}
                  className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-xl font-bold mb-2">Estadísticas</h3>
                  <p className="text-sm opacity-90">Próximamente...</p>
                </button>
              </div>

              {/* Info Panel */}
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2 text-blue-700">
                  <Analytics client:load />
                </div>
              </div>
            </div>
          )}

          {profile.role === 'client' && (
            <div className="space-y-6">
              {/* Botones principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AvailableTemplates />

                <button
                  onClick={() => (window.location.href = '/my-submissions')}
                  className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl text-left"
                >
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-xl font-bold mb-2">Mis Certificados</h3>
                  <p className="text-sm opacity-90">
                    Ver estado de mis solicitudes
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Under Construction */}
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚧</div>
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-2">
                  Dashboard en construcción
                </h3>
                <p className="text-orange-700 mb-4">
                  Estamos desarrollando tu panel de control personalizado con
                  todas las funcionalidades.
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    🎨 Ver demo del diseñador
                  </button>
                  <button className="px-4 py-2 bg-white text-orange-700 rounded-lg hover:bg-orange-50 transition-colors border border-orange-300">
                    📊 Ver estadísticas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
