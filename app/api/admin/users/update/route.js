import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId, full_name, role, is_active } = await req.json();

    if (!userId || !full_name || !role || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { ok: false, message: 'Datos inválidos.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        full_name,
        role,
        is_active,
      })
      .eq('id', userId);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, message: 'Error interno.' },
      { status: 500 }
    );
  }
}