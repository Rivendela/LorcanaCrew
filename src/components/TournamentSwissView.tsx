'use client';

import React, { useState } from 'react';
import { InkType, SwissStanding, Tournament, TournamentMatch, User } from '@/types';
import { calculateSwissStandings } from '@/lib/tournament-engine';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import {
  Trophy,
  Crown,
  Swords,
  CheckCircle2,
  Clock,
  Edit3,
  Rocket,
  Shield,
  AlertCircle,
  AlertTriangle,
  X,
  Palette,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  ArrowLeftRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { ALL_INKS, LORCANA_INKS } from '@/lib/constants';

interface TournamentSwissViewProps {
  tournament: Tournament;
  players: User[];
  currentUser?: { id: string; role: 'admin' | 'player' } | null;
  onRefresh?: () => void;
}

export function TournamentSwissView({
  tournament,
  players,
  currentUser,
  onRefresh,
}: TournamentSwissViewProps) {
  const currentRound = tournament.currentSwissRound || 1;
  const totalRounds = tournament.swissRoundsTotal || 3;
  const isCompleted = tournament.status === 'completed';
  const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));

  // Selected Swiss round tab to view
  const [selectedRound, setSelectedRound] = useState<number>(currentRound);

  // Scoring Modal state
  const [scoringMatch, setScoringMatch] = useState<TournamentMatch | null>(null);
  const [score1, setScore1] = useState(2);
  const [score2, setScore2] = useState(0);
  const [p1Ink1, setP1Ink1] = useState<InkType>('Amber');
  const [p1Ink2, setP1Ink2] = useState<InkType>('Steel');
  const [p2Ink1, setP2Ink1] = useState<InkType>('Amethyst');
  const [p2Ink2, setP2Ink2] = useState<InkType>('Ruby');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pairing Editor State (Admin only)
  const [editingPairingsModal, setEditingPairingsModal] = useState<boolean>(false);
  const [pairingsDraft, setPairingsDraft] = useState<
    Array<{ matchIndex: number; player1Id: string; player2Id: string | null }>
  >([]);
  const [repairing, setRepairing] = useState<boolean>(false);
  const [savingPairings, setSavingPairings] = useState<boolean>(false);
  const [pairingsError, setPairingsError] = useState<string | null>(null);

  // Live Swiss Standings
  const standings: SwissStanding[] = calculateSwissStandings(
    tournament.matches,
    tournament.playerIds,
    players
  );

  const champion = tournament.championId ? playerMap.get(tournament.championId) : null;
  const runnerUp = tournament.runnerUpId ? playerMap.get(tournament.runnerUpId) : null;

  // Matches of selected round
  const roundMatches = tournament.matches
    .filter((m) => (m.swissRound || m.roundLevel) === selectedRound)
    .sort((a, b) => a.matchIndex - b.matchIndex);

  const currentRoundMatches = tournament.matches.filter(
    (m) => (m.swissRound || m.roundLevel) === currentRound
  );
  const pendingInCurrentRound = currentRoundMatches.filter((m) => m.status === 'pending').length;

  const handleOpenScoreModal = (m: TournamentMatch) => {
    setScoringMatch(m);
    setScore1(m.player1Score || 2);
    setScore2(m.player2Score || 0);
    setNotes(m.notes || '');

    const p1 = m.player1Id ? playerMap.get(m.player1Id) : null;
    const p2 = m.player2Id ? playerMap.get(m.player2Id) : null;

    setP1Ink1(m.player1Inks?.[0] || p1?.primaryInk || 'Amber');
    setP1Ink2(m.player1Inks?.[1] || p1?.secondaryInk || 'Steel');
    setP2Ink1(m.player2Inks?.[0] || p2?.primaryInk || 'Amethyst');
    setP2Ink2(m.player2Inks?.[1] || p2?.secondaryInk || 'Ruby');
    setError(null);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringMatch) return;
    if (score1 === score2) {
      setError('En formato Bo3 de torneo debe haber un ganador (sin empates)');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          matchId: scoringMatch.id,
          player1Score: score1,
          player2Score: score2,
          notes,
          player1Inks: [p1Ink1, p1Ink2],
          player2Inks: scoringMatch.player2Id ? [p2Ink1, p2Ink2] : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar resultado');

      setScoringMatch(null);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceSwissRound = async () => {
    const isLastRound = currentRound >= totalRounds;
    const promptMsg = isLastRound
      ? '¿Finalizar el Torneo Suizo y proclamar al Campeón según la clasificación final?'
      : `¿Generar los cruces de la Ronda ${currentRound + 1} del Sistema Suizo?`;

    if (!confirm(promptMsg)) return;

    setAdvancing(true);
    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          action: 'advance_swiss_round',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al avanzar ronda');

      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error al avanzar ronda');
    } finally {
      setAdvancing(false);
    }
  };

  const handleOpenPairingModal = () => {
    const draft = roundMatches.map((m, idx) => ({
      matchIndex: m.matchIndex ?? idx,
      player1Id: m.player1Id || tournament.playerIds[0] || '',
      player2Id: m.player2Id || null,
    }));

    if (draft.length === 0) {
      for (let i = 0; i < tournament.playerIds.length; i += 2) {
        draft.push({
          matchIndex: Math.floor(i / 2),
          player1Id: tournament.playerIds[i],
          player2Id: tournament.playerIds[i + 1] || null,
        });
      }
    }

    setPairingsDraft(draft);
    setPairingsError(null);
    setEditingPairingsModal(true);
  };

  const updateDraftPlayer1 = (index: number, newPlayerId: string) => {
    setPairingsDraft((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, player1Id: newPlayerId } : item))
    );
  };

  const updateDraftPlayer2 = (index: number, newPlayerId: string) => {
    const val = newPlayerId === '__BYE__' ? null : newPlayerId;
    setPairingsDraft((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, player2Id: val } : item))
    );
  };

  const swapMatchPlayers = (index: number) => {
    setPairingsDraft((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          player1Id: item.player2Id || item.player1Id,
          player2Id: item.player2Id ? item.player1Id : null,
        };
      })
    );
  };

  const addTableToDraft = () => {
    const assigned = new Set(
      pairingsDraft.flatMap((p) => [p.player1Id, p.player2Id]).filter(Boolean) as string[]
    );
    const unassigned = tournament.playerIds.filter((id) => !assigned.has(id));

    setPairingsDraft((prev) => [
      ...prev,
      {
        matchIndex: prev.length,
        player1Id: unassigned[0] || tournament.playerIds[0] || '',
        player2Id: unassigned[1] || null,
      },
    ]);
  };

  const removeTableFromDraft = (index: number) => {
    if (pairingsDraft.length <= 1) return;
    setPairingsDraft((prev) =>
      prev.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, matchIndex: idx }))
    );
  };

  const handleRepairRound = async (roundNum: number) => {
    const confirmMsg =
      `¿Reemparejar automáticamente la Ronda ${roundNum} del Sistema Suizo?\n\n` +
      `Se recalcularán los emparejamientos suizos según los resultados de las rondas anteriores y se resetearán los resultados de esta ronda.`;

    if (!confirm(confirmMsg)) return;

    setRepairing(true);
    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          action: 'repair_swiss_round',
          roundNumber: roundNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reemparejar ronda');

      setEditingPairingsModal(false);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error al reemparejar');
    } finally {
      setRepairing(false);
    }
  };

  const handleSavePairings = async () => {
    const assigned = new Set<string>();
    for (let i = 0; i < pairingsDraft.length; i++) {
      const p = pairingsDraft[i];
      if (!p.player1Id) {
        setPairingsError(`La Mesa ${i + 1} no tiene Jugador 1 seleccionado.`);
        return;
      }
      if (assigned.has(p.player1Id)) {
        const name = playerMap.get(p.player1Id)?.name || p.player1Id;
        setPairingsError(`El jugador "${name}" está repetido en más de una mesa.`);
        return;
      }
      assigned.add(p.player1Id);

      if (p.player2Id) {
        if (assigned.has(p.player2Id)) {
          const name = playerMap.get(p.player2Id)?.name || p.player2Id;
          setPairingsError(`El jugador "${name}" está repetido en más de una mesa.`);
          return;
        }
        assigned.add(p.player2Id);
      }
    }

    setSavingPairings(true);
    setPairingsError(null);

    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          action: 'update_swiss_pairings',
          roundNumber: selectedRound,
          pairings: pairingsDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar emparejamientos');

      setEditingPairingsModal(false);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      setPairingsError(err.message || 'Error al guardar emparejamientos');
    } finally {
      setSavingPairings(false);
    }
  };

  const distinctRounds = Array.from(
    new Set(tournament.matches.map((m) => m.swissRound || m.roundLevel))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Completed Champion Podium */}
      {isCompleted && champion && (
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-950/30 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="relative">
                <AvatarBadge avatarId={champion.avatar} name={champion.name} size="xl" />
                <div className="absolute -top-3 -right-2 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
                  🏆 ¡Campeón del Torneo Suizo!
                </span>
                <h3 className="text-2xl font-black text-white">{champion.name}</h3>
                <div className="mt-1 flex items-center gap-2 justify-center sm:justify-start">
                  <DualInkBadge
                    primary={champion.primaryInk}
                    secondary={champion.secondaryInk}
                    visibility={champion.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === champion.id || currentUser?.role === 'admin'}
                    size="sm"
                  />
                  <span className="text-xs text-slate-400">@{champion.username}</span>
                </div>
              </div>
            </div>

            {runnerUp && (
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl w-full sm:w-auto justify-center sm:justify-start">
                <AvatarBadge avatarId={runnerUp.avatar} name={runnerUp.name} size="md" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subcampeón 🥈</span>
                  <p className="font-semibold text-slate-200 text-sm">{runnerUp.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Swiss Control Banner */}
      {currentUser?.role === 'admin' && !isCompleted && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Control de Suizo
              </span>
              <span className="text-sm font-bold text-white">
                Ronda {currentRound} de {totalRounds}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {pendingInCurrentRound > 0 ? (
                <span>
                  Hay <strong className="text-amber-400">{pendingInCurrentRound}</strong> partida(s) pendiente(s) en la Ronda {currentRound}. Anota los resultados antes de avanzar.
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">
                  ¡Todos los partidos de la Ronda {currentRound} han finalizado! Listo para avanzar.
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleAdvanceSwissRound}
            disabled={pendingInCurrentRound > 0 || advancing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Rocket className={`w-4 h-4 ${advancing ? 'animate-bounce' : ''}`} />
            <span>
              {advancing
                ? 'Procesando...'
                : currentRound >= totalRounds
                ? '🏆 Finalizar Suizo & Coronar Campeón'
                : `Avanzar a Ronda ${currentRound + 1} Suizo`}
            </span>
          </button>
        </div>
      )}

      {/* Grid: Swiss Standings (Left) & Current Round Matches (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Swiss Standings Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Clasificación del Torneo Suizo</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {standings.length} participantes
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-2 text-center w-8">#</th>
                    <th className="py-3 px-3">Jugador</th>
                    <th className="py-3 px-2 text-center font-extrabold text-amber-400" title="Puntos de Match: Victoria 3 pts, Empate 1 pt, Derrota 0 pts">
                      PTS
                    </th>
                    <th className="py-3 px-2 text-center" title="Partidas Bo3: Victorias - Empates - Derrotas">
                      Bo3
                    </th>
                    <th className="py-3 px-2 text-center text-amber-300 font-bold" title="Opponents' Match Win %: Porcentaje de victoria de los rivales enfrentados (mín. 33.33%). Criterio oficial #1 de desempate en Lorcana">
                      OMW%
                    </th>
                    <th className="py-3 px-2 text-center" title="Game Win %: Porcentaje de juegos individuales ganados por el jugador. Criterio oficial #2 de desempate">
                      GW%
                    </th>
                    <th className="py-3 px-2 text-center text-slate-400" title="Opponents' Game Win %: Porcentaje de juegos individuales ganados por los rivales. Criterio oficial #3 de desempate">
                      OGW%
                    </th>
                    <th className="py-3 px-2 text-center" title="Diferencia de juegos individuales ganados vs perdidos">
                      +/-
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {standings.map((item, index) => {
                    const podiumMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                    return (
                      <tr
                        key={item.player.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          index === 0 ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-mono font-bold">
                          {podiumMedal ? (
                            <span className="text-sm">{podiumMedal}</span>
                          ) : (
                            <span className="text-slate-500">{index + 1}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <AvatarBadge avatarId={item.player.avatar} name={item.player.name} size="sm" />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate leading-tight">
                                {item.player.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <DualInkBadge
                                  primary={item.player.primaryInk}
                                  secondary={item.player.secondaryInk}
                                  visibility={item.player.inksVisibility}
                                  isOwnerOrAdmin={currentUser?.id === item.player.id || currentUser?.role === 'admin'}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-sm">
                            {item.points}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono">
                          <span className="text-emerald-400 font-semibold">{item.matchesWon}V</span>
                          {item.matchesDrawn > 0 && (
                            <span className="text-amber-400 font-semibold">-{item.matchesDrawn}E</span>
                          )}
                          <span className="text-slate-500">-</span>
                          <span className="text-rose-400 font-semibold">{item.matchesLost}D</span>
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-300" title={`OMW%: ${item.omwRate}% (Suma Buchholz: ${item.buchholz} pts)`}>
                          {item.omwRate.toFixed(1)}%
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono text-slate-300" title={`GW%: ${item.gameWinRate}% (${item.gamesWon} ganados / ${item.gamesWon + item.gamesLost} jugados)`}>
                          {item.gameWinRate.toFixed(1)}%
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono text-slate-400" title={`OGW%: ${item.ogwRate}%`}>
                          {item.ogwRate.toFixed(1)}%
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono font-semibold">
                          <span
                            className={
                              item.gameDiff > 0
                                ? 'text-emerald-400'
                                : item.gameDiff < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {item.gameDiff > 0 ? `+${item.gameDiff}` : item.gameDiff}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span>Desempate Oficial Lorcana: <strong>PTS</strong> &gt; <strong>OMW%</strong> &gt; <strong>GW%</strong> &gt; <strong>OGW%</strong> &gt; <strong>+/-</strong></span>
              <span className="font-mono text-amber-400 font-semibold">Estándar Melee.gg / Ravensburger</span>
            </div>
          </div>
        </div>

        {/* Right Column: Rounds & Matchups (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Enfrentamientos</span>
              </h3>

              {/* Round Switcher Pills */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {distinctRounds.map((rnd) => (
                  <button
                    key={rnd}
                    onClick={() => setSelectedRound(rnd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRound === rnd
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    R{rnd}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Pairing Actions */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenPairingModal}
                  title={`Editar manualmente los emparejamientos de la Ronda ${selectedRound}`}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Cruces</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRepairRound(selectedRound)}
                  disabled={repairing}
                  title={`Recalcular emparejamientos suizos de la Ronda ${selectedRound} automáticamente`}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${repairing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                  <span>{repairing ? 'Reemparejando...' : 'Reemparejar'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Matches in selected round */}
          <div className="space-y-3">
            {roundMatches.map((m) => {
              const p1 = m.player1Id ? playerMap.get(m.player1Id) : null;
              const p2 = m.player2Id ? playerMap.get(m.player2Id) : null;
              const isMatchDone = m.status === 'completed';
              const p1Won = isMatchDone && m.winnerId === m.player1Id;
              const p2Won = isMatchDone && m.winnerId === m.player2Id;

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800/60 pb-1.5 font-mono">
                    <span>
                      {m.roundName || `Ronda ${m.swissRound}`} • M#{m.matchIndex + 1}
                    </span>
                    {isMatchDone ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Finalizado
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  {/* Player 1 Row */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      p1Won
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                        : 'bg-slate-950/50 border-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p1 ? (
                        <>
                          <AvatarBadge avatarId={p1.avatar} name={p1.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs truncate block">{p1.name}</span>
                            <div className="mt-0.5">
                              <DualInkBadge
                                primary={m.player1Inks?.[0] || p1.primaryInk}
                                secondary={m.player1Inks?.[1] || p1.secondaryInk}
                                visibility={p1.inksVisibility}
                                isOwnerOrAdmin={currentUser?.id === p1.id || currentUser?.role === 'admin'}
                                size="sm"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Por determinar</span>
                      )}
                    </div>
                    <span className="font-mono font-black text-sm ml-2">
                      {isMatchDone ? m.player1Score : '-'}
                    </span>
                  </div>

                  {/* Player 2 Row */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      p2Won
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                        : 'bg-slate-950/50 border-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p2 ? (
                        <>
                          <AvatarBadge avatarId={p2.avatar} name={p2.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs truncate block">{p2.name}</span>
                            <div className="mt-0.5">
                              <DualInkBadge
                                primary={m.player2Inks?.[0] || p2.primaryInk}
                                secondary={m.player2Inks?.[1] || p2.secondaryInk}
                                visibility={p2.inksVisibility}
                                isOwnerOrAdmin={currentUser?.id === p2.id || currentUser?.role === 'admin'}
                                size="sm"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Descanso (BYE)</span>
                      )}
                    </div>
                    <span className="font-mono font-black text-sm ml-2">
                      {isMatchDone ? (p2 ? m.player2Score : 0) : '-'}
                    </span>
                  </div>

                  {/* Admin score button */}
                  {currentUser?.role === 'admin' && p1 && p2 && (
                    <div className="pt-1.5 flex justify-end">
                      <button
                        onClick={() => handleOpenScoreModal(m)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isMatchDone ? 'Editar Resultado' : 'Anotar Marcador'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MODAL: SCORING SWISS MATCH (WITH INK SELECTION) --- */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setScoringMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Anotar Partido Suizo (Bo3)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{scoringMatch.roundName}</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                    {playerMap.get(scoringMatch.player1Id || '')?.name || 'Jugador 1'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={score1}
                    onChange={(e) => setScore1(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                    {playerMap.get(scoringMatch.player2Id || '')?.name || 'Jugador 2'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={score2}
                    onChange={(e) => setScore2(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets for Tournament Bo3 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Resultados Rápidos Bo3
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      label: `${playerMap.get(scoringMatch.player1Id || '')?.name || 'P1'} 2 - 0`,
                      s1: 2,
                      s2: 0,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.player1Id || '')?.name || 'P1'} 2 - 1`,
                      s1: 2,
                      s2: 1,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.player2Id || '')?.name || 'P2'} 2 - 1`,
                      s1: 1,
                      s2: 2,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.player2Id || '')?.name || 'P2'} 2 - 0`,
                      s1: 0,
                      s2: 2,
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setScore1(preset.s1);
                        setScore2(preset.s2);
                      }}
                      className={`px-2 py-2 text-xs font-semibold rounded-xl border transition-all text-center truncate ${
                        score1 === preset.s1 && score2 === preset.s2
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inks Selection */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Colores de Mazo Jugados
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 truncate block">
                      {playerMap.get(scoringMatch.player1Id || '')?.name}:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={p1Ink1}
                        onChange={(e) => setP1Ink1(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>
                            {LORCANA_INKS[ink].label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={p1Ink2}
                        onChange={(e) => setP1Ink2(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>
                            {LORCANA_INKS[ink].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {scoringMatch.player2Id && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 truncate block">
                        {playerMap.get(scoringMatch.player2Id || '')?.name}:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={p2Ink1}
                          onChange={(e) => setP2Ink1(e.target.value as InkType)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5"
                        >
                          {ALL_INKS.map((ink) => (
                            <option key={ink} value={ink}>
                              {LORCANA_INKS[ink].label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={p2Ink2}
                          onChange={(e) => setP2Ink2(e.target.value as InkType)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5"
                        >
                          {ALL_INKS.map((ink) => (
                            <option key={ink} value={ink}>
                              {LORCANA_INKS[ink].label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas del cruce</label>
                <input
                  type="text"
                  placeholder="Ej. Gran partida decidida en el topdeck"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScoringMatch(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Confirmar Resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT SWISS PAIRINGS (ADMIN ONLY) --- */}
      {editingPairingsModal && (() => {
        const assignedCounts = new Map<string, number>();
        pairingsDraft.forEach((p) => {
          if (p.player1Id) assignedCounts.set(p.player1Id, (assignedCounts.get(p.player1Id) || 0) + 1);
          if (p.player2Id) assignedCounts.set(p.player2Id, (assignedCounts.get(p.player2Id) || 0) + 1);
        });

        const duplicatePlayerIds = Array.from(assignedCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([id]) => id);

        const unassignedPlayerIds = tournament.playerIds.filter((id) => !assignedCounts.has(id));
        const hasDuplicates = duplicatePlayerIds.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
              <button
                type="button"
                onClick={() => setEditingPairingsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">
                    Modificar Emparejamientos • Ronda {selectedRound}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ajusta manualmente qué participantes se enfrentan en cada mesa. Si modificas jugadores de un cruce ya finalizado, su marcador volverá a pendiente.
                </p>
              </div>

              {/* Status and Validation Badges */}
              <div className="mb-4 space-y-2">
                {pairingsError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{pairingsError}</span>
                  </div>
                )}

                {hasDuplicates && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      Jugadores repetidos en más de una mesa:{' '}
                      <strong>
                        {duplicatePlayerIds
                          .map((id) => playerMap.get(id)?.name || id)
                          .join(', ')}
                      </strong>
                    </span>
                  </div>
                )}

                {unassignedPlayerIds.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Jugadores sin mesa asignada:{' '}
                      <strong>
                        {unassignedPlayerIds
                          .map((id) => playerMap.get(id)?.name || id)
                          .join(', ')}
                      </strong>
                    </span>
                  </div>
                )}

                {!hasDuplicates && unassignedPlayerIds.length === 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      Todos los participantes ({tournament.playerIds.length}) asignados correctamente.
                    </span>
                  </div>
                )}
              </div>

              {/* Matchups Draft List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh]">
                {pairingsDraft.map((pairing, index) => {
                  return (
                    <div
                      key={index}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800/60 pb-1.5">
                        <span className="font-mono text-amber-400/90">
                          Mesa {index + 1}
                        </span>
                        {pairingsDraft.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTableFromDraft(index)}
                            title="Eliminar esta mesa"
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-2 pt-1">
                        {/* Player 1 Selection */}
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Jugador 1
                          </label>
                          <select
                            value={pairing.player1Id}
                            onChange={(e) => updateDraftPlayer1(index, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500"
                          >
                            {tournament.playerIds.map((pid) => {
                              const u = playerMap.get(pid);
                              return (
                                <option key={pid} value={pid}>
                                  {u?.name || pid} (@{u?.username || pid})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Swap Button */}
                        <div className="sm:col-span-1 flex items-center justify-center pt-4 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => swapMatchPlayers(index)}
                            title="Intercambiar orden en esta mesa"
                            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300 flex items-center justify-center transition-all shadow-sm"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Player 2 Selection */}
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Jugador 2 (Oponente)
                          </label>
                          <select
                            value={pairing.player2Id || '__BYE__'}
                            onChange={(e) => updateDraftPlayer2(index, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500"
                          >
                            <option value="__BYE__">Descanso (BYE - Victoria auto 2-0)</option>
                            {tournament.playerIds.map((pid) => {
                              const u = playerMap.get(pid);
                              return (
                                <option key={pid} value={pid}>
                                  {u?.name || pid} (@{u?.username || pid})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={addTableToDraft}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-slate-950/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir otra Mesa de Juego</span>
                  </button>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => handleRepairRound(selectedRound)}
                  disabled={repairing}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
                  <span>Reemparejar Automáticamente</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPairingsModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePairings}
                    disabled={hasDuplicates || savingPairings}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {savingPairings ? 'Guardando...' : 'Confirmar Emparejamientos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
