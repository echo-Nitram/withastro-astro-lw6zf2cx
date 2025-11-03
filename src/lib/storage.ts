import { supabase } from './supabase';

// ======================================
// 📦 GESTIÓN DE ALMACENAMIENTO CON SUPABASE STORAGE
// ======================================

// Configuración de límites
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_BACKGROUND_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_CERTIFICATE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
];
const ALLOWED_PDF_TYPES = ['application/pdf'];

// ======================================
// 🖼️ FUNCIONES PARA LOGOS
// ======================================

/**
 * Subir un logo a Supabase Storage
 */
export async function uploadLogo(
  file: File,
  userId: string,
  position: 'left' | 'right'
): Promise<string> {
  try {
    // Validar tamaño
    if (file.size > MAX_LOGO_SIZE) {
      throw new Error(
        `El logo debe ser menor a ${MAX_LOGO_SIZE / 1024 / 1024}MB`
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Solo se permiten imágenes PNG, JPG, SVG o WebP');
    }

    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${position}_${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('logos').getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    throw new Error(error.message || 'Error al subir el logo');
  }
}

/**
 * Eliminar un logo
 */
export async function deleteLogo(logoUrl: string): Promise<void> {
  try {
    // Extraer el path del archivo desde la URL
    const urlParts = logoUrl.split('/logos/');
    if (urlParts.length < 2) {
      throw new Error('URL de logo inválida');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from('logos').remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    throw new Error(error.message || 'Error al eliminar el logo');
  }
}

// ======================================
// 🎨 FUNCIONES PARA FONDOS
// ======================================

/**
 * Subir una imagen de fondo
 */
export async function uploadBackground(
  file: File,
  userId: string
): Promise<string> {
  try {
    // Validar tamaño
    if (file.size > MAX_BACKGROUND_SIZE) {
      throw new Error(
        `El fondo debe ser menor a ${MAX_BACKGROUND_SIZE / 1024 / 1024}MB`
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Solo se permiten imágenes PNG, JPG o WebP');
    }

    // Crear nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/bg_${Date.now()}.${fileExt}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('backgrounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('backgrounds').getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading background:', error);
    throw new Error(error.message || 'Error al subir el fondo');
  }
}

/**
 * Eliminar una imagen de fondo
 */
export async function deleteBackground(backgroundUrl: string): Promise<void> {
  try {
    const urlParts = backgroundUrl.split('/backgrounds/');
    if (urlParts.length < 2) {
      throw new Error('URL de fondo inválida');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('backgrounds')
      .remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting background:', error);
    throw new Error(error.message || 'Error al eliminar el fondo');
  }
}

// ======================================
// 📄 FUNCIONES PARA CERTIFICADOS (PDFs)
// ======================================

/**
 * Subir un PDF firmado
 */
export async function uploadSignedPDF(
  file: File,
  submissionId: string,
  userId: string
): Promise<string> {
  try {
    // Validar tamaño
    if (file.size > MAX_CERTIFICATE_SIZE) {
      throw new Error(
        `El PDF debe ser menor a ${MAX_CERTIFICATE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validar tipo
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      throw new Error('Solo se permiten archivos PDF');
    }

    // Crear nombre único
    const fileName = `${userId}/submission_${submissionId}_signed_${Date.now()}.pdf`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('certificates').getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading signed PDF:', error);
    throw new Error(error.message || 'Error al subir el PDF firmado');
  }
}

/**
 * Eliminar un certificado PDF
 */
export async function deleteCertificate(certificateUrl: string): Promise<void> {
  try {
    const urlParts = certificateUrl.split('/certificates/');
    if (urlParts.length < 2) {
      throw new Error('URL de certificado inválida');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('certificates')
      .remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting certificate:', error);
    throw new Error(error.message || 'Error al eliminar el certificado');
  }
}

// ======================================
// 🔧 FUNCIONES UTILITARIAS
// ======================================

/**
 * Obtener URL pública de un archivo
 */
export function getPublicUrl(
  bucket: 'logos' | 'backgrounds' | 'certificates',
  filePath: string
): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

/**
 * Listar archivos de un usuario
 */
export async function listUserFiles(
  bucket: 'logos' | 'backgrounds' | 'certificates',
  userId: string
) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error listing files:', error);
    return { data: null, error };
  }
}

/**
 * Validar archivo antes de subir
 */
export function validateFile(
  file: File,
  type: 'logo' | 'background' | 'certificate'
): { valid: boolean; error?: string } {
  // Validar tamaño
  const maxSizes = {
    logo: MAX_LOGO_SIZE,
    background: MAX_BACKGROUND_SIZE,
    certificate: MAX_CERTIFICATE_SIZE,
  };

  if (file.size > maxSizes[type]) {
    return {
      valid: false,
      error: `El archivo debe ser menor a ${maxSizes[type] / 1024 / 1024}MB`,
    };
  }

  // Validar tipo
  const allowedTypes =
    type === 'certificate' ? ALLOWED_PDF_TYPES : ALLOWED_IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(
        ', '
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Convertir archivo a base64 (para preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Obtener información de un archivo
 */
export async function getFileInfo(
  bucket: 'logos' | 'backgrounds' | 'certificates',
  filePath: string
) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(filePath);

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting file info:', error);
    return { data: null, error };
  }
}

// ======================================
// 📊 EXPORTAR CONFIGURACIÓN
// ======================================

export const storageConfig = {
  buckets: {
    logos: 'logos',
    backgrounds: 'backgrounds',
    certificates: 'certificates',
  },
  maxSizes: {
    logo: MAX_LOGO_SIZE,
    background: MAX_BACKGROUND_SIZE,
    certificate: MAX_CERTIFICATE_SIZE,
  },
  allowedTypes: {
    images: ALLOWED_IMAGE_TYPES,
    pdfs: ALLOWED_PDF_TYPES,
  },
};
