import { useState } from 'react';

// ======================================
// 🎨 PESTAÑA DE DISEÑO MEJORADA
// ======================================

interface DesignTabProps {
  template: any;
  onUpdate: (updates: any) => void;
}

export default function DesignTab({ template, onUpdate }: DesignTabProps) {
  const [activeSection, setActiveSection] = useState<
    'logos' | 'borders' | 'background'
  >('logos');

  // Handlers para actualizar el diseño
  const updateDesign = (updates: Partial<typeof template.design>) => {
    onUpdate({
      design: {
        ...template.design,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Navegación de Secciones */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveSection('logos')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSection === 'logos'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🖼️ Logos
        </button>
        <button
          onClick={() => setActiveSection('borders')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSection === 'borders'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎨 Bordes
        </button>
        <button
          onClick={() => setActiveSection('background')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSection === 'background'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🌈 Fondo
        </button>
      </div>

      {/* SECCIÓN: LOGOS */}
      {activeSection === 'logos' && (
        <div className="card">
          <div className="space-y-6">
            {/* Título */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🖼️ Logos del Certificado
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Sube los logos institucionales o corporativos
              </p>
            </div>

            {/* Logo URLs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Izquierdo (URL)
                </label>
                <input
                  type="text"
                  value={template.design.logoLeft || ''}
                  onChange={(e) => updateDesign({ logoLeft: e.target.value })}
                  placeholder="https://example.com/logo-left.png"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Derecho (URL)
                </label>
                <input
                  type="text"
                  value={template.design.logoRight || ''}
                  onChange={(e) => updateDesign({ logoRight: e.target.value })}
                  placeholder="https://example.com/logo-right.png"
                  className="input"
                />
              </div>
            </div>

            {/* Opciones de Logo */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Opciones de Visualización
              </h4>
              <div className="space-y-4">
                {/* Tamaño de logos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de Logos
                  </label>
                  <select
                    value={template.design.logoSize || 'medium'}
                    onChange={(e) => updateDesign({ logoSize: e.target.value })}
                    className="input"
                  >
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                {/* Posición vertical */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posición Vertical
                  </label>
                  <select
                    value={template.design.logoVerticalAlign || 'top'}
                    onChange={(e) =>
                      updateDesign({ logoVerticalAlign: e.target.value })
                    }
                    className="input"
                  >
                    <option value="top">Superior</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Inferior</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: BORDES */}
      {activeSection === 'borders' && (
        <div className="card">
          <div className="space-y-6">
            {/* Título */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🎨 Bordes Decorativos
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Personaliza los bordes del certificado
              </p>
            </div>

            {/* Habilitar bordes */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableBorder"
                checked={template.design.borderEnabled ?? true}
                onChange={(e) =>
                  updateDesign({ borderEnabled: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="enableBorder"
                className="text-sm font-medium text-gray-700"
              >
                Habilitar bordes decorativos
              </label>
            </div>

            {template.design.borderEnabled !== false && (
              <>
                {/* Estilo de borde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo de Borde
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['solid', 'double', 'ridge'].map((style) => (
                      <button
                        key={style}
                        onClick={() => updateDesign({ borderStyle: style })}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          template.design.borderStyle === style
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div
                          className={`h-12 border-4 border-gray-900 mb-2`}
                          style={{ borderStyle: style as any }}
                        ></div>
                        <span className="text-xs font-medium capitalize">
                          {style === 'solid'
                            ? 'Sólido'
                            : style === 'double'
                            ? 'Doble'
                            : 'Relieve'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color de borde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color del Borde
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={template.design.borderColor || '#2ecc71'}
                      onChange={(e) =>
                        updateDesign({ borderColor: e.target.value })
                      }
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.design.borderColor || '#2ecc71'}
                      onChange={(e) =>
                        updateDesign({ borderColor: e.target.value })
                      }
                      className="input flex-1"
                      placeholder="#2ecc71"
                    />
                  </div>
                </div>

                {/* Ancho de borde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ancho del Borde: {template.design.borderWidth || 3}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={template.design.borderWidth || 3}
                    onChange={(e) =>
                      updateDesign({ borderWidth: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1px</span>
                    <span>20px</span>
                  </div>
                </div>

                {/* Preview de borde */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Vista Previa:</p>
                  <div
                    className="w-full h-24 bg-white rounded"
                    style={{
                      borderStyle: template.design.borderStyle || 'solid',
                      borderColor: template.design.borderColor || '#2ecc71',
                      borderWidth: `${template.design.borderWidth || 3}px`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN: FONDO */}
      {activeSection === 'background' && (
        <div className="space-y-6">
          {/* Imagen de fondo */}
          <div className="card">
            <div className="space-y-6">
              {/* Título */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  🌈 Fondo del Certificado
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Personaliza el fondo con color o imagen
                </p>
              </div>

              {/* Selector de tipo de fondo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Fondo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      updateDesign({
                        backgroundType: 'color',
                        backgroundImage: null,
                      })
                    }
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      template.design.backgroundType !== 'image'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🎨</div>
                    <span className="text-sm font-medium">Color Sólido</span>
                  </button>
                  <button
                    onClick={() => updateDesign({ backgroundType: 'image' })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      template.design.backgroundType === 'image'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🖼️</div>
                    <span className="text-sm font-medium">Imagen</span>
                  </button>
                </div>
              </div>

              {/* Color de fondo */}
              {template.design.backgroundType !== 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color de Fondo
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={template.design.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        updateDesign({ backgroundColor: e.target.value })
                      }
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.design.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        updateDesign({ backgroundColor: e.target.value })
                      }
                      className="input flex-1"
                      placeholder="#ffffff"
                    />
                  </div>

                  {/* Colores predefinidos */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      Colores populares:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { name: 'Blanco', color: '#ffffff' },
                        { name: 'Crema', color: '#f9f9f9' },
                        { name: 'Beige', color: '#f5f5dc' },
                        { name: 'Azul Claro', color: '#e3f2fd' },
                        { name: 'Verde Claro', color: '#e8f5e9' },
                        { name: 'Amarillo Claro', color: '#fffde7' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() =>
                            updateDesign({ backgroundColor: preset.color })
                          }
                          className="group relative"
                          title={preset.name}
                        >
                          <div
                            className="w-10 h-10 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                            style={{ backgroundColor: preset.color }}
                          ></div>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Imagen de fondo */}
              {template.design.backgroundType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de Fondo (URL)
                  </label>
                  <input
                    type="text"
                    value={template.design.backgroundImage || ''}
                    onChange={(e) =>
                      updateDesign({ backgroundImage: e.target.value })
                    }
                    placeholder="https://example.com/background.jpg"
                    className="input"
                  />

                  {/* Opciones de imagen */}
                  {template.design.backgroundImage && (
                    <div className="mt-4 space-y-4">
                      {/* Opacidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opacidad:{' '}
                          {Math.round(
                            (template.design.backgroundOpacity || 1) * 100
                          )}
                          %
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={template.design.backgroundOpacity || 1}
                          onChange={(e) =>
                            updateDesign({
                              backgroundOpacity: parseFloat(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Ajuste */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ajuste de Imagen
                        </label>
                        <select
                          value={template.design.backgroundSize || 'cover'}
                          onChange={(e) =>
                            updateDesign({ backgroundSize: e.target.value })
                          }
                          className="input"
                        >
                          <option value="cover">Cubrir (Cover)</option>
                          <option value="contain">Contener (Contain)</option>
                          <option value="auto">Tamaño Original (Auto)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Layout de columnas */}
          <div className="card">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  📐 Disposición de Campos
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Organiza los campos en columnas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Columnas
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => updateDesign({ columns: cols })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        (template.design.columns || 2) === cols
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex gap-1 justify-center mb-2">
                        {Array.from({ length: cols }).map((_, i) => (
                          <div
                            key={i}
                            className="w-full h-12 bg-gray-300 rounded"
                          ></div>
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {cols} Columna{cols > 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
