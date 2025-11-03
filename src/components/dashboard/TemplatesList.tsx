import { useState, useEffect } from 'react';
import {
  getCompanyTemplates,
  deleteTemplate,
  toggleTemplateActive,
} from '../../lib/templates';
import { getCurrentUser } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  fields: any[];
}

export default function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario');
      }

      const data = await getCompanyTemplates(user.id);
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el template "${name}"?`)) {
      return;
    }

    try {
      await deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  async function handleToggleActive(id: string, currentState: boolean) {
    try {
      await toggleTemplateActive(id, !currentState);
      setTemplates(
        templates.map((t) =>
          t.id === id ? { ...t, is_active: !currentState } : t
        )
      );
    } catch (err: any) {
      alert('Error al cambiar estado: ' + err.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800">❌ Error: {error}</p>
        <button
          onClick={loadTemplates}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
          <h2 className="text-2xl font-bold text-gray-900">📋 Mis Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''}{' '}
            creado{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/designer')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          ➕ Crear Nuevo Template
        </button>
      </div>

      {/* Lista */}
      {templates.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-8xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No tienes templates aún
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primer template de certificado profesional
          </p>
          <button
            onClick={() => (window.location.href = '/designer')}
            className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg"
          >
            🎨 Crear Primer Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden"
            >
              {/* Header Card */}
              <div
                className={`p-4 ${
                  template.is_active ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {template.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {template.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                  </span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Body Card */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📝</span>
                    <span>{template.fields?.length || 0} campos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>Creado: {formatDate(template.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      (window.location.href = `/designer?id=${template.id}`)
                    }
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() =>
                      handleToggleActive(template.id, template.is_active)
                    }
                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      template.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={template.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {template.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
