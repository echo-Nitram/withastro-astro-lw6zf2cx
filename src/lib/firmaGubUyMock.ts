import { supabase } from './supabase';
import jsPDF from 'jspdf';

/**
 * MOCK de firma.gub.uy para desarrollo
 * Simula el proceso completo de firma digital
 */

export interface FirmaTransaction {
  transactionId: string;
  redirectUrl: string;
  documents: string[];
}

/**
 * Simula inicio de proceso de firma
 */
export async function initiateSignatureMock(
  submissionId: string,
  pdfBlob: Blob,
  documentName: string
): Promise<FirmaTransaction> {
  try {
    // Generar ID de transacción simulado
    const transactionId = `MOCK_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Actualizar estado en BD
    await supabase
      .from('submissions')
      .update({
        signature_transaction_id: transactionId,
        signature_status: 'signing',
        status: 'signing',
      })
      .eq('id', submissionId);

    // Guardar PDF temporalmente para el proceso de firma
    const fileName = `temp_${submissionId}_${Date.now()}.pdf`;
    const arrayBuffer = await pdfBlob.arrayBuffer();

    await supabase.storage
      .from('temp-signatures')
      .upload(fileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    // URL de la página de firma simulada
    const baseUrl = window.location.origin;
    const redirectUrl =
      `${baseUrl}/mock-firma?` +
      `transactionId=${transactionId}&` +
      `submissionId=${submissionId}&` +
      `fileName=${fileName}&` +
      `documentName=${encodeURIComponent(documentName)}`;

    return {
      transactionId,
      redirectUrl,
      documents: [documentName],
    };
  } catch (error) {
    console.error('Error initiating mock signature:', error);
    throw error;
  }
}

/**
 * Procesa la firma simulada y genera PDF con marca de agua "FIRMADO"
 */
export async function processSignatureMock(
  transactionId: string,
  submissionId: string,
  tempFileName: string,
  signerName: string
): Promise<string> {
  try {
    // 1. Descargar PDF temporal
    const { data: tempPdf, error: downloadError } = await supabase.storage
      .from('temp-signatures')
      .download(tempFileName);

    if (downloadError) throw downloadError;

    // 2. Agregar marca de "FIRMADO DIGITALMENTE"
    const signedBlob = await addSignatureStamp(tempPdf, signerName);

    // 3. Guardar PDF firmado
    const signedFileName = `signed_${submissionId}_${Date.now()}.pdf`;
    const arrayBuffer = await signedBlob.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('signed-certificates')
      .upload(signedFileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('signed-certificates')
      .getPublicUrl(signedFileName);

    // 5. Actualizar submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        signature_status: 'completed',
        status: 'signed',
        signed_pdf_url: urlData.publicUrl,
        signed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // 6. Limpiar archivo temporal
    await supabase.storage.from('temp-signatures').remove([tempFileName]);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error processing mock signature:', error);

    // Marcar como error
    await supabase
      .from('submissions')
      .update({
        signature_status: 'error',
        status: 'error',
      })
      .eq('id', submissionId);

    throw error;
  }
}

/**
 * Agrega marca visual de "FIRMADO DIGITALMENTE" al PDF
 */
async function addSignatureStamp(
  originalBlob: Blob,
  signerName: string
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear canvas para renderizar el PDF original
      const arrayBuffer = await originalBlob.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);

      // Crear nuevo PDF con jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Cargar PDF original como imagen
      const base64 = await blobToBase64(originalBlob);
      pdf.addImage(base64, 'PNG', 0, 0, 210, 297);

      // Agregar página de firma digital
      pdf.addPage();

      // Fondo azul claro
      pdf.setFillColor(240, 248, 255);
      pdf.rect(0, 0, 210, 297, 'F');

      // Borde decorativo
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(2);
      pdf.rect(10, 10, 190, 277);

      // Logo/Sello (simulado)
      pdf.setFillColor(59, 130, 246);
      pdf.circle(105, 50, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('✓', 105, 55, { align: 'center' });

      // Título
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(28);
      pdf.setFont(undefined, 'bold');
      pdf.text('DOCUMENTO FIRMADO DIGITALMENTE', 105, 85, { align: 'center' });

      // Línea decorativa
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(30, 95, 180, 95);

      // Información de la firma
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(75, 85, 99);

      const signatureDate = new Date().toLocaleString('es-UY', {
        dateStyle: 'full',
        timeStyle: 'long',
      });

      pdf.text('CERTIFICADO DE FIRMA DIGITAL', 105, 115, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Firmante: ${signerName}`, 30, 135);
      pdf.text(`Fecha y Hora: ${signatureDate}`, 30, 145);
      pdf.text(`ID de Transacción: MOCK-${Date.now()}`, 30, 155);
      pdf.text(`Método: Cédula de Identidad Digital (MOCK)`, 30, 165);

      // Recuadro de validación
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(30, 180, 150, 30, 3, 3, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('✓ FIRMA VÁLIDA', 105, 192, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Este documento ha sido firmado digitalmente', 105, 200, {
        align: 'center',
      });

      // Información técnica
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.text('INFORMACIÓN TÉCNICA DE LA FIRMA', 30, 225);

      pdf.setFontSize(8);
      const techInfo = [
        'Algoritmo: SHA-256 with RSA',
        'Formato: PAdES (PDF Advanced Electronic Signatures)',
        'Nivel: B-B (Basic Building Blocks)',
        'Emisor: Sistema CERTIA - Gestión de Certificados',
        'Hash del documento: ' + generateMockHash(),
      ];

      let yPos = 235;
      techInfo.forEach((info) => {
        pdf.text(`• ${info}`, 35, yPos);
        yPos += 7;
      });

      // Advertencia de MOCK
      pdf.setFillColor(255, 243, 205);
      pdf.roundedRect(30, 270, 150, 12, 2, 2, 'F');
      pdf.setTextColor(180, 83, 9);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.text('⚠ FIRMA SIMULADA - SOLO PARA DESARROLLO', 105, 278, {
        align: 'center',
      });

      // Convertir a Blob
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Cancela proceso de firma
 */
export async function cancelSignatureMock(submissionId: string): Promise<void> {
  await supabase
    .from('submissions')
    .update({
      signature_status: 'cancelled',
      status: 'approved', // Volver a aprobado
    })
    .eq('id', submissionId);
}

// Utilidades
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
    .join('')
    .toUpperCase();
}
