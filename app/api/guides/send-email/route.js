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

    if (!guide || !guide.id) {
      return NextResponse.json(
        { ok: false, message: 'guide es requerido.' },
        { status: 400 }
      );
    }

    if (!operatorEmail) {
      return NextResponse.json(
        { ok: false, message: 'operatorEmail es requerido.' },
        { status: 400 }
      );
    }

    const { data: photos, error: photosError } = await supabase
      .from('service_guide_photos')
      .select('photo_url')
      .eq('guide_id', guide.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (photosError) {
      console.error('Error obteniendo foto de la guía:', photosError);
    }

    const photoUrl = photos?.[0]?.photo_url || null;

    console.log('PHOTO URL PDF:', photoUrl);

    const pdfBuffer = await generateGuidePdf(guide, photoUrl);

    await sendGuideEmail({
      guide,
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
      {
        ok: false,
        message: error.message || 'Error enviando correo.',
      },
      { status: 500 }
    );
  }
}