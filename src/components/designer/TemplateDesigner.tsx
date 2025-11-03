import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../lib/supabase';
import {
  createTemplate,
  updateTemplate,
  getTemplateById,
} from '../../lib/templates';
import type {
  CertificateTemplate,
  TemplateDesign,
  FormField,
} from '../../types';
import GeneralTab from './GeneralTab';
import DesignTab from './DesignTab';
import FieldsTab from './FieldsTab';
import TemplatePreview from './TemplatePreview';

const initialDesign: TemplateDesign = {
  logo_left: '',
  logo_right: '',
  background_image: '',
  background_opacity: 0.1,
  background_color: '#ffffff',
  border_style: 'none',
  border_color: '#000000',
  border_width: 2,
  columns: 2,
};

export default function TemplateDesigner() {
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'fields'>(
    'general'
  );
  const [template, setTemplate] = useState<CertificateTemplate>({
    id: '',
    name: '',
    description: '',
    title_es: '',
    title_en: '',
    title_ar: '',
    subtitle_es: '',
    subtitle_en: '',
    subtitle_ar: '',
    design: initialDesign,
    fields: [],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('id');

    if (templateId) {
      try {
        const data = await getTemplateById(templateId);

        if (data) {
          setTemplate({
            id: data.id,
            name: data.name,
            description: data.description || '',
            title_es: data.title_es || '',
            title_en: data.title_en || '',
            title_ar: data.title_ar || '',
            subtitle_es: data.subtitle_es || '',
            subtitle_en: data.subtitle_en || '',
            subtitle_ar: data.subtitle_ar || '',
            design: data.design || initialDesign,
            fields: data.fields || [],
            is_active: data.is_active !== undefined ? data.is_active : true,
          });
        }
      } catch (error) {
        console.error('Error loading template:', error);
        setMessage('❌ Error al cargar template');
      }
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Validaciones
      if (!template.name || template.name.trim() === '') {
        throw new Error('El nombre del template es requerido');
      }

      if (!template.title_es || !template.title_en || !template.title_ar) {
        throw new Error('Los títulos en los 3 idiomas son requeridos');
      }

      if (template.fields.length === 0) {
        throw new Error('Debes agregar al menos un campo al formulario');
      }

      // Obtener usuario actual
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario actual');
      }

      // Guardar o actualizar
      if (template.id) {
        // Actualizar existente
        await updateTemplate(template.id, template);
        setMessage('✅ Template actualizado exitosamente');
      } else {
        // Crear nuevo
        const newTemplate = await createTemplate(template, user.id);
        setTemplate((prev) => ({ ...prev, id: newTemplate.id }));
        setMessage('✅ Template creado exitosamente');
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setMessage('❌ Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleFieldsChange = (newFields: FormField[]) => {
    setTemplate((prev) => ({ ...prev, fields: newFields }));
  };

  const handleDesignChange = (newDesign: Partial<TemplateDesign>) => {
    setTemplate((prev) => ({
      ...prev,
      design: { ...prev.design, ...newDesign },
    }));
  };

  const handleGeneralChange = (updates: Partial<CertificateTemplate>) => {
    setTemplate((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {template.id ? '✏️ Editar Template' : '🎨 Crear Nuevo Template'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {template.name || 'Sin nombre'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => (window.location.href = '/templates')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar Template'}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.includes('✅')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'general'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 General
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'design'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎨 Diseño
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'fields'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Campos ({template.fields.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {activeTab === 'general' && (
              <GeneralTab template={template} onChange={handleGeneralChange} />
            )}

            {activeTab === 'design' && (
              <DesignTab
                design={template.design}
                onChange={handleDesignChange}
              />
            )}

            {activeTab === 'fields' && (
              <FieldsTab
                fields={template.fields}
                onChange={handleFieldsChange}
              />
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-[152px] lg:self-start">
            <TemplatePreview template={template} />
          </div>
        </div>
      </div>

      {/* Footer Actions (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = '/templates')}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
