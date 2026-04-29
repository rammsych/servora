import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

export async function generateGuidePdf(guide) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;

  page.drawText('SERVORA - Guia de Servicio', {
    x: 50,
    y,
    size: 18,
    font: bold,
    color: rgb(0.05, 0.1, 0.2),
  });

  y -= 35;

  page.drawText(`N Guia: ${value(guide.guide_number || guide.id)}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 25;

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
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(String(value(val)), {
      x: 190,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });

    y -= 18;
  });

  y -= 10;

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
      color: rgb(0.05, 0.1, 0.2),
    });

    y -= 18;

    const lines = String(value(text)).match(/.{1,85}/g) || ['-'];

    lines.slice(0, 6).forEach((line) => {
      page.drawText(line, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      y -= 14;
    });

    y -= 12;
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
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}