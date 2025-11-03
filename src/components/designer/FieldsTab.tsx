import { useState } from 'react';
import type { FormField } from '../../types';

interface FieldsTabProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export default function FieldsTab({ fields, onChange }: FieldsTabProps) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fieldTypes = [
    { value: 'text', label: '📝 Texto', icon: '📝' },
    { value: 'email', label: '📧 Email', icon: '📧' },
    { value: 'number', label: '🔢 Número', icon: '🔢' },
    { value: 'date', label: '📅 Fecha', icon: '📅' },
    { value: 'textarea', label: '📄 Área de Texto', icon: '📄' },
    { value: 'select', label: '📋 Selección', icon: '📋' },
    { value: 'checkbox', label: '☑️ Checkbox', icon: '☑️' },
  ];

  const createNewField = (): FormField => ({
    id: `field_${Date.now()}`,
    type: 'text',
    label_es: '',
    label_en: '',
    label_ar: '',
    placeholder: '',
    required: false,
    options: [],
    order: fields.length,
  });

  const handleAddField = () => {
    setEditingField(createNewField());
    setShowAddModal(true);
  };

  const handleSaveField = () => {
    if (!editingField) return;

    if (
      !editingField.label_es ||
      !editingField.label_en ||
      !editingField.label_ar
    ) {
      alert('Debes completar las etiquetas en los 3 idiomas');
      return;
    }

    const existingIndex = fields.findIndex((f) => f.id === editingField.id);

    if (existingIndex >= 0) {
      // Actualizar existente
      const newFields = [...fields];
      newFields[existingIndex] = editingField;
      onChange(newFields);
    } else {
      // Agregar nuevo con order
      const newFieldWithOrder = {
        ...editingField,
        order: fields.length,
      };
      onChange([...fields, newFieldWithOrder]);
    }

    setShowAddModal(false);
    setEditingField(null);
  };

  const handleEditField = (field: FormField) => {
    setEditingField({ ...field });
    setShowAddModal(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('¿Estás seguro de eliminar este campo?')) {
      const newFields = fields
        .filter((f) => f.id !== fieldId)
        .map((field, idx) => ({ ...field, order: idx }));
      onChange(newFields);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < fields.length) {
      // Intercambiar posiciones
      [newFields[index], newFields[newIndex]] = [
        newFields[newIndex],
        newFields[index],
      ];

      // Actualizar order de todos los campos
      const reorderedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx,
      }));

      onChange(reorderedFields);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            📋 Campos del Formulario
          </h2>
          <p className="text-sm text-gray-600">
            {fields.length} campo{fields.length !== 1 ? 's' : ''} configurado
            {fields.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddField}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          ➕ Agregar Campo
        </button>
      </div>

      {/* Lista de Campos */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-600 mb-4">No hay campos agregados</p>
          <button
            onClick={handleAddField}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Agregar Primer Campo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {fieldTypes.find((t) => t.value === field.type)?.icon ||
                        '📝'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {field.label_es}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {fieldTypes.find((t) => t.value === field.type)?.label}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                    <p>🇬🇧 {field.label_en}</p>
                    <p dir="rtl">🇸🇦 {field.label_ar}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveField(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-gray-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => handleMoveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="px-2 py-1 text-gray-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleEditField(field)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar/Editar Campo */}
      {showAddModal && editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {fields.find((f) => f.id === editingField.id)
                  ? '✏️ Editar Campo'
                  : '➕ Nuevo Campo'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Tipo de Campo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Campo *
                </label>
                <select
                  value={editingField.type}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      type: e.target.value as any,
                    })
                  }
                  className="input-field"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Etiquetas Trilingües */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  🌍 Etiquetas (Multiidioma)
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇪🇸 Etiqueta en Español *
                    </label>
                    <input
                      type="text"
                      value={editingField.label_es}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          label_es: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="Nombre del Exportador"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇬🇧 Etiqueta en Inglés *
                    </label>
                    <input
                      type="text"
                      value={editingField.label_en}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          label_en: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="Exporter Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇸🇦 Etiqueta en Árabe *
                    </label>
                    <input
                      type="text"
                      value={editingField.label_ar}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          label_ar: e.target.value,
                        })
                      }
                      className="input-field"
                      dir="rtl"
                      placeholder="اسم المصدر"
                    />
                  </div>
                </div>
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de Ayuda (Placeholder)
                </label>
                <input
                  type="text"
                  value={editingField.placeholder || ''}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      placeholder: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Ingrese el nombre..."
                />
              </div>

              {/* Opciones para Select */}
              {editingField.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opciones (una por línea)
                  </label>
                  <textarea
                    value={(editingField.options || []).join('\n')}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value
                          .split('\n')
                          .filter((o) => o.trim()),
                      })
                    }
                    className="input-field"
                    rows={5}
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                  />
                </div>
              )}

              {/* Campo Requerido */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={editingField.required}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      required: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600"
                />
                <label
                  htmlFor="required"
                  className="text-sm font-medium text-gray-700"
                >
                  Campo obligatorio (requerido)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingField(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveField}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                💾 Guardar Campo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Usa las flechas ⬆️⬇️ para reordenar los
          campos. El orden aquí será el mismo en el formulario.
        </p>
      </div>
    </div>
  );
}
