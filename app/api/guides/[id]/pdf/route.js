import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGuidePdf } from '@/libs/pdf/generateGuidePdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: guide, error: guideError } = await supabase
      .from('service_guides')
      .select('*')
      .eq('id', id)
      .single();

    if (guideError || !guide) {
      return NextResponse.json(
        { ok: false, message: 'Guía no encontrada.' },
        { status: 404 }
      );
    }

    const { data: photos } = await supabase
      .from('service_guide_photos')
      .select('photo_url')
      .eq('guide_id', id)
      .order('created_at', { ascending: true })
      .limit(1);

    const photoUrl = photos?.[0]?.photo_url || null;

    const pdfBuffer = await generateGuidePdf(guide, photoUrl);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="guia-servora-${guide.guide_number || id}.pdf"`,
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