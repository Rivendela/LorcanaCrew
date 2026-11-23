import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, updateMatchResult } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Debes iniciar sesión para registrar resultados' }, { status: 401 });
    }

    const { matchId, player1Score, player2Score, notes } = await req.json();

    if (!matchId || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json({ error: 'Datos de partido incompletos' }, { status: 400 });
    }

    // Validate Bo3 scores (e.g. 2-0, 2-1, 1-2, 0-2, or 1-1, 0-0)
    const p1 = Number(player1Score);
    const p2 = Number(player2Score);

    if (p1 < 0 || p1 > 2 || p2 < 0 || p2 > 2) {
      return NextResponse.json({ error: 'En formato Bo3 las partidas ganadas deben ser entre 0 y 2' }, { status: 400 });
    }

    const db = await getDatabase();
    const match = db.matches.find((m) => m.id === matchId);
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    // Check permissions: Admin or one of the two players in the match
    const isAdmin = session.role === 'admin';
    const isPlayerInMatch = session.userId === match.player1Id || session.userId === match.player2Id;

    if (!isAdmin && !isPlayerInMatch) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este partido' }, { status: 403 });
    }

    const updated = await updateMatchResult(matchId, p1, p2, session.userId, notes);

    return NextResponse.json({ success: true, match: updated });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json({ error: 'Error al actualizar el partido' }, { status: 500 });
  }
}
