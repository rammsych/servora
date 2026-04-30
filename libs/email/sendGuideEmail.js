import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function maintenanceLabel(value) {
  const labels = {
    preventive: 'Preventiva',
    corrective: 'Correctiva',
    emergency: 'Emergencia',
  };

  return labels[value] || value || '-';
}

export async function sendGuideEmail({ guide, operatorEmail, pdfBuffer }) {
  const adminEmail = process.env.ADMIN_EMAIL;

  const recipients = [
    adminEmail,
    operatorEmail,
  ].filter(Boolean);

  const cc = process.env.EMAIL_CC
  ? [process.env.EMAIL_CC]
  : [];

  if (recipients.length === 0) {
    throw new Error('No hay destinatarios configurados.');
  }

  const guideNumber = guide.guide_number || guide.id;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: recipients,
    cc,
    subject: `SERVORA - Nueva guía de servicio N° ${guideNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Nueva guía de servicio generada</h2>
        <p>Se ha generado una nueva guía en SERVORA.</p>

        <p><strong>N° guía:</strong> ${guideNumber}</p>
        <p><strong>Institución:</strong> ${guide.institution_name || '-'}</p>
        <p><strong>Fecha:</strong> ${guide.service_date || '-'}</p>
        <p><strong>Horario:</strong> ${guide.start_time || '-'} / ${guide.end_time || '-'}</p>
        <p><strong>Mantenimiento:</strong> ${maintenanceLabel(guide.maintenance_type)}</p>
        <p><strong>Cliente:</strong> ${guide.customer_name || '-'}</p>
        <p><strong>RUT cliente:</strong> ${guide.customer_rut || '-'}</p>

        <h3>Actividad realizada</h3>
        <p>${guide.activity_description || '-'}</p>

        <h3>Observaciones</h3>
        <p>${guide.observations || '-'}</p>

        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
          Este correo fue generado automáticamente por SERVORA.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `guia-servora-${guideNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}