import { useState, useEffect } from 'react';
import { getActiveTemplates } from '../../lib/templates';

interface Template {
  id: string;
  name: string;
  description: string | null;
  title_es: string;
  fields: any[];
  profiles: {
    username: string;
    full_name: string | null;
  };
  created_at: string;
}

export default function AvailableTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await getActiveTemplates();
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFillForm(templateId: string) {
    window.location.href = `/fill-form?template=${templateId}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando formularios disponibles...</p>
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Formularios Disponibles
        </h2>
        <p className="text-gray-600">
          {templates.length} formulario{templates.length !== 1 ? 's' : ''}{' '}
          disponible{templates.length !== 1 ? 's' : ''} para llenar
        </p>
      </div>

      {/* Lista de Templates */}
      {templates.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-8xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay formularios disponibles
          </h3>
          <p className="text-gray-600">
            Por el momento no hay certificados para llenar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden group"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                <div className="text-4xl mb-3">📄</div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm opacity-90 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🏢</span>
                    <span className="font-medium">
                      {template.profiles?.full_name ||
                        template.profiles?.username ||
                        'Empresa'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📝</span>
                    <span>
                      {template.fields?.length || 0} campos para completar
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🌍</span>
                    <span>Multiidioma (ES/EN/AR)</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleFillForm(template.id)}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium group-hover:scale-105 transform"
                >
                  ✍️ Llenar Formulario
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">💡 ¿Cómo funciona?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Selecciona el formulario que deseas llenar</li>
          <li>2. Completa todos los campos requeridos</li>
          <li>3. Revisa la información y envía</li>
          <li>4. La empresa revisará tu solicitud</li>
          <li>5. Recibirás tu certificado cuando sea aprobado</li>
        </ul>
      </div>
    </div>
  );
}
