import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGuidePdf } from '@/libs/pdf/generateGuidePdf';
import { sendGuideEmail } from '@/libs/email/sendGuideEmail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { guide, operatorEmail } = await request.json();

    if (!guide?.id) {
      return NextResponse.json(
        { ok: false, message: 'guide.id es requerido.' },
        { status: 400 }
      );
    }

    const { data: fullGuide, error: guideError } = await supabase
      .from('service_guides')
      .select(`
        *,
        projects (
          id,
          project_code,
          project_name,
          service_type,
          purchase_order,
          location,
          commune,
          region,
          project_manager,
          quotation_clients (
            id,
            name,
            rut,
            email,
            phone,
            address,
            contact_name
          ),
          holding_companies (
            id,
            business_name,
            logo_url
          )
        ),
        operator:profiles!service_guides_operator_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', guide.id)
      .single();

    if (guideError || !fullGuide) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo cargar la guía completa.' },
        { status: 404 }
      );
    }

    const { data: photos } = await supabase
      .from('service_guide_photos')
      .select(`
        id,
        photo_url,
        photo_path,
        description,
        created_at
      `)
      .eq('guide_id', guide.id)
      .order('created_at', { ascending: true });

    const pdfBuffer = await generateGuidePdf({
      guide: fullGuide,
      approvals: [],
      photos: photos || [],
    });

    await sendGuideEmail({
      guide: fullGuide,
      operatorEmail,
      pdfBuffer,
    });

    return NextResponse.json({
      ok: true,
      message: 'Correo enviado correctamente.',
    });
  } catch (error) {
    console.error('Error enviando correo de guía:', error);

    return NextResponse.json(
      { ok: false, message: error.message || 'Error enviando correo.' },
      { status: 500 }
    );
  }
}