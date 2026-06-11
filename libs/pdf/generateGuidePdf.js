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

function centerText(page, text, y, size, font, color, pageWidth) {
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: (pageWidth - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

async function embedImageFromUrl(pdfDoc, imageUrl) {
  if (!imageUrl) return null;

  try {
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
  } catch (error) {
    console.error('Error cargando imagen remota:', error);
    return null;
  }
}

async function embedLocalImage(pdfDoc, imagePath) {
  try {
    const bytes = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();

    if (ext === '.png') {
      return await pdfDoc.embedPng(bytes);
    }

    if (ext === '.jpg' || ext === '.jpeg') {
      return await pdfDoc.embedJpg(bytes);
    }

    return null;
  } catch (error) {
    console.error('No se pudo cargar imagen local:', imagePath, error);
    return null;
  }
}

export async function generateGuidePdf({
  guide,
  approvals = [],
  photos = [],
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

  /**
   * LOGO EMPRESA - ARRIBA IZQUIERDA
   */
  if (holdingCompany.logo_url) {
    const companyLogo = await embedImageFromUrl(pdfDoc, holdingCompany.logo_url);

    if (companyLogo) {
      firstPage.drawImage(companyLogo, {
        x: 88,
        y: height - 120,
        width: 85,
        height: 70,
      });
    }
  }

  /**
   * LOGO TÜV - ARRIBA DERECHA
   * Debe existir en: public/images/tuv-certificado.png
   */
  const tuvLogoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'tuv-certificado.png'
  );

  const tuvLogo = await embedLocalImage(pdfDoc, tuvLogoPath);

  if (tuvLogo) {
    firstPage.drawImage(tuvLogo, {
      x: width - 210,
      y: height - 120,
      width: 145,
      height: 75,
    });
  }

  const pageWidth = width;
  const pageHeight = height;
  const contentX = 75;
  const contentWidth = pageWidth - 150;

  const drawCommonHeader = async (targetPage) => {
    if (holdingCompany.logo_url) {
      const companyLogo = await embedImageFromUrl(pdfDoc, holdingCompany.logo_url);

      if (companyLogo) {
        targetPage.drawImage(companyLogo, {
          x: 88,
          y: pageHeight - 120,
          width: 85,
          height: 70,
        });
      }
    }

    if (tuvLogo) {
      targetPage.drawImage(tuvLogo, {
        x: pageWidth - 210,
        y: pageHeight - 120,
        width: 145,
        height: 75,
      });
    }
  };

  const drawCommonFooter = (targetPage) => {
    targetPage.drawLine({
      start: { x: contentX, y: 72 },
      end: { x: pageWidth - 75, y: 72 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    targetPage.drawText(
      'HIDENER SpA / Av. Las Condes 10415 of. 002B SB1 - Las Condes-Santiago / kim.caro@hidener.cl',
      {
        x: 105,
        y: 48,
        size: 8,
        font,
        color: rgb(0.45, 0.45, 0.45),
      }
    );
  };

  /**
   * TITULO PRINCIPAL CENTRADO
   */
  const serviceType = value(
    project.service_type ||
    guide.activity_type ||
    guide.maintenance_type ||
    'TIPO SERVICIO'
  ).toUpperCase();

  const fullTitle = `INFORME ${serviceType}`;
  const fullTitleWidth = bold.widthOfTextAtSize(fullTitle, 16);
  const titleX = (width - fullTitleWidth) / 2;

  firstPage.drawText('INFORME', {
    x: titleX,
    y: 548,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });

  const informeWidth = bold.widthOfTextAtSize('INFORME ', 16);

  firstPage.drawText(serviceType, {
    x: titleX + informeWidth,
    y: 548,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });

  /**
   * NOMBRE PROYECTO CENTRADO
   */
  const projectName = value(project.project_name).toUpperCase();
  const projectLines = projectName.match(/.{1,45}/g) || ['-'];

  let projectY = 508;

  projectLines.slice(0, 3).forEach((line) => {
    centerText(
      firstPage,
      line.trim(),
      projectY,
      15,
      bold,
      rgb(0, 0, 0),
      width
    );

    projectY -= 22;
  });

  /**
   * MES Y AÑO CENTRADO
   */
  centerText(
    firstPage,
    reportMonthYear,
    372,
    16,
    bold,
    rgb(0, 0, 0),
    width
  );

  /**
   * TABLA PORTADA
   */
  const labelW = 150;
  const valueW = 360;
  const rowH = 18;
  const tableX = (width - labelW - valueW) / 2;
  const tableY = 250;

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
      x: tableX + 8,
      y: y + 5,
      size: 9,
      font: bold,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(String(value(val)), {
      x: tableX + labelW + 8,
      y: y + 5,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
  });

  firstPage.drawLine({
    start: { x: tableX, y: tableY + rowH },
    end: { x: tableX + labelW + valueW, y: tableY + rowH },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  firstPage.drawLine({
    start: { x: tableX, y: tableY - portadaRows.length * rowH },
    end: { x: tableX + labelW + valueW, y: tableY - portadaRows.length * rowH },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  /**
   * FOOTER
   */
  firstPage.drawLine({
    start: { x: 75, y: 72 },
    end: { x: width - 75, y: 72 },
    thickness: 0.8,
    color: rgb(0.2, 0.45, 0.9),
  });

  firstPage.drawText(
    'HIDENER SpA / Av. Las Condes 10415 of. 002B SB1 - Las Condes-Santiago / kim.caro@hidener.cl',
    {
      x: 105,
      y: 48,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    }
  );

  /**
 * PAGINA 2 - REGISTRO FOTOGRAFICO
 */
  const photoPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const photoPageWidth = pageWidth;
  const photoPageHeight = pageHeight;

  await drawCommonHeader(photoPage);
  drawCommonFooter(photoPage);



  // centerText(
  //   photoPage,
  //   'REGISTRO FOTOGRÁFICO',
  //   photoPageHeight - 190,
  //   16,
  //   bold,
  //   rgb(0.05, 0.1, 0.2),
  //   photoPageWidth
  // );

  photoPage.drawText('REGISTRO FOTOGRÁFICO', {
    x: contentX,
    y: photoPageHeight - 190,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });

  photoPage.drawLine({
    start: { x: contentX, y: photoPageHeight - 198 },
    end: { x: contentX + contentWidth, y: photoPageHeight - 198 },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  });

  let photoY = photoPageHeight - 240;

  const photoBoxWidth = 420;
  const photoBoxHeight = 230;
  const photoBoxX = (photoPageWidth - photoBoxWidth) / 2;

  let currentPhotoPage = photoPage;

  const drawPhotoPageHeader = async (targetPage) => {
    await drawCommonHeader(targetPage);
    drawCommonFooter(targetPage);
  };

  for (const photo of photos || []) {
    if (photoY - photoBoxHeight < 80) {
      currentPhotoPage = pdfDoc.addPage([pageWidth, pageHeight]);
      await drawPhotoPageHeader(currentPhotoPage);
      photoY = photoPageHeight - 165;
    }

    const description = String(photo.description || 'Fotografía sin descripción');

    centerText(
      currentPhotoPage,
      description,
      photoY,
      11,
      bold,
      rgb(0, 0, 0),
      photoPageWidth
    );

    photoY -= 245;

    const image = await embedImageFromUrl(pdfDoc, photo.photo_url);

    if (image) {
      const imageRatio = image.width / image.height;
      const boxRatio = photoBoxWidth / photoBoxHeight;

      let drawWidth = photoBoxWidth;
      let drawHeight = photoBoxHeight;

      if (imageRatio > boxRatio) {
        drawHeight = photoBoxWidth / imageRatio;
      } else {
        drawWidth = photoBoxHeight * imageRatio;
      }

      const drawX = photoBoxX + (photoBoxWidth - drawWidth) / 2;
      const drawY = photoY + (photoBoxHeight - drawHeight) / 2;

      currentPhotoPage.drawRectangle({
        x: photoBoxX,
        y: photoY,
        width: photoBoxWidth,
        height: photoBoxHeight,
        borderWidth: 0.5,
        borderColor: rgb(0.75, 0.75, 0.75),
      });

      currentPhotoPage.drawImage(image, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    photoY -= 35;
  }

  /**
 * PAGINA 3 - DETALLE GUIA
 */
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  await drawCommonHeader(page);
  drawCommonFooter(page);

  let y = 620;

  const ensureSpace = async (neededHeight = 80) => {
    if (y - neededHeight > 95) return;

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    await drawCommonHeader(page);
    drawCommonFooter(page);

    y = 620;
  };

  const drawSectionTitle = async (title) => {
    await ensureSpace(45);
    page.drawText(title, {
      x: contentX,
      y,
      size: 12,
      font: bold,
      color: rgb(0.05, 0.1, 0.2),
    });

    page.drawLine({
      start: { x: contentX, y: y - 7 },
      end: { x: contentX + contentWidth, y: y - 7 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    y -= 24;
  };

  const drawInfoRow = async (label, val, rowIndex) => {
    await ensureSpace(28);
    const rowHeight = 20;
    const labelWidth = 155;
    const rowY = y - rowHeight + 5;

    page.drawRectangle({
      x: contentX,
      y: rowY,
      width: contentWidth,
      height: rowHeight,
      color: rowIndex % 2 === 0 ? rgb(0.96, 0.96, 0.96) : rgb(1, 1, 1),
    });

    page.drawRectangle({
      x: contentX,
      y: rowY,
      width: labelWidth,
      height: rowHeight,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(`${label}:`, {
      x: contentX + 8,
      y: rowY + 6,
      size: 9,
      font: bold,
      color: rgb(0, 0, 0),
    });

    page.drawText(String(value(val)), {
      x: contentX + labelWidth + 10,
      y: rowY + 6,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawRectangle({
      x: contentX,
      y: rowY,
      width: contentWidth,
      height: rowHeight,
      borderWidth: 0.4,
      borderColor: rgb(0.7, 0.7, 0.7),
    });

    y -= rowHeight;
  };

  const drawTextBox = async (title, text) => {
    await ensureSpace(105);
    const boxHeight = 72;

    page.drawText(title, {
      x: contentX,
      y,
      size: 10,
      font: bold,
      color: rgb(0.05, 0.1, 0.2),
    });

    y -= 12;

    page.drawRectangle({
      x: contentX,
      y: y - boxHeight,
      width: contentWidth,
      height: boxHeight,
      borderWidth: 0.5,
      borderColor: rgb(0.65, 0.65, 0.65),
      color: rgb(0.99, 0.99, 0.99),
    });

    const lines = String(value(text)).match(/.{1,90}/g) || ['-'];

    let textY = y - 16;

    lines.slice(0, 4).forEach((line) => {
      page.drawText(line.trim(), {
        x: contentX + 10,
        y: textY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      textY -= 13;
    });

    y -= boxHeight + 20;
  };

  page.drawText('DETALLE DE GUÍA DE SERVICIO', {
    x: contentX,
    y,
    size: 16,
    font: bold,
    color: rgb(0.05, 0.1, 0.2),
  });

  y -= 30;

  page.drawText(`N° Guía: ${value(guide.guide_number || guide.id)}`, {
    x: contentX,
    y,
    size: 11,
    font: bold,
    color: rgb(0, 0, 0),
  });

  y -= 30;

  await drawSectionTitle('INFORMACIÓN DE OPERACIONES');

  const operationRows = [
    ['Empresa holding', holdingCompany.business_name],
    ['Proyecto', project.project_name],
    ['Código proyecto', project.project_code],
    ['Cliente', client.name],
    ['Orden de compra', project.purchase_order],
    ['Ubicación', [project.location, project.commune, project.region].filter(Boolean).join(', ')],
  ];

  for (const [index, row] of operationRows.entries()) {
    const [label, val] = row;
    await drawInfoRow(label, val, index);
  }

  y -= 18;

  await drawSectionTitle('INFORMACIÓN DEL SERVICIO');

  const serviceRows = [
    ['Fecha servicio', formatDate(guide.service_date)],
    ['Hora ingreso', guide.start_time],
    ['Hora término', guide.end_time],
    ['Tipo mantenimiento', maintenanceLabel(guide.maintenance_type)],
    ['Tipo actividad', guide.activity_type],
    ['Instalación', guide.installation_type],
    ['Estado', guide.status],
  ];

  for (const [index, row] of serviceRows.entries()) {
    const [label, val] = row;
    await drawInfoRow(label, val, index);
  }

  y -= 18;

  await drawSectionTitle('INFORMACIÓN DEL EQUIPO');

  const equipmentRows = [
    ['N° serie', guide.equipment_serial],
    ['Modelo', guide.equipment_model],
    ['Marca', guide.equipment_brand],
    ['Color', guide.equipment_color],
    ['Voltaje', guide.electrical_voltage],
    ['Presión / parámetro', guide.electrical_pressure],
  ];

  for (const [index, row] of equipmentRows.entries()) {
    const [label, val] = row;
    await drawInfoRow(label, val, index);
  }

  y -= 22;

  await drawTextBox('Actividad realizada', guide.activity_description);
  await drawTextBox('Cambio de componentes', guide.component_changes);
  await drawTextBox('Observaciones', guide.observations);

  if (guide.latitude && guide.longitude && y > 155) {
    await drawSectionTitle('UBICACIÓN REGISTRADA');

    await drawInfoRow('Latitud', guide.latitude, 0);
    await drawInfoRow('Longitud', guide.longitude, 1);

    y -= 18;
  }

  if (guide.customer_signature_url) {
    await ensureSpace(190);

    const signatureImage = await embedImageFromUrl(
      pdfDoc,
      guide.customer_signature_url
    );

    if (signatureImage) {
      const signatureBoxHeight = 150;
      const signatureBoxY = y - signatureBoxHeight;

      page.drawText('FIRMA CLIENTE', {
        x: contentX,
        y,
        size: 12,
        font: bold,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: contentX, y: y - 8 },
        end: { x: contentX + contentWidth, y: y - 8 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });



      page.drawImage(signatureImage, {
        x: contentX + 150,
        y: signatureBoxY + 45,
        width: 180,
        height: 65,
      });

      page.drawLine({
        start: { x: contentX + 110, y: signatureBoxY + 35 },
        end: { x: contentX + contentWidth - 110, y: signatureBoxY + 35 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });

      page.drawText('Firma cliente', {
        x: contentX + 175,
        y: signatureBoxY + 18,
        size: 8,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      y = signatureBoxY - 20;
    }
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}