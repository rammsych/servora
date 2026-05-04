import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const { email, password, full_name, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { ok: false, message: 'Faltan campos.' },
        { status: 400 }
      );
    }

    // crear usuario en auth
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (userError) {
      return NextResponse.json(
        { ok: false, message: userError.message },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // crear perfil
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        full_name,
        role,
      });

    if (profileError) {
      return NextResponse.json(
        { ok: false, message: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: 'Error interno' },
      { status: 500 }
    );
  }
}