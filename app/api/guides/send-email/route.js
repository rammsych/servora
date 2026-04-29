import { NextResponse } from 'next/server';
import { generateGuidePdf } from '@/libs/pdf/generateGuidePdf';
import { sendGuideEmail } from '@/libs/email/sendGuideEmail';

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

    const pdfBuffer = await generateGuidePdf(guide);

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