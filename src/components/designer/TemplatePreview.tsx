import type { CertificateTemplate } from '../../types';

interface Props {
  template: CertificateTemplate;
}

export default function TemplatePreview({ template }: Props) {
  const { design, fields } = template;

  return (
    <div className="w-full">
      {/* A4 Container */}
      <div
        className="mx-auto shadow-2xl relative overflow-hidden"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: design.background_color,
          padding: '20mm',
          transform: 'scale(0.6)',
          transformOrigin: 'top center',
        }}
      >
        {/* Imagen de Fondo (Marca de Agua) */}
        {design.background_image && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: design.background_opacity || 0.3,
            }}
          >
            <img
              src={design.background_image}
              alt="Fondo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {/* Contenido Principal (encima del fondo) */}
        <div className="relative z-10">
          {/* Header con Logos */}
          <div className="flex justify-between items-start mb-8">
            {/* Logo Izquierdo */}
            <div className="w-24 h-24">
              {design.logo_left && (
                <img
                  src={design.logo_left}
                  alt="Logo izquierdo"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Títulos Centrales */}
            <div className="flex-1 text-center px-8">
              {/* Título Árabe */}
              {template.title_ar && (
                <h1
                  className="text-2xl font-bold mb-2"
                  dir="rtl"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {template.title_ar}
                </h1>
              )}

              {/* Título Español */}
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {template.title_es}
              </h1>

              {/* Título Inglés */}
              {template.title_en && (
                <h2 className="text-xl font-semibold text-gray-700 mb-3">
                  {template.title_en}
                </h2>
              )}

              {/* Subtítulos */}
              {template.subtitle_es && (
                <p className="text-sm text-gray-600">{template.subtitle_es}</p>
              )}
            </div>

            {/* Logo Derecho */}
            <div className="w-24 h-24">
              {design.logo_right && (
                <img
                  src={design.logo_right}
                  alt="Logo derecho"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Línea Decorativa */}
          <div className="h-1 mb-8 bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500" />

          {/* Campos del Formulario */}
          {fields.length > 0 ? (
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${design.columns}, 1fr)`,
              }}
            >
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {field.label_es}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  {/* Campo según tipo */}
                  {field.type === 'textarea' ? (
                    <div className="border-2 border-gray-300 rounded p-3 h-24 bg-white">
                      <p className="text-gray-400 text-sm">
                        {field.placeholder || 'Texto largo...'}
                      </p>
                    </div>
                  ) : field.type === 'select' ? (
                    <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white">
                      <p className="text-gray-400 text-sm">
                        {field.options && field.options.length > 0
                          ? field.options[0]
                          : 'Seleccionar...'}
                      </p>
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                      <span className="text-sm text-gray-600">
                        {field.placeholder || 'Opción'}
                      </span>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white">
                      <p className="text-gray-400 text-sm">
                        {field.placeholder ||
                          `Ingrese ${field.label_es.toLowerCase()}...`}
                      </p>
                    </div>
                  )}

                  {/* Etiquetas en otros idiomas (pequeñas) */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>🇬🇧 {field.label_en}</p>
                    <p className="text-right" dir="rtl">
                      🇸🇦 {field.label_ar}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg">Agrega campos en la pestaña "Campos"</p>
              <p className="text-sm">
                Los campos aparecerán aquí automáticamente
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <div className="text-center text-sm text-gray-600">
              <p className="font-semibold">
                Sistema de Gestión de Certificados CERTIA
              </p>
              <p className="text-xs mt-1">Documento generado automáticamente</p>
            </div>
          </div>
        </div>{' '}
        {/* Fin del contenido principal */}
      </div>{' '}
      {/* Fin del A4 container */}
      {/* Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>📄 Vista previa a escala 60% del tamaño A4 real</p>
      </div>
    </div>
  );
}
