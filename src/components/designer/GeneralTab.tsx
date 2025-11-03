import type { CertificateTemplate } from '../../types';

interface GeneralTabProps {
  template: CertificateTemplate;
  onChange: (updates: Partial<CertificateTemplate>) => void;
}

export default function GeneralTab({ template, onChange }: GeneralTabProps) {
  const handleChange = (field: keyof CertificateTemplate, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📝 Información General
        </h2>
      </div>

      {/* Nombre del Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Template *
        </label>
        <input
          type="text"
          value={template.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej: Certificado Halal"
          className="input-field"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Nombre interno para identificar este template
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          value={template.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descripción breve del certificado..."
          className="input-field"
          rows={3}
        />
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🌍 Títulos Multiidioma
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Configura los títulos en los 3 idiomas soportados
        </p>
      </div>

      {/* Título Español */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🇪🇸 Título en Español *
        </label>
        <input
          type="text"
          value={template.title_es}
          onChange={(e) => handleChange('title_es', e.target.value)}
          placeholder="CERTIFICADO PROFESIONAL"
          className="input-field"
          required
        />
      </div>

      {/* Subtítulo Español */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo en Español
        </label>
        <input
          type="text"
          value={template.subtitle_es}
          onChange={(e) => handleChange('subtitle_es', e.target.value)}
          placeholder="Documento oficial de certificación"
          className="input-field"
        />
      </div>

      {/* Título Inglés */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🇬🇧 Título en Inglés *
        </label>
        <input
          type="text"
          value={template.title_en}
          onChange={(e) => handleChange('title_en', e.target.value)}
          placeholder="PROFESSIONAL CERTIFICATE"
          className="input-field"
          required
        />
      </div>

      {/* Subtítulo Inglés */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo en Inglés
        </label>
        <input
          type="text"
          value={template.subtitle_en}
          onChange={(e) => handleChange('subtitle_en', e.target.value)}
          placeholder="Official certification document"
          className="input-field"
        />
      </div>

      {/* Título Árabe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🇸🇦 Título en Árabe *
        </label>
        <input
          type="text"
          value={template.title_ar}
          onChange={(e) => handleChange('title_ar', e.target.value)}
          placeholder="شهادة احترافية"
          className="input-field"
          dir="rtl"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          El texto árabe se mostrará de derecha a izquierda automáticamente
        </p>
      </div>

      {/* Subtítulo Árabe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo en Árabe
        </label>
        <input
          type="text"
          value={template.subtitle_ar}
          onChange={(e) => handleChange('subtitle_ar', e.target.value)}
          placeholder="وثيقة شهادة رسمية"
          className="input-field"
          dir="rtl"
        />
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Los campos marcados con * son obligatorios.
          Asegúrate de completar los títulos en los 3 idiomas antes de guardar.
        </p>
      </div>
    </div>
  );
}
