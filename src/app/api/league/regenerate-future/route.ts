import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, regenerateLeagueFutureSchedule } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el comisionado (admin) puede regenerar cruces futuros de la liga' },
        { status: 403 }
      );
    }

    const { leagueId, playerIds } = await req.json();

    if (!leagueId) {
      return NextResponse.json({ error: 'Falta el ID de la liga' }, { status: 400 });
    }

    if (!Array.isArray(playerIds) || playerIds.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 jugadores en la liga' },
        { status: 400 }
      );
    }

    // Filter out any admin accounts from playerIds
    const allUsers = await getUsers();
    const validPlayerIdSet = new Set(
      allUsers.filter((u) => u.role === 'player').map((u) => u.id)
    );
    const finalPlayerIds = playerIds.filter((id) => validPlayerIdSet.has(id));

    if (finalPlayerIds.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 jugadores registrados' },
        { status: 400 }
      );
    }

    const result = await regenerateLeagueFutureSchedule(leagueId, finalPlayerIds);

    return NextResponse.json({
      success: true,
      message: `¡Cruces futuros regenerados con éxito! Se mantuvieron intactas ${result.maxPreservedRound} jornada(s) pasadas y se añadieron/actualizaron ${result.newRoundsCount} jornada(s) futuras para ${finalPlayerIds.length} jugadores.`,
      maxPreservedRound: result.maxPreservedRound,
      newRoundsCount: result.newRoundsCount,
      league: result.league,
    });
  } catch (error: any) {
    console.error('Error regenerating future fixtures:', error);
    return NextResponse.json(
      { error: error.message || 'Error al regenerar los cruces a futuro' },
      { status: 500 }
    );
  }
}
