import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getTemplateById } from '../../lib/templates';
import { generatePDF, downloadPDF } from '../../lib/pdfGenerator';
import SignatureModal from './SignatureModal';
import type { CertificateTemplate } from '../../types';

interface Submission {
  id: string;
  template_id: string;
  client_id: string;
  status:
    | 'pending'
    | 'reviewed'
    | 'approved'
    | 'rejected'
    | 'signing'
    | 'signed'
    | 'error';
  form_data?: any;
  data?: any;
  notes?: string;
  reviewed_at?: string;
  created_at: string;
  signature_status?: string;
  signature_transaction_id?: string;
  signed_pdf_url?: string;
  signed_at?: string;
  templates: {
    name: string;
    title_es: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  reviewed: {
    label: 'Revisado',
    color: 'bg-blue-100 text-blue-800',
    icon: '👁️',
  },
  approved: {
    label: 'Aprobado',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
  signing: {
    label: 'Firmando',
    color: 'bg-purple-100 text-purple-800',
    icon: '✍️',
  },
  signed: {
    label: 'Firmado',
    color: 'bg-emerald-100 text-emerald-800',
    icon: '🔐',
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
};

export default function ReceivedSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [templateData, setTemplateData] = useState<CertificateTemplate | null>(
    null
  );
  const [filter, setFilter] = useState<string>('all');
  const [showSignModal, setShowSignModal] = useState(false);

  useEffect(() => {
    loadSubmissions();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('submissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        () => {
          loadSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Obtener submissions de templates de esta empresa
      const { data, error: fetchError } = await supabase
        .from('submissions')
        .select(
          `
          *,
          templates!inner(name, title_es, company_id),
          profiles!submissions_client_id_fkey(full_name, email)
        `
        )
        .eq('templates.company_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSubmissions(data || []);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError('Error al cargar los formularios: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(submission: Submission) {
    try {
      setSelectedSubmission(submission);

      // Cargar template completo
      const template = await getTemplateById(submission.template_id);
      setTemplateData(template);
    } catch (err: any) {
      console.error('Error loading template:', err);
      alert('Error al cargar los detalles: ' + err.message);
    }
  }

  async function handleUpdateStatus(
    submissionId: string,
    newStatus: 'reviewed' | 'approved' | 'rejected',
    notes?: string
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const updates: any = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      };

      if (notes) {
        updates.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', submissionId);

      if (updateError) throw updateError;

      alert(`✅ Estado actualizado a: ${STATUS_CONFIG[newStatus].label}`);

      // Recargar datos
      await loadSubmissions();

      // Actualizar submission seleccionado
      if (selectedSubmission?.id === submissionId) {
        const updated = submissions.find((s) => s.id === submissionId);
        if (updated) {
          setSelectedSubmission({ ...updated, ...updates });
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('❌ Error al actualizar: ' + err.message);
    }
  }

  async function handleDownloadPDF(submission: Submission) {
    try {
      setLoading(true);

      // Si ya tiene PDF firmado, descargar ese
      if (submission.signed_pdf_url) {
        window.open(submission.signed_pdf_url, '_blank');
        return;
      }

      // Si no, generar PDF normal
      const template = await getTemplateById(submission.template_id);
      const formData = submission.form_data || submission.data;

      const { data: clientData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', submission.client_id)
        .single();

      const clientName =
        clientData?.full_name || clientData?.email || 'Cliente';

      const pdfBlob = await generatePDF(template, formData, clientName);

      const filename = `${template.name.replace(
        /\s+/g,
        '_'
      )}_${clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('❌ Error al descargar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    reviewed: submissions.filter((s) => s.status === 'reviewed').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    signed: submissions.filter((s) => s.status === 'signed').length,
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando formularios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📬 Formularios Recibidos
        </h1>
        <p className="text-gray-600">
          Gestiona y firma los certificados enviados por tus clientes
        </p>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-600">Revisados</p>
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
            <p className="text-sm text-gray-600">Aprobados</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.approved}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-emerald-400">
            <p className="text-sm text-gray-600">Firmados</p>
            <p className="text-2xl font-bold text-emerald-600">
              {stats.signed}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              ⏳ Pendientes ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Aprobados ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('signed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'signed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              🔐 Firmados ({stats.signed})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de Submissions */}
      <div className="max-w-7xl mx-auto">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay formularios{' '}
              {filter !== 'all'
                ? STATUS_CONFIG[
                    filter as keyof typeof STATUS_CONFIG
                  ]?.label.toLowerCase()
                : ''}
            </h3>
            <p className="text-gray-600">
              Los formularios aparecerán aquí cuando los clientes los envíen
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
                onClick={() => handleViewDetails(submission)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.templates.title_es}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          STATUS_CONFIG[submission.status].color
                        }`}
                      >
                        {STATUS_CONFIG[submission.status].icon}{' '}
                        {STATUS_CONFIG[submission.status].label}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        👤 <strong>Cliente:</strong>{' '}
                        {submission.profiles.full_name}
                      </p>
                      <p>
                        📧 <strong>Email:</strong> {submission.profiles.email}
                      </p>
                      <p>
                        📅 <strong>Enviado:</strong>{' '}
                        {new Date(submission.created_at).toLocaleString(
                          'es-UY'
                        )}
                      </p>
                      {submission.signed_at && (
                        <p className="text-green-600 font-medium">
                          🔐 <strong>Firmado:</strong>{' '}
                          {new Date(submission.signed_at).toLocaleString(
                            'es-UY'
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(submission);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Ver Detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedSubmission && templateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {templateData.title_es}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cliente: {selectedSubmission.profiles.full_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setTemplateData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Estado Actual */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado Actual</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                      STATUS_CONFIG[selectedSubmission.status].color
                    }`}
                  >
                    {STATUS_CONFIG[selectedSubmission.status].icon}{' '}
                    {STATUS_CONFIG[selectedSubmission.status].label}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>
                    Recibido:{' '}
                    {new Date(selectedSubmission.created_at).toLocaleString(
                      'es-UY'
                    )}
                  </p>
                  {selectedSubmission.reviewed_at && (
                    <p>
                      Revisado:{' '}
                      {new Date(selectedSubmission.reviewed_at).toLocaleString(
                        'es-UY'
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Datos del Formulario */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Datos del Formulario
                </h3>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${templateData.design.columns}, 1fr)`,
                  }}
                >
                  {templateData.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => {
                      const formData =
                        selectedSubmission.form_data || selectedSubmission.data;
                      const value = formData?.[field.id];

                      return (
                        <div key={field.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label_es}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[44px]">
                            {value || (
                              <span className="text-gray-400">
                                No proporcionado
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            <p>🇬🇧 {field.label_en}</p>
                            <p dir="rtl">🇸🇦 {field.label_ar}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Notas */}
              {selectedSubmission.notes && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📝 Notas</h4>
                  <p className="text-sm text-blue-800">
                    {selectedSubmission.notes}
                  </p>
                </div>
              )}

              {/* Sección de Firma Digital */}
              {selectedSubmission.status === 'approved' &&
                !selectedSubmission.signed_pdf_url && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      ✍️ Firma Digital
                    </h4>
                    <p className="text-sm text-green-800 mb-4">
                      Este certificado está listo para ser firmado digitalmente.
                      La firma garantiza autenticidad e integridad del
                      documento.
                    </p>
                    <button
                      onClick={() => setShowSignModal(true)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                    >
                      ✍️ Firmar Digitalmente
                    </button>
                  </div>
                )}

              {/* Certificado Firmado */}
              {selectedSubmission.signed_pdf_url && (
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300">
                  <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    ✅ Certificado Firmado Digitalmente
                  </h4>
                  <p className="text-sm text-emerald-800 mb-1">
                    Firmado el{' '}
                    {new Date(selectedSubmission.signed_at!).toLocaleString(
                      'es-UY'
                    )}
                  </p>
                  <p className="text-xs text-emerald-700 mb-4">
                    🔐 Documento con firma digital válida
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={selectedSubmission.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      📥 Ver PDF Firmado
                    </a>
                    <button
                      onClick={() => handleDownloadPDF(selectedSubmission)}
                      className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                    >
                      💾 Descargar
                    </button>
                  </div>
                </div>
              )}

              {/* Acciones */}
              {!selectedSubmission.signed_pdf_url && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">🎯 Acciones</h4>

                  <div className="flex flex-wrap gap-3">
                    {selectedSubmission.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              selectedSubmission.id,
                              'reviewed'
                            )
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          👁️ Marcar como Revisado
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt(
                              'Notas de aprobación (opcional):'
                            );
                            handleUpdateStatus(
                              selectedSubmission.id,
                              'approved',
                              notes || undefined
                            );
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Motivo del rechazo:');
                            if (notes) {
                              handleUpdateStatus(
                                selectedSubmission.id,
                                'rejected',
                                notes
                              );
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ❌ Rechazar
                        </button>
                      </>
                    )}

                    {selectedSubmission.status === 'reviewed' && (
                      <>
                        <button
                          onClick={() => {
                            const notes = prompt(
                              'Notas de aprobación (opcional):'
                            );
                            handleUpdateStatus(
                              selectedSubmission.id,
                              'approved',
                              notes || undefined
                            );
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Motivo del rechazo:');
                            if (notes) {
                              handleUpdateStatus(
                                selectedSubmission.id,
                                'rejected',
                                notes
                              );
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ❌ Rechazar
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDownloadPDF(selectedSubmission)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📥 Descargar PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Firma */}
      {showSignModal && selectedSubmission && templateData && (
        <SignatureModal
          submission={selectedSubmission}
          template={templateData}
          onClose={() => setShowSignModal(false)}
        />
      )}
    </div>
  );
}
