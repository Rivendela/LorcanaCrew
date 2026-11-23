import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTournamentById, getUsers, updateTournament } from '@/lib/db';
import { generateNextSwissRound, updateTournamentMatchScore } from '@/lib/tournament-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const {
      tournamentId,
      matchId,
      player1Score,
      player2Score,
      notes,
      player1Inks,
      player2Inks,
      action,
    } = await req.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Handle advancing Swiss rounds
    if (action === 'advance_swiss_round') {
      const allUsers = await getUsers();
      const swissResult = generateNextSwissRound(tournament, allUsers);

      const updates: any = {};
      if (swissResult.isFinished) {
        updates.status = 'completed';
        updates.championId = swissResult.championId;
        updates.runnerUpId = swissResult.runnerUpId;
      } else {
        updates.currentSwissRound = swissResult.nextRoundNumber;
        updates.matches = [...tournament.matches, ...(swissResult.newMatches || [])];
      }

      const updated = await updateTournament(tournamentId, updates);
      return NextResponse.json({
        success: true,
        tournament: updated,
        isFinished: swissResult.isFinished,
        championId: swissResult.championId,
        runnerUpId: swissResult.runnerUpId,
      });
    }

    if (!matchId) {
      return NextResponse.json({ error: 'Faltan datos del partido' }, { status: 400 });
    }

    const s1 = Number(player1Score);
    const s2 = Number(player2Score);

    if (s1 === s2) {
      return NextResponse.json({ error: 'En eliminatorias de torneo no puede haber empate' }, { status: 400 });
    }

    const result = updateTournamentMatchScore(
      tournament.matches,
      matchId,
      s1,
      s2,
      notes,
      player1Inks,
      player2Inks
    );

    const updates: any = {
      matches: result.updatedMatches,
    };

    if (result.isTournamentFinished) {
      updates.status = 'completed';
      updates.championId = result.championId;
      updates.runnerUpId = result.runnerUpId;
    }

    const updatedTournament = await updateTournament(tournamentId, updates);

    return NextResponse.json({
      success: true,
      tournament: updatedTournament,
      isFinished: result.isTournamentFinished,
      championId: result.championId,
      runnerUpId: result.runnerUpId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar partido de torneo' }, { status: 500 });
  }
}
