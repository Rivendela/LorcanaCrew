import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createTournament, deleteTournament, getTournaments, getUsers } from '@/lib/db';
import { generateSwissTournament, generateTournamentBracket } from '@/lib/tournament-engine';
import { Tournament, TournamentFormat, TournamentType } from '@/types';

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

    const { name, format, playerIds, description, date, type, swissRoundsTotal } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del torneo es obligatorio' }, { status: 400 });
    }

    const allUsers = await getUsers();
    const nonAdminUserIds = new Set(allUsers.filter((u) => u.role === 'player').map((u) => u.id));
    const validPlayerIds = Array.isArray(playerIds)
      ? (playerIds as string[]).filter((id) => nonAdminUserIds.has(id))
      : [];

    if (validPlayerIds.length < 2) {
      return NextResponse.json({ error: 'Debes seleccionar al menos 2 jugadores válidos (el administrador no puede ser jugador)' }, { status: 400 });
    }

    const tournamentId = `tourn-${Date.now()}`;
    const tournamentType: TournamentType = type === 'swiss' ? 'swiss' : 'bracket';

    let matches;
    let totalSwissRounds: number | undefined = undefined;

    if (tournamentType === 'swiss') {
      const swiss = generateSwissTournament(tournamentId, validPlayerIds, swissRoundsTotal);
      matches = swiss.matches;
      totalSwissRounds = swiss.totalRounds;
    } else {
      matches = generateTournamentBracket(tournamentId, validPlayerIds);
    }

    const newTournament: Tournament = {
      id: tournamentId,
      name: name.trim(),
      description: description?.trim() || `Torneo ${format?.toUpperCase() || 'LORCANA'} CCREW`,
      type: tournamentType,
      format: (format as TournamentFormat) || 'porcana',
      date: date || new Date().toISOString().split('T')[0],
      status: 'active',
      playerIds: validPlayerIds,
      matches,
      swissRoundsTotal: totalSwissRounds,
      currentSwissRound: tournamentType === 'swiss' ? 1 : undefined,
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
