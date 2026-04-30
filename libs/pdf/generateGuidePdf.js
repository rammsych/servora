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

async function embedImageFromUrl(pdfDoc, imageUrl) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  const bytes = await response.arrayBuffer();

  if (imageUrl.toLowerCase().includes('.png')) {
    return pdfDoc.embedPng(bytes);
  }

  return pdfDoc.embedJpg(bytes);
}

export async function generateGuidePdf(guide, photoUrl = null) {
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

  /**
   * PAGINA 1 - TEMPLATE
   * Tapamos "AGOSTO 2024" y escribimos el mes actual.
   */
  const firstPage = pdfDoc.getPages()[0];

  firstPage.drawRectangle({
    x: 230,
    y: 245,
    width: 150,
    height: 22,
    color: rgb(1, 1, 1),
  });

  firstPage.drawText(currentMonthYear(), {
    x: 250,
    y: 250,
    size: 13,
    font: bold,
    color: rgb(0, 0, 0),
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
    ['Institucion', guide.institution_name],
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

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}