import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

function value(data) {
  return data || '-';
}

function maintenanceLabel(value) {
  const labels = {
    preventive: 'Preventiva',
    corrective: 'Correctiva',
    emergency: 'Emergencia',
  };

  return labels[value] || value || '-';
}

function currentMonthYear() {
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ];

  const now = new Date();

  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function monthYearFromDate(dateValue) {
  if (!dateValue) return currentMonthYear();

  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ];

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return currentMonthYear();

  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getApproval(approvals, type) {
  return approvals.find((approval) => approval.approval_type === type) || null;
}

function userName(user) {
  return user?.full_name || user?.email || '-';
}

async function embedImageFromUrl(pdfDoc, imageUrl) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);

  if (!response.ok) {
    console.error('No se pudo cargar la imagen:', imageUrl, response.status);
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const bytes = await response.arrayBuffer();

  if (contentType.includes('png')) {
    return pdfDoc.embedPng(bytes);
  }

  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return pdfDoc.embedJpg(bytes);
  }

  console.error('Formato de imagen no soportado:', contentType);
  return null;
}

export async function generateGuidePdf({
  guide,
  approvals = [],
  photoUrl = null,
}) {
  const templatePath = path.join(
    process.cwd(),
    'public',
    'templates',
    'INFORME_TEMPLATE_v1.pdf'
  );

  const templateBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const project = guide.projects || {};
  const client = project.quotation_clients || {};
  const holdingCompany = project.holding_companies || {};

  const approvalAI = getApproval(approvals, 'AI');
  const approvalGP = getApproval(approvals, 'GP');

  const elaboro = userName(guide.operator);
  const reviso = userName(approvalAI?.profiles);
  const aprobo = userName(approvalGP?.profiles || guide.approver);

  const reportDate = guide.approved_at || approvalGP?.approved_at || guide.service_date;
  const reportMonthYear = monthYearFromDate(reportDate);




  /**
   * PAGINA 1 - PORTADA INFORME
   */
  const firstPage = pdfDoc.getPages()[0];
  const { width, height } = firstPage.getSize();

  firstPage.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1),
  });

  // Logo texto temporal
  if (holdingCompany.logo_url) {
    const companyLogo = await embedImageFromUrl(pdfDoc, holdingCompany.logo_url);

    if (companyLogo) {
      firstPage.drawImage(companyLogo, {
        x: 85,
        y: height - 125,
        width: 85,
        height: 75,
      });
    }
  }

  // Certificación temporal
  const tuvLogoPath = `${process.cwd()}/public/images/tuv-certificado.png`;

  try {
    const tuvBytes = await fs.readFile(tuvLogoPath);
    const tuvLogo = await pdfDoc.embedPng(tuvBytes);

    firstPage.drawImage(tuvLogo, {
      x: width - 205,
      y: height - 125,
      width: 155,
      height: 90,
    });
  } catch (error) {
    console.error('No se pudo cargar logo TÜV:', error);
  }

  const serviceType = value(
    project.service_type ||
    guide.activity_type ||
    guide.maintenance_type
  ).toUpperCase();

  const titlePrefix = 'INFORME';
  const fullTitle = `${titlePrefix} ${serviceType}`;







  const reportTitle = `INFORME ${serviceType}`;

  const reportTitleWidth = bold.widthOfTextAtSize(
    reportTitle,
    16
  );

  const reportTitleX = (width - reportTitleWidth) / 2;

  firstPage.drawText('INFORME', {
    x: reportTitleX,
    y: 545,
    size: 16,
    font: bold,
    color: rgb(0.9, 0.1, 0.08),
  });

  const informeWidth = bold.widthOfTextAtSize(
    'INFORME ',
    16
  );

  firstPage.drawText(serviceType, {
    x: reportTitleX + informeWidth,
    y: 545,
    size: 16,
    font: bold,
    color: rgb(0.26, 0.39, 0.72),
  });















  const projectName = value(project.project_name).toUpperCase();





  const projectLines =
    projectName.match(/.{1,45}/g) || ['-'];

  let projectY = 500;

  projectLines.slice(0, 3).forEach((line) => {
    const text = line.trim();

    const lineWidth =
      bold.widthOfTextAtSize(text, 15);

    const centeredX =
      (width - lineWidth) / 2;

    firstPage.drawText(text, {
      x: centeredX,
      y: projectY,
      size: 15,
      font: bold,
      color: rgb(0.42, 0.65, 0.28),
    });

    projectY -= 23;
  });




  const monthWidth =
    bold.widthOfTextAtSize(
      reportMonthYear,
      16
    );

  firstPage.drawText(reportMonthYear, {
    x: (width - monthWidth) / 2,
    y: 360,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });



  const tableX = 80;
  const tableY = 205;
  const labelW = 120;
  const valueW = 330;
  const rowH = 16;

  const portadaRows = [
    ['Nº de Proyecto', project.project_code],
    ['Solicitante', client.name],
    ['Ubicación', [project.location, project.commune, project.region].filter(Boolean).join(', ')],
    ['Orden de Compra', project.purchase_order],
    ['Elaboró', elaboro],
    ['Revisó', reviso],
    ['Aprobó', aprobo],
    ['Fecha de Informe', formatDate(reportDate)],
    ['Revisión', '0'],
  ];

  portadaRows.forEach(([label, val], index) => {
    const y = tableY - index * rowH;
    const bg = index % 2 === 0 ? rgb(0.9, 0.9, 0.9) : rgb(1, 1, 1);

    firstPage.drawRectangle({
      x: tableX,
      y,
      width: labelW + valueW,
      height: rowH,
      color: bg,
    });

    firstPage.drawText(label, {
      x: tableX + 6,
      y: y + 4,
      size: 9,
      font: bold,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(String(value(val)), {
      x: tableX + labelW + 6,
      y: y + 4,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
  });

  firstPage.drawLine({
    start: { x: tableX, y: tableY + rowH },
    end: { x: tableX + labelW + valueW, y: tableY + rowH },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  firstPage.drawLine({
    start: { x: 90, y: 70 },
    end: { x: width - 70, y: 70 },
    thickness: 0.5,
    color: rgb(0.65, 0.72, 0.85),
  });

  firstPage.drawText('HIDENER SpA / Av. Las Condes 10415 of. 002B SB1 - Las Condes-Santiago / kim.caro@hidener.cl', {
    x: 105,
    y: 48,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });








  /**
   * PAGINA 2 - DETALLE GUIA
   */
  const page = pdfDoc.addPage([595, 842]);

  let y = 790;

  page.drawText('DETALLE DE GUIA DE SERVICIO', {
    x: 50,
    y,
    size: 16,
    font: bold,
    color: rgb(0.05, 0.1, 0.2),
  });

  y -= 30;

  page.drawText(`N Guia: ${value(guide.guide_number || guide.id)}`, {
    x: 50,
    y,
    size: 12,
    font: bold,
  });

  y -= 28;

  const rows = [
    ['Empresa holding', holdingCompany.business_name],
    ['Proyecto', project.project_name],
    ['Codigo proyecto', project.project_code],
    ['Cliente / Institucion', client.name],
    ['Orden de compra', project.purchase_order],
    ['Ubicacion', [project.location, project.commune, project.region].filter(Boolean).join(', ')],
    ['Fecha servicio', guide.service_date],
    ['Hora ingreso', guide.start_time],
    ['Hora termino', guide.end_time],
    ['Tipo mantenimiento', maintenanceLabel(guide.maintenance_type)],
    ['Tipo actividad', guide.activity_type],
    ['Instalacion', guide.installation_type],
    ['N serie', guide.equipment_serial],
    ['Modelo', guide.equipment_model],
    ['Marca', guide.equipment_brand],
    ['Color', guide.equipment_color],
    ['Voltaje', guide.electrical_voltage],
    ['Presion / parametro', guide.electrical_pressure],
    ['Cliente', guide.customer_name],
    ['RUT cliente', guide.customer_rut],
    ['Estado', guide.status],
  ];

  rows.forEach(([label, val]) => {
    page.drawText(`${label}:`, {
      x: 50,
      y,
      size: 10,
      font: bold,
    });

    page.drawText(String(value(val)), {
      x: 190,
      y,
      size: 10,
      font,
    });

    y -= 17;
  });

  y -= 14;

  const blocks = [
    ['Actividad realizada', guide.activity_description],
    ['Cambio de componentes', guide.component_changes],
    ['Observaciones', guide.observations],
  ];

  blocks.forEach(([title, text]) => {
    page.drawText(title, {
      x: 50,
      y,
      size: 12,
      font: bold,
    });

    y -= 16;

    const lines = String(value(text)).match(/.{1,85}/g) || ['-'];

    lines.slice(0, 5).forEach((line) => {
      page.drawText(line, {
        x: 50,
        y,
        size: 10,
        font,
      });

      y -= 13;
    });

    y -= 10;
  });

  if (guide.latitude && guide.longitude) {
    page.drawText('Ubicacion registrada', {
      x: 50,
      y,
      size: 12,
      font: bold,
    });

    y -= 18;

    page.drawText(`Latitud: ${guide.latitude}`, {
      x: 50,
      y,
      size: 10,
      font,
    });

    y -= 14;

    page.drawText(`Longitud: ${guide.longitude}`, {
      x: 50,
      y,
      size: 10,
      font,
    });

    y -= 25;
  }

  /**
   * FOTO
   * Ajusta el nombre del campo si en tu tabla se llama distinto.
   */
  // const photoUrl = guide.photo_url || guide.image_url || guide.evidence_url;

  if (photoUrl) {
    const image = await embedImageFromUrl(pdfDoc, photoUrl);

    if (image) {
      page.drawText('Fotografia adjunta', {
        x: 50,
        y,
        size: 12,
        font: bold,
      });

      y -= 210;

      page.drawImage(image, {
        x: 50,
        y,
        width: 250,
        height: 190,
      });
    }
  }

  // ESPACIO ANTES DE FIRMA
  y -= 40;

  if (guide.customer_signature_url) {
    const signatureImage = await embedImageFromUrl(
      pdfDoc,
      guide.customer_signature_url
    );

    if (signatureImage) {
      // TÍTULO
      page.drawText('Firma cliente', {
        x: 220,   // 👉 centrado
        y,
        size: 12,
        font: bold,
      });

      y -= 100;

      // IMAGEN FIRMA
      page.drawImage(signatureImage, {
        x: 200,   // 👉 centrado visual
        y,
        width: 200,
        height: 80,
      });

      // LÍNEA DE FIRMA
      page.drawLine({
        start: { x: 180, y: y - 10 },
        end: { x: 420, y: y - 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}