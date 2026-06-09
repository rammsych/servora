import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGuidePdf } from '@/libs/pdf/generateGuidePdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    console.log('ID recibido:', id);

    const { data: guide, error: guideError } = await supabase
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
      .eq('id', id)
      .single();

    if (guideError) {
      console.error('Error consultando guía:', guideError);
    }

    if (guideError || !guide) {
      return NextResponse.json(
        { ok: false, message: 'Guía no encontrada.' },
        { status: 404 }
      );
    }


    const { data: approvals, error: approvalsError } = await supabase
      .from('guide_approvals')
      .select(`
                id,
                approval_type,
                status,
                approved_at,
                comments,
                approved_by,
                profiles:profiles!guide_approvals_approved_by_fkey (
                  id,
                  full_name,
                  email
                )
              `)
      .eq('guide_id', id)
      .order('created_at', { ascending: true });

    if (approvalsError) {
      console.error('Error cargando aprobaciones:', approvalsError);
    }

    const { data: photos } = await supabase
      .from('service_guide_photos')
      .select('photo_url')
      .eq('guide_id', id)
      .order('created_at', { ascending: true })
      .limit(1);

    const photoUrl = photos?.[0]?.photo_url || null;

    const pdfBuffer = await generateGuidePdf({
      guide,
      approvals: approvals || [],
      photoUrl,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-guia-${guide.guide_number || id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);

    return NextResponse.json(
      { ok: false, message: 'Error generando PDF.' },
      { status: 500 }
    );
  }
}