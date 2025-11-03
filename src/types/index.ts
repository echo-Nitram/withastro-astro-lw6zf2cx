// Roles de usuario
export type UserRole = 'admin' | 'company' | 'client';

// Usuario
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

// Idiomas soportados
export type Language = 'es' | 'en' | 'ar';

// Template de certificado
export interface Template {
  id: string;
  company_id: string;
  name: string;
  title_es?: string;
  title_en?: string;
  title_ar?: string;
  subtitle_es?: string;
  subtitle_en?: string;
  subtitle_ar?: string;
  design: TemplateDesign;
  fields: TemplateField[];
  created_at: string;
  updated_at: string;
}

// Diseño del template
export interface TemplateDesign {
  logo_left?: string;
  logo_right?: string;
  border_style?: 'solid' | 'double' | 'ridge' | 'none';
  border_color?: string;
  border_width?: number;
  background_color?: string;
  columns?: 1 | 2 | 3;
}

// Campo del formulario
export interface TemplateField {
  id: string;
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'checkbox';
  label_es: string;
  label_en: string;
  label_ar: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para select
  order: number;
}

// Envío de formulario
export interface Submission {
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
  data: Record<string, any>; // o 'data' si usas ese nombre
  notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;

  // ✨ AGREGAR ESTOS CAMPOS:
  signature_status?: string;
  signature_transaction_id?: string;
  signed_pdf_url?: string;
  signed_at?: string;
  signed_by?: string;

  // Relaciones
  templates?: {
    name: string;
    title_es: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

// === TIPOS ADICIONALES PARA EL DISEÑADOR ===

// Diseño del template
export interface TemplateDesign {
  logo_left?: string;
  logo_right?: string;
  background_color: string;
  background_image?: string; // Nueva: imagen de fondo
  background_opacity?: number; // Nueva: opacidad de la imagen
  columns: 1 | 2 | 3;
}

// Campo individual del formulario
export interface FormField {
  id: string;
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'checkbox';
  label_es: string;
  label_en: string;
  label_ar: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para select
  order: number;
}

// Template completo
export interface CertificateTemplate {
  id?: string;
  name: string;
  description?: string;

  // Títulos
  title_es: string;
  title_en: string;
  title_ar: string;

  // Subtítulos
  subtitle_es: string;
  subtitle_en: string;
  subtitle_ar: string;

  // Diseño y campos
  design: TemplateDesign;
  fields: FormField[];

  // Metadata
  is_active: boolean;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}
