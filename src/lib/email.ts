import { Resend } from 'resend';

// ======================================
// 📧 SISTEMA DE NOTIFICACIONES POR EMAIL
// ======================================

// Inicializar Resend con la API key desde variables de entorno
const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Configuración
const FROM_EMAIL = import.meta.env.PUBLIC_EMAIL_FROM;
const APP_URL = import.meta.env.PUBLIC_APP_URL;
const APP_NAME = import.meta.env.PUBLIC_APP_NAME;

// ======================================
// 🎨 TEMPLATES DE EMAIL
// ======================================

/**
 * Template HTML base para todos los emails
 */
function getEmailTemplate(content: string, preheader?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      ${preheader ? `<meta name="description" content="${preheader}">` : ''}
      <title>${APP_NAME}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #0284c7 0%, #7c3aed 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        .content h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
        }
        .content p {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #4b5563;
        }
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid #0284c7;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
        }
        .info-box strong {
          color: #1f2937;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .button:hover {
          background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          margin: 0 5px;
        }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-reviewed { background-color: #dbeafe; color: #1e3a8a; }
        .status-approved { background-color: #dcfce7; color: #166534; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .status-signing { background-color: #fed7aa; color: #9a3412; }
        .status-signed { background-color: #d1fae5; color: #065f46; }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .footer a {
          color: #0284c7;
          text-decoration: none;
        }
        ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          color: #4b5563;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 ${APP_NAME}</h1>
          <p>Sistema de Gestión de Certificados Profesionales</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no responder.</p>
          <p>© ${new Date().getFullYear()} ${APP_NAME} - Todos los derechos reservados</p>
          <p><a href="${APP_URL}">Visitar ${APP_NAME}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ======================================
// 📬 NOTIFICACIONES A LA EMPRESA
// ======================================

/**
 * Notificar a la empresa sobre un nuevo formulario recibido
 */
export async function sendNewSubmissionNotification(
  companyEmail: string,
  clientName: string,
  templateName: string,
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>📋 Nuevo Formulario Recibido</h2>
      <p>Hola,</p>
      <p>Se ha recibido un nuevo formulario que requiere tu atención:</p>
      
      <div class="info-box">
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Template:</strong> ${templateName}</p>
        <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString(
          'es-UY',
          {
            dateStyle: 'full',
            timeStyle: 'short',
          }
        )}</p>
        <p><strong>Estado:</strong> <span class="status-badge status-pending">🟡 Pendiente</span></p>
      </div>

      <p>Por favor, revisa el formulario y toma las acciones necesarias.</p>

      <a href="${APP_URL}/submissions?id=${submissionId}" class="button">
        Ver Formulario
      </a>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Recibirás notificaciones automáticas sobre los estados de los formularios.
      </p>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: companyEmail,
      subject: `📋 Nuevo formulario: ${templateName}`,
      html: getEmailTemplate(
        content,
        `Nuevo formulario recibido de ${clientName}`
      ),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending new submission notification:', error);
    return { success: false, error: error.message };
  }
}

// ======================================
// 👤 NOTIFICACIONES AL CLIENTE
// ======================================

/**
 * Notificar al cliente sobre cambio de estado
 */
export async function sendStatusChangeNotification(
  clientEmail: string,
  clientName: string,
  templateName: string,
  oldStatus: string,
  newStatus: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const statusEmojis: Record<string, string> = {
      pending: '🟡',
      reviewed: '🔵',
      approved: '🟢',
      rejected: '🔴',
      signing: '🟠',
      signed: '✅',
    };

    const statusNames: Record<string, string> = {
      pending: 'Pendiente',
      reviewed: 'Revisado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      signing: 'En proceso de firma',
      signed: 'Firmado',
    };

    const statusClasses: Record<string, string> = {
      pending: 'status-pending',
      reviewed: 'status-reviewed',
      approved: 'status-approved',
      rejected: 'status-rejected',
      signing: 'status-signing',
      signed: 'status-signed',
    };

    const content = `
      <h2>🔔 Actualización de Estado</h2>
      <p>Hola ${clientName},</p>
      <p>El estado de tu certificado <strong>${templateName}</strong> ha sido actualizado:</p>
      
      <div class="info-box">
        <p>
          <strong>Estado anterior:</strong> 
          <span class="status-badge ${statusClasses[oldStatus]}">
            ${statusEmojis[oldStatus]} ${statusNames[oldStatus]}
          </span>
        </p>
        <p>
          <strong>Estado nuevo:</strong> 
          <span class="status-badge ${statusClasses[newStatus]}">
            ${statusEmojis[newStatus]} ${statusNames[newStatus]}
          </span>
        </p>
        ${notes ? `<p><strong>Notas:</strong> ${notes}</p>` : ''}
        <p><strong>Fecha de actualización:</strong> ${new Date().toLocaleString(
          'es-UY',
          {
            dateStyle: 'full',
            timeStyle: 'short',
          }
        )}</p>
      </div>

      ${
        newStatus === 'approved'
          ? '<p style="color: #166534; font-weight: 600;">🎉 ¡Felicitaciones! Tu certificado ha sido aprobado.</p>'
          : ''
      }
      ${
        newStatus === 'rejected'
          ? '<p style="color: #991b1b; font-weight: 600;">Lo sentimos, tu certificado ha sido rechazado. Por favor, revisa las notas y vuelve a enviarlo si es necesario.</p>'
          : ''
      }
      ${
        newStatus === 'signed'
          ? '<p style="color: #065f46; font-weight: 600;">✅ Tu certificado ha sido firmado digitalmente y está listo para descargar.</p>'
          : ''
      }

      <a href="${APP_URL}/my-submissions" class="button">
        Ver Mis Envíos
      </a>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `${statusEmojis[newStatus]} Actualización: ${templateName}`,
      html: getEmailTemplate(
        content,
        `Tu certificado está ahora: ${statusNames[newStatus]}`
      ),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending status change notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Confirmar recepción del formulario al cliente
 */
export async function sendSubmissionConfirmation(
  clientEmail: string,
  clientName: string,
  templateName: string,
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>✅ Formulario Enviado Exitosamente</h2>
      <p>Hola ${clientName},</p>
      <p>Tu formulario ha sido enviado correctamente y está siendo procesado:</p>
      
      <div class="info-box">
        <p><strong>Template:</strong> ${templateName}</p>
        <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString(
          'es-UY',
          {
            dateStyle: 'full',
            timeStyle: 'short',
          }
        )}</p>
        <p><strong>ID de seguimiento:</strong> ${submissionId
          .substring(0, 8)
          .toUpperCase()}</p>
        <p><strong>Estado actual:</strong> <span class="status-badge status-pending">🟡 Pendiente de revisión</span></p>
      </div>

      <p>Te notificaremos por email cuando el estado de tu formulario cambie.</p>

      <a href="${APP_URL}/my-submissions" class="button">
        Ver Estado del Envío
      </a>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>¿Qué sigue?</strong><br>
        1. Nuestro equipo revisará tu formulario<br>
        2. Recibirás actualizaciones por email<br>
        3. Podrás descargar tu certificado cuando esté listo
      </p>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `✅ Formulario recibido: ${templateName}`,
      html: getEmailTemplate(
        content,
        'Tu formulario ha sido enviado exitosamente'
      ),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending submission confirmation:', error);
    return { success: false, error: error.message };
  }
}

// ======================================
// 🔐 NOTIFICACIONES DE AUTENTICACIÓN
// ======================================

/**
 * Email de bienvenida para nuevos usuarios
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  role: 'admin' | 'company' | 'client'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const roleNames = {
      admin: 'Administrador',
      company: 'Empresa',
      client: 'Cliente',
    };

    const roleFeatures = {
      admin: [
        'Gestionar usuarios y roles',
        'Ver estadísticas del sistema',
        'Configurar permisos',
        'Acceso completo al sistema',
      ],
      company: [
        'Diseñador visual de templates',
        'Gestionar formularios recibidos',
        'Aprobar/rechazar envíos',
        'Exportar certificados a PDF',
        'Firma digital de documentos',
      ],
      client: [
        'Llenar formularios disponibles',
        'Ver estado de tus envíos',
        'Descargar certificados',
        'Recibir notificaciones por email',
      ],
    };

    const content = `
      <h2>👋 ¡Bienvenido a ${APP_NAME}!</h2>
      <p>Hola ${userName},</p>
      <p>Tu cuenta ha sido creada exitosamente con el rol de <strong>${
        roleNames[role]
      }</strong>.</p>
      
      <div class="info-box">
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Rol:</strong> ${roleNames[role]}</p>
        <p><strong>Fecha de creación:</strong> ${new Date().toLocaleString(
          'es-UY',
          {
            dateStyle: 'full',
            timeStyle: 'short',
          }
        )}</p>
      </div>

      <p><strong>Con tu cuenta puedes:</strong></p>
      <ul>
        ${roleFeatures[role].map((feature) => `<li>${feature}</li>`).join('')}
      </ul>

      <a href="${APP_URL}/login" class="button">
        Iniciar Sesión
      </a>

      <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #7c3aed;">
        <p style="margin: 0;"><strong>💡 Consejo:</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
          Explora todas las funcionalidades disponibles en tu panel de control. 
          Si necesitas ayuda, consulta nuestra documentación o contacta con soporte.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `👋 ¡Bienvenido a ${APP_NAME}!`,
      html: getEmailTemplate(
        content,
        `Tu cuenta de ${APP_NAME} ha sido creada`
      ),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

// ======================================
// 🔔 NOTIFICACIONES ADMINISTRATIVAS
// ======================================

/**
 * Notificar al admin sobre nuevo usuario registrado
 */
export async function sendNewUserNotificationToAdmin(
  adminEmail: string,
  newUserEmail: string,
  newUserName: string,
  newUserRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>👤 Nuevo Usuario Registrado</h2>
      <p>Se ha registrado un nuevo usuario en el sistema:</p>
      
      <div class="info-box">
        <p><strong>Nombre:</strong> ${newUserName}</p>
        <p><strong>Email:</strong> ${newUserEmail}</p>
        <p><strong>Rol:</strong> ${newUserRole}</p>
        <p><strong>Fecha de registro:</strong> ${new Date().toLocaleString(
          'es-UY',
          {
            dateStyle: 'full',
            timeStyle: 'short',
          }
        )}</p>
      </div>

      <a href="${APP_URL}/admin" class="button">
        Ver Panel de Administración
      </a>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `👤 Nuevo usuario: ${newUserName}`,
      html: getEmailTemplate(
        content,
        `Nuevo usuario registrado: ${newUserEmail}`
      ),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
}

// ======================================
// 📊 EXPORTAR CONFIGURACIÓN
// ======================================

export const emailConfig = {
  fromEmail: FROM_EMAIL,
  appUrl: APP_URL,
  appName: APP_NAME,
  isConfigured: !!import.meta.env.RESEND_API_KEY,
};
