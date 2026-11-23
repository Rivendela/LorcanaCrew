import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { launchRound } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el comisionado (admin) puede lanzar una ronda' }, { status: 403 });
    }

    const { leagueId, roundId } = await req.json();
    if (!leagueId || !roundId) {
      return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    const updated = await launchRound(leagueId, roundId);
    if (!updated) {
      return NextResponse.json({ error: 'No se pudo activar la jornada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, round: updated });
  } catch (error) {
    console.error('Launch round error:', error);
    return NextResponse.json({ error: 'Error al lanzar la ronda' }, { status: 500 });
  }
}
