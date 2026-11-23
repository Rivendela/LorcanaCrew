import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { closeRound, updateRound } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { roundId, leagueId, format, status, action } = await req.json();

    if (!roundId) {
      return NextResponse.json({ error: 'ID de ronda requerido' }, { status: 400 });
    }

    if (action === 'close' && leagueId) {
      const closed = await closeRound(leagueId, roundId);
      return NextResponse.json({ success: true, round: closed });
    }

    const updates: any = {};
    if (format) updates.format = format;
    if (status) updates.status = status;

    const updated = await updateRound(roundId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Ronda no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, round: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar ronda' }, { status: 500 });
  }
}
