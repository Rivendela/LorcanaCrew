import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTournamentById, getUsers, updateTournament } from '@/lib/db';
import {
  generateNextSwissRound,
  repairSwissRound,
  updateSwissPairings,
  updateTournamentMatchScore,
} from '@/lib/tournament-engine';

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
      roundNumber,
      pairings,
    } = await req.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Handle re-pairing Swiss round automatically
    if (action === 'repair_swiss_round') {
      const rndNum = Number(roundNumber) || tournament.currentSwissRound || 1;
      const allUsers = await getUsers();
      const updatedMatches = repairSwissRound(tournament, rndNum, allUsers);

      const updates: any = {
        matches: updatedMatches,
      };

      if (tournament.status === 'completed') {
        updates.status = 'active';
        updates.championId = null;
        updates.runnerUpId = null;
      }
      if (rndNum < (tournament.currentSwissRound || 1)) {
        updates.currentSwissRound = rndNum;
      }

      const updated = await updateTournament(tournamentId, updates);
      return NextResponse.json({
        success: true,
        tournament: updated,
        message: `Ronda ${rndNum} reemparejada correctamente`,
      });
    }

    // Handle manual update of Swiss pairings
    if (action === 'update_swiss_pairings') {
      const rndNum = Number(roundNumber);
      if (!rndNum || !Array.isArray(pairings) || pairings.length === 0) {
        return NextResponse.json({ error: 'Datos de emparejamientos inválidos' }, { status: 400 });
      }

      // Check duplicates
      const assigned = new Set<string>();
      for (const p of pairings) {
        if (!p.player1Id) {
          return NextResponse.json({ error: 'Todos los cruces deben tener Jugador 1' }, { status: 400 });
        }
        if (assigned.has(p.player1Id)) {
          return NextResponse.json({ error: 'Un jugador no puede estar en dos mesas simultáneamente' }, { status: 400 });
        }
        assigned.add(p.player1Id);

        if (p.player2Id) {
          if (assigned.has(p.player2Id)) {
            return NextResponse.json({ error: 'Un jugador no puede estar en dos mesas simultáneamente' }, { status: 400 });
          }
          assigned.add(p.player2Id);
        }
      }

      const updatedMatches = updateSwissPairings(tournament, rndNum, pairings);

      const updates: any = {
        matches: updatedMatches,
      };

      if (tournament.status === 'completed') {
        updates.status = 'active';
        updates.championId = null;
        updates.runnerUpId = null;
      }

      const updated = await updateTournament(tournamentId, updates);
      return NextResponse.json({
        success: true,
        tournament: updated,
        message: `Emparejamientos de la Ronda ${rndNum} actualizados correctamente`,
      });
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
