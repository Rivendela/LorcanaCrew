import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { resetCurrentLeague } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    await resetCurrentLeague();

    return NextResponse.json({ success: true, message: 'Liga y jornadas reseteadas correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al resetear la liga' }, { status: 500 });
  }
}
