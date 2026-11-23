import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createTournament, deleteTournament, getTournaments, getUsers } from '@/lib/db';
import { generateTournamentBracket } from '@/lib/tournament-engine';
import { Tournament, TournamentFormat } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tournaments = await getTournaments();
    const allUsers = await getUsers();
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Sort tournaments: active first, then completed descending by date
    const sorted = [...tournaments].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      tournaments: sorted,
      activeTournament: sorted.find((t) => t.status === 'active') || null,
      pastTournaments: sorted.filter((t) => t.status === 'completed'),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener torneos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { name, format, playerIds, description, date } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del torneo es obligatorio' }, { status: 400 });
    }

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
      return NextResponse.json({ error: 'Debes seleccionar al menos 2 jugadores para el torneo' }, { status: 400 });
    }

    const tournamentId = `tourn-${Date.now()}`;
    const matches = generateTournamentBracket(tournamentId, playerIds);

    const newTournament: Tournament = {
      id: tournamentId,
      name: name.trim(),
      description: description?.trim() || `Torneo ${format?.toUpperCase() || 'LORCANA'} CCREW`,
      format: (format as TournamentFormat) || 'porcana',
      date: date || new Date().toISOString().split('T')[0],
      status: 'active',
      playerIds,
      matches,
      championId: null,
      runnerUpId: null,
      thirdPlaceId: null,
      createdAt: new Date().toISOString(),
    };

    await createTournament(newTournament);

    return NextResponse.json({ success: true, tournament: newTournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear torneo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
    }

    const success = await deleteTournament(id);
    if (!success) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar torneo' }, { status: 500 });
  }
}
