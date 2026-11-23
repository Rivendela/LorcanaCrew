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
  X,
  Palette,
  ChevronRight,
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
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Jugador</th>
                    <th className="py-3 px-2 text-center font-extrabold text-amber-400">PTS</th>
                    <th className="py-3 px-2 text-center">Bo3 (V-D)</th>
                    <th className="py-3 px-2 text-center">+/- Juegos</th>
                    <th className="py-3 px-3 text-right pr-4 font-mono text-slate-400" title="Desempate Buchholz (Suma de puntos de rivales)">
                      Buchholz
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
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
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
                          {' - '}
                          <span className="text-rose-400 font-semibold">{item.matchesLost}D</span>
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

                        <td className="py-2.5 px-3 text-right pr-4 font-mono text-slate-300">
                          {item.buchholz} <span className="text-[10px] text-slate-500">pts</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Criterios: Puntos (3 por victoria) &gt; Buchholz &gt; Diferencial</span>
              <span className="font-mono text-amber-400">Formato Suizo</span>
            </div>
          </div>
        </div>

        {/* Right Column: Rounds & Matchups (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
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
    </div>
  );
}
