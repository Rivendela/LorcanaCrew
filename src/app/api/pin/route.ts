import { NextRequest, NextResponse } from 'next/server';
import { GATE_PIN, PIN_COOKIE_NAME } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || pin.toString().trim() !== GATE_PIN) {
      return NextResponse.json({ error: 'PIN incorrecto. Consulta con el grupo.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set cookie valid for 1 year
    response.cookies.set(PIN_COOKIE_NAME, 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error al verificar el PIN' }, { status: 500 });
  }
}
