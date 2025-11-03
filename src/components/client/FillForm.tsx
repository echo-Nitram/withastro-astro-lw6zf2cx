import { useState, useEffect } from 'react';
import { getTemplateById } from '../../lib/templates';
import { createSubmission } from '../../lib/templates';
import { getCurrentUser } from '../../lib/supabase';
import type { CertificateTemplate, FormField } from '../../types';

export default function FillForm() {
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [language, setLanguage] = useState<'es' | 'en' | 'ar'>('es');

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('template');

      if (!templateId) {
        throw new Error('No se especificó el template');
      }

      const data = await getTemplateById(templateId);
      setTemplate(data);

      // Inicializar formData con valores vacíos
      const initialData: Record<string, any> = {};
      data.fields.forEach((field: FormField) => {
        initialData[field.id] = field.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(fieldId: string, value: any) {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function getFieldLabel(field: FormField) {
    switch (language) {
      case 'en':
        return field.label_en;
      case 'ar':
        return field.label_ar;
      default:
        return field.label_es;
    }
  }

  function validateForm() {
    if (!template) return false;

    for (const field of template.fields) {
      if (field.required && !formData[field.id]) {
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario');
      }

      if (!template?.id) {
        throw new Error('Template no válido');
      }

      await createSubmission(template.id, user.id, formData);
      setSuccess(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '/my-submissions';
      }, 2000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: FormField) {
    const label = getFieldLabel(field);
    const value = formData[field.id] || '';
    const isRTL = language === 'ar';

    const commonClasses = `input-field ${isRTL ? 'text-right' : ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={commonClasses}
            rows={4}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className={commonClasses}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              required={field.required}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              {field.placeholder || 'Marcar si aplica'}
            </span>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className={commonClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={commonClasses}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800 mb-4">
          ❌ Error: {error || 'Template no encontrado'}
        </p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-8xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            ¡Formulario Enviado!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu solicitud ha sido enviada exitosamente. La empresa la revisará
            pronto.
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a tus envíos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ✍️ {template.name}
            </h1>
            {template.description && (
              <p className="text-gray-600">{template.description}</p>
            )}
          </div>

          {/* Language Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === 'es'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇪🇸 ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === 'ar'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇸🇦 AR
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>📝 {template.fields.length} campos</span>
          <span>•</span>
          <span>⏱️ ~5-10 minutos</span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-8"
      >
        <div
          className="grid gap-6 mb-8"
          style={{
            gridTemplateColumns: `repeat(${template.design.columns}, 1fr)`,
          }}
        >
          {template.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {getFieldLabel(field)}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => (window.location.href = '/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !validateForm()}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? '⏳ Enviando...' : '📤 Enviar Formulario'}
          </button>
        </div>
      </form>

      {/* Help */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Los campos marcados con * son obligatorios.
          Asegúrate de completarlos antes de enviar.
        </p>
      </div>
    </div>
  );
}
