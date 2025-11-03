import { useState } from 'react';
import { generatePDF } from '../../lib/pdfGenerator';
import { initiateSignatureMock } from '../../lib/firmaGubUyMock';
import type { CertificateTemplate } from '../../types';

interface SignatureModalProps {
  submission: any;
  template: CertificateTemplate;
  onClose: () => void;
}

export default function SignatureModal({
  submission,
  template,
  onClose,
}: SignatureModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Generar PDF
      const pdfBlob = await generatePDF(
        template,
        submission.form_data || submission.data,
        submission.profiles?.full_name || 'Cliente'
      );

      // 2. Iniciar proceso de firma MOCK
      const fileName = `${template.name}_${submission.id}.pdf`;
      const transaction = await initiateSignatureMock(
        submission.id,
        pdfBlob,
        fileName
      );

      // 3. Redirigir a página de firma simulada
      window.location.href = transaction.redirectUrl;
    } catch (err: any) {
      console.error('Error al iniciar firma:', err);
      setError('Error al iniciar el proceso de firma: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ✍️ Firmar Certificado
        </h2>

        <div className="space-y-4">
          {/* Badge de MOCK */}
          <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-300">
            <p className="text-sm font-bold text-yellow-800 flex items-center gap-2">
              ⚠️ MODO SIMULACIÓN
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Esta es una demostración. No requiere cédula real.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Firma Digital Simulada</strong>
            </p>
            <p className="text-xs text-blue-700 mt-2">
              En producción usarías tu{' '}
              <strong>Cédula de Identidad Digital</strong> real. Por ahora,
              simularemos el proceso completo.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              📄 Documento: {template.name}
            </p>
            <p className="text-sm text-gray-600">
              👤 Cliente: {submission.profiles?.full_name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              📅 Fecha: {new Date().toLocaleDateString('es-UY')}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSign}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? '⏳ Procesando...' : '✍️ Firmar (MOCK)'}
          </button>
        </div>
      </div>
    </div>
  );
}
