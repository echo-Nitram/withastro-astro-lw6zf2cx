import { supabase } from './supabase';
import type { CertificateTemplate } from '../types';

// Obtener todos los templates de la empresa
export async function getCompanyTemplates(companyId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener un template por ID
export async function getTemplateById(id: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Crear nuevo template
export async function createTemplate(
  template: CertificateTemplate,
  companyId: string
) {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      company_id: companyId,
      name: template.name,
      description: template.description,
      title_es: template.title_es,
      title_en: template.title_en,
      title_ar: template.title_ar,
      subtitle_es: template.subtitle_es,
      subtitle_en: template.subtitle_en,
      subtitle_ar: template.subtitle_ar,
      design: template.design,
      fields: template.fields,
      is_active: template.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar template existente
export async function updateTemplate(
  id: string,
  template: Partial<CertificateTemplate>
) {
  const { data, error } = await supabase
    .from('templates')
    .update({
      name: template.name,
      description: template.description,
      title_es: template.title_es,
      title_en: template.title_en,
      title_ar: template.title_ar,
      subtitle_es: template.subtitle_es,
      subtitle_en: template.subtitle_en,
      subtitle_ar: template.subtitle_ar,
      design: template.design,
      fields: template.fields,
      is_active: template.is_active,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar template
export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('templates').delete().eq('id', id);

  if (error) throw error;
}

// Cambiar estado activo/inactivo
export async function toggleTemplateActive(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('templates')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FUNCIONES PARA CLIENTES
// ============================================

// Obtener todos los templates activos (para clientes)
export async function getActiveTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select(
      `
      *,
      profiles:company_id (
        username,
        full_name
      )
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener submissions del cliente
export async function getClientSubmissions(clientId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      *,
      templates (
        id,
        name,
        title_es
      )
    `
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Crear nueva submission
export async function createSubmission(
  templateId: string,
  clientId: string,
  formData: any
) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      template_id: templateId,
      client_id: clientId,
      form_data: formData,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener detalles de una submission
export async function getSubmissionById(id: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      *,
      templates (
        name,
        title_es,
        title_en,
        title_ar,
        design,
        fields
      ),
      profiles:client_id (
        username,
        full_name
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FUNCIONES PARA GESTIÓN DE SUBMISSIONS (EMPRESA)
// ============================================

// Obtener submissions recibidas por la empresa
export async function getCompanySubmissions(companyId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      *,
      templates!inner (
        id,
        name,
        title_es,
        company_id
      ),
      profiles:client_id (
        username,
        full_name,
        email
      )
    `
    )
    .eq('templates.company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Actualizar estado de submission
export async function updateSubmissionStatus(
  submissionId: string,
  status: 'pending' | 'reviewed' | 'approved' | 'rejected',
  notes?: string
) {
  const updateData: any = {
  status,
  reviewed_at: new Date().toISOString(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { data, error } = await supabase
    .from('submissions')
    .update(updateData)
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener estadísticas de submissions
export async function getSubmissionStats(companyId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('status, templates!inner(company_id)')
    .eq('templates.company_id', companyId);

  if (error) throw error;

  const stats = {
    total: data.length,
    pending: data.filter((s) => s.status === 'pending').length,
    reviewed: data.filter((s) => s.status === 'reviewed').length,
    approved: data.filter((s) => s.status === 'approved').length,
    rejected: data.filter((s) => s.status === 'rejected').length,
  };

  return stats;
}
