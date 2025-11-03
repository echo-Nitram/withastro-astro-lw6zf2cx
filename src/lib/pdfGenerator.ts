import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { CertificateTemplate } from '../types';

/**
 * Genera un elemento HTML temporal con el diseño exacto del certificado
 */
function createCertificateHTML(
  template: CertificateTemplate,
  formData: Record<string, any>,
  userName: string
): HTMLElement {
  const container = document.createElement('div');

  // Estilos para A4 (210mm x 297mm)
  container.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    background-color: ${template.design.background_color};
    padding: 20mm;
    position: absolute;
    left: -9999px;
    top: 0;
    font-family: 'Arial', 'Helvetica', sans-serif;
    ${
      template.design.border_style !== 'none'
        ? `border: ${template.design.border_width}px ${template.design.border_style} ${template.design.border_color};`
        : ''
    }
  `;

  // Imagen de fondo (marca de agua)
  if (template.design.background_image) {
    const bgDiv = document.createElement('div');
    bgDiv.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: ${template.design.background_opacity || 0.3};
      pointer-events: none;
    `;
    const bgImg = document.createElement('img');
    bgImg.src = template.design.background_image;
    bgImg.style.cssText =
      'max-width: 100%; max-height: 100%; object-fit: contain;';
    bgDiv.appendChild(bgImg);
    container.appendChild(bgDiv);
  }

  // Contenido principal
  const content = document.createElement('div');
  content.style.cssText = 'position: relative; z-index: 10;';

  // HEADER con logos
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 30px;
  `;

  // Logo izquierdo
  const logoLeft = document.createElement('div');
  logoLeft.style.cssText = 'width: 80px; height: 80px; flex-shrink: 0;';
  if (template.design.logo_left) {
    const imgLeft = document.createElement('img');
    imgLeft.src = template.design.logo_left;
    imgLeft.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    logoLeft.appendChild(imgLeft);
  }
  header.appendChild(logoLeft);

  // Títulos centrales
  const titles = document.createElement('div');
  titles.style.cssText = 'flex: 1; text-align: center; padding: 0 30px;';

  // Título árabe
  if (template.title_ar) {
    const titleAr = document.createElement('h1');
    titleAr.textContent = template.title_ar;
    titleAr.dir = 'rtl';
    titleAr.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #1f2937;
    `;
    titles.appendChild(titleAr);
  }

  // Título español
  const titleEs = document.createElement('h1');
  titleEs.textContent = template.title_es;
  titleEs.style.cssText = `
    font-size: 32px;
    font-weight: bold;
    margin: 0 0 5px 0;
    color: #1f2937;
  `;
  titles.appendChild(titleEs);

  // Título inglés
  if (template.title_en) {
    const titleEn = document.createElement('h2');
    titleEn.textContent = template.title_en;
    titleEn.style.cssText = `
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 15px 0;
      color: #4b5563;
    `;
    titles.appendChild(titleEn);
  }

  // Subtítulos
  if (template.subtitle_es) {
    const subtitle = document.createElement('p');
    subtitle.textContent = template.subtitle_es;
    subtitle.style.cssText = `
      font-size: 14px;
      margin: 0;
      color: #6b7280;
    `;
    titles.appendChild(subtitle);
  }

  header.appendChild(titles);

  // Logo derecho
  const logoRight = document.createElement('div');
  logoRight.style.cssText = 'width: 80px; height: 80px; flex-shrink: 0;';
  if (template.design.logo_right) {
    const imgRight = document.createElement('img');
    imgRight.src = template.design.logo_right;
    imgRight.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    logoRight.appendChild(imgRight);
  }
  header.appendChild(logoRight);

  content.appendChild(header);

  // Línea decorativa
  const line = document.createElement('div');
  line.style.cssText = `
    height: 3px;
    background: linear-gradient(to right, #3b82f6, #60a5fa, #3b82f6);
    margin-bottom: 30px;
  `;
  content.appendChild(line);

  // CAMPOS DEL FORMULARIO
  const fieldsContainer = document.createElement('div');
  fieldsContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${template.design.columns}, 1fr);
    gap: 20px;
  `;

  // Ordenar campos por order
  const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

  sortedFields.forEach((field) => {
    const fieldDiv = document.createElement('div');
    fieldDiv.style.cssText = 'margin-bottom: 10px;';

    // Label trilingüe
    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = 'margin-bottom: 8px;';

    // Label español (principal)
    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 3px;
    `;
    label.textContent = field.label_es + (field.required ? ' *' : '');
    labelContainer.appendChild(label);

    // Labels secundarios (inglés y árabe)
    const secondaryLabels = document.createElement('div');
    secondaryLabels.style.cssText = `
      font-size: 10px;
      color: #6b7280;
      line-height: 1.4;
    `;

    const labelEn = document.createElement('div');
    labelEn.textContent = `🇬🇧 ${field.label_en}`;
    secondaryLabels.appendChild(labelEn);

    const labelAr = document.createElement('div');
    labelAr.textContent = `🇸🇦 ${field.label_ar}`;
    labelAr.dir = 'rtl';
    labelAr.style.cssText = 'text-align: right;';
    secondaryLabels.appendChild(labelAr);

    labelContainer.appendChild(secondaryLabels);
    fieldDiv.appendChild(labelContainer);

    // Valor del campo
    const value = formData[field.id] || '';
    const valueDiv = document.createElement('div');

    if (field.type === 'textarea') {
      valueDiv.style.cssText = `
        border: 2px solid #d1d5db;
        border-radius: 6px;
        padding: 10px;
        min-height: 80px;
        background-color: white;
        font-size: 12px;
        color: #1f2937;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      valueDiv.textContent = value || field.placeholder || '';
    } else if (field.type === 'checkbox') {
      valueDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      const checkbox = document.createElement('div');
      checkbox.style.cssText = `
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        font-size: 14px;
      `;
      if (value === true || value === 'true' || value === 'on') {
        checkbox.textContent = '✓';
        checkbox.style.color = '#10b981';
      }
      valueDiv.appendChild(checkbox);
      const checkboxLabel = document.createElement('span');
      checkboxLabel.textContent = field.placeholder || field.label_es;
      checkboxLabel.style.cssText = 'font-size: 12px; color: #4b5563;';
      valueDiv.appendChild(checkboxLabel);
    } else {
      valueDiv.style.cssText = `
        border: 2px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        background-color: white;
        font-size: 13px;
        color: #1f2937;
        min-height: 38px;
        display: flex;
        align-items: center;
      `;
      valueDiv.textContent = value || field.placeholder || '';

      // Color gris si está vacío
      if (!value) {
        valueDiv.style.color = '#9ca3af';
      }
    }

    fieldDiv.appendChild(valueDiv);
    fieldsContainer.appendChild(fieldDiv);
  });

  content.appendChild(fieldsContainer);

  // FOOTER
  const footer = document.createElement('div');
  footer.style.cssText = `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #d1d5db;
    text-align: center;
  `;

  const footerTitle = document.createElement('p');
  footerTitle.textContent = 'Sistema de Gestión de Certificados CERTIA';
  footerTitle.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    color: #4b5563;
    margin: 0 0 5px 0;
  `;
  footer.appendChild(footerTitle);

  const footerInfo = document.createElement('p');
  footerInfo.textContent = `Documento generado el ${new Date().toLocaleDateString(
    'es-ES'
  )} • Emitido para: ${userName}`;
  footerInfo.style.cssText = `
    font-size: 10px;
    color: #9ca3af;
    margin: 0;
  `;
  footer.appendChild(footerInfo);

  content.appendChild(footer);
  container.appendChild(content);

  return container;
}

/**
 * Genera el PDF del certificado
 */
export async function generatePDF(
  template: CertificateTemplate,
  formData: Record<string, any>,
  userName: string
): Promise<Blob> {
  try {
    // Crear HTML temporal
    const htmlElement = createCertificateHTML(template, formData, userName);
    document.body.appendChild(htmlElement);

    // Esperar a que las imágenes carguen
    const images = htmlElement.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 5000); // Timeout 5s
        });
      })
    );

    // Capturar como imagen
    const canvas = await html2canvas(htmlElement, {
      scale: 2, // Alta calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: template.design.background_color,
      logging: false,
    });

    // Remover elemento temporal
    document.body.removeChild(htmlElement);

    // Crear PDF (A4: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF: ' + (error as Error).message);
  }
}

/**
 * Descarga el PDF generado
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imprime el PDF
 */
export function printPDF(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 100);
  };
}
