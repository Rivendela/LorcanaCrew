import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminUpdateMatch } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { matchId, player1Score, player2Score, status, notes } = await req.json();

    if (!matchId || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const updated = await adminUpdateMatch(
      matchId,
      Number(player1Score),
      Number(player2Score),
      status || 'completed',
      notes
    );

    if (!updated) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, match: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error al corregir el partido' }, { status: 500 });
  }
}
