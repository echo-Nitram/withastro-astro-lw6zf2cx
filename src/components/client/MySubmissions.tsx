import { useState, useEffect } from 'react';
import { getClientSubmissions, getTemplateById } from '../../lib/templates';
import { getCurrentUser } from '../../lib/supabase';
import { generatePDF, downloadPDF } from '../../lib/pdfGenerator';

interface Submission {
  id: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  templates: {
    name: string;
    title_es: string;
  };
  form_data: any;
}

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    try {
      setLoading(true);
      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario');
      }

      const data = await getClientSubmissions(user.id);
      setSubmissions(data || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF(submission: Submission) {
    try {
      setLoading(true);

      // Obtener template completo
      const templateData = await getTemplateById(submission.templates.id);

      // Obtener nombre del usuario actual
      const { user } = await getCurrentUser();
      const userName =
        user?.user_metadata?.full_name || user?.email || 'Usuario';

      // Generar PDF
      const pdfBlob = await generatePDF(
        templateData,
        submission.form_data,
        userName
      );

      // Descargar
      const filename = `${submission.templates.name.replace(
        /\s+/g,
        '_'
      )}_${Date.now()}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('❌ Error al descargar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          icon: '⏳',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'reviewed':
        return {
          label: 'En Revisión',
          icon: '👀',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'approved':
        return {
          label: 'Aprobado',
          icon: '✅',
          color: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          icon: '❌',
          color: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          label: status,
          icon: '❓',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  }

  const filteredSubmissions =
    filter === 'all'
      ? submissions
      : submissions.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Cargando tus envíos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800 mb-4">❌ Error: {error}</p>
        <button
          onClick={loadSubmissions}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Mis Certificados
          </h2>
          <p className="text-gray-600">
            {submissions.length} solicitud{submissions.length !== 1 ? 'es' : ''}{' '}
            enviada{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos ({submissions.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⏳ Pendientes (
          {submissions.filter((s) => s.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✅ Aprobados (
          {submissions.filter((s) => s.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ❌ Rechazados (
          {submissions.filter((s) => s.status === 'rejected').length})
        </button>
      </div>

      {/* Lista */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-8xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'all'
              ? 'No has enviado ningún formulario aún'
              : `No tienes solicitudes ${getStatusConfig(
                  filter
                ).label.toLowerCase()}`}
          </h3>
          <p className="text-gray-600 mb-6">
            Llena un formulario para solicitar tu certificado
          </p>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ver Formularios Disponibles
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const statusConfig = getStatusConfig(submission.status);

            return (
              <div
                key={submission.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {submission.templates.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enviado: {formatDate(submission.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${statusConfig.color}`}
                  >
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                </div>

                {submission.reviewed_at && (
                  <p className="text-sm text-gray-500 mb-4">
                    Revisado: {formatDate(submission.reviewed_at)}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      (window.location.href = `/submission/${submission.id}`)
                    }
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    👁️ Ver Detalles
                  </button>

                  {submission.status === 'approved' && (
                    <button
                      onClick={() => handleDownloadPDF(submission)}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      📄 Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
