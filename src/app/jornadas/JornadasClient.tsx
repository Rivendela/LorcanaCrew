'use client';

import React, { useState, useEffect } from 'react';
import { League, Match, Round, User } from '@/types';
import { MatchCard } from '@/components/MatchCard';
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight, Rocket, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JornadasClientProps {
  league: League;
  rounds: Round[];
  allRoundsTotal?: number;
  initialMatches: Match[];
  players: User[];
  currentUser: { id: string; role: 'admin' | 'player' } | null;
}

export function JornadasClient({
  league,
  rounds,
  allRoundsTotal,
  initialMatches,
  players,
  currentUser,
}: JornadasClientProps) {
  const router = useRouter();
  const isAdmin = currentUser?.role === 'admin';
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(() => {
    const current = rounds.find((r) => r.isCurrent);
    return current ? current.roundNumber : (rounds[0]?.roundNumber || 1);
  });

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'pending'>('all');
  const [launching, setLaunching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));
  const currentRound = rounds.find((r) => r.roundNumber === selectedRoundNumber) || rounds[0];

  const roundMatches = matches.filter((m) => m.roundNumber === selectedRoundNumber);

  const filteredMatches = roundMatches.filter((m) => {
    if (filterMode === 'mine') {
      if (!currentUser) return true;
      return m.player1Id === currentUser.id || m.player2Id === currentUser.id;
    }
    if (filterMode === 'pending') {
      return m.status === 'pending';
    }
    return true;
  });

  const completedCount = roundMatches.filter((m) => m.status === 'completed').length;
  const isRoundFinished = completedCount === roundMatches.length;

  // Previous round check: only count real matches between players (not BYEs)
  const prevRound = selectedRoundNumber > 1 ? rounds.find((r) => r.roundNumber === selectedRoundNumber - 1) : null;
  const prevRoundMatches = prevRound ? matches.filter((m) => m.roundNumber === prevRound.roundNumber) : [];
  const prevRoundPending = prevRoundMatches.filter((m) => m.status === 'pending' && m.player2Id && !m.isBye).length;

  const handleMatchUpdated = (updatedMatch: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
    router.refresh();
  };

  const handleLaunchRound = async (roundId: string) => {
    if (prevRoundPending > 0) {
      alert(
        `No se puede pasar a la Jornada ${selectedRoundNumber}: la Jornada ${selectedRoundNumber - 1} tiene aún ${prevRoundPending} partido(s) pendiente(s). Todos los partidos deben completarse antes de avanzar.`
      );
      setActionError(`No se puede avanzar: aún quedan ${prevRoundPending} partido(s) pendientes en la jornada anterior.`);
      return;
    }

    const confirmLaunch = confirm(`¿Lanzar oficialmente la Jornada ${selectedRoundNumber} para el grupo?`);
    if (!confirmLaunch) return;

    setLaunching(true);
    setActionError(null);

    try {
      const res = await fetch('/api/rounds/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: league.id,
          roundId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al lanzar la ronda');
      }

      router.refresh();
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setLaunching(false);
    }
  };

  const isCurrentActiveRound = currentRound?.isCurrent || currentRound?.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Jornadas & Partidos Bo3</h1>
              <p className="text-xs text-slate-400">
                CCREW • {isAdmin ? `${allRoundsTotal || rounds.length} semanas de liga programadas` : `Jornada ${selectedRoundNumber} de ${allRoundsTotal || rounds.length}`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterMode === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Todos ({roundMatches.length})
          </button>
          {currentUser && (
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterMode === 'mine'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Mis Partidos
            </button>
          )}
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterMode === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Pendientes ({roundMatches.filter((m) => m.status === 'pending').length})
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Admin Launch Banner: The admin verifies data and launches the round */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Control de Comisionado
              </span>
              <span className="text-sm font-bold text-white">
                Estado: {currentRound?.status === 'completed' ? 'Finalizada' : currentRound?.status === 'active' ? 'Activa / En juego' : 'Por Lanzar'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {prevRoundPending > 0 && selectedRoundNumber > 1 ? (
                <span className="text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  La Jornada {selectedRoundNumber - 1} tiene {prevRoundPending} partido(s) pendiente(s). No se puede pasar de jornada hasta que terminen todos los partidos.
                </span>
              ) : (
                <span>Revisa que todos los resultados estén correctos antes de activar esta ronda.</span>
              )}
            </p>
          </div>

          {!isCurrentActiveRound && (
            <button
              onClick={() => handleLaunchRound(currentRound.id)}
              disabled={launching || (prevRoundPending > 0 && selectedRoundNumber > 1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket className={`w-4 h-4 ${launching ? 'animate-bounce' : ''}`} />
              <span>{launching ? 'Activando...' : `Lanzar Jornada ${selectedRoundNumber} Ahora`}</span>
            </button>
          )}

          {isCurrentActiveRound && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Jornada Activa en Curso</span>
            </span>
          )}
        </div>
      )}

      {/* Rounds Horizontal Selector */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {rounds.map((r) => {
            const isSelected = r.roundNumber === selectedRoundNumber;
            const matchesOfThisRound = matches.filter((m) => m.roundNumber === r.roundNumber);
            const finished = matchesOfThisRound.every((m) => m.status === 'completed');

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoundNumber(r.roundNumber)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.03]'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800/80'
                  }`}
              >
                <span>Jornada {r.roundNumber}</span>
                <span
                  className={`text-[10px] font-mono mt-0.5 ${isSelected
                    ? 'text-slate-900 font-semibold'
                    : finished
                      ? 'text-emerald-400'
                      : r.isCurrent
                        ? 'text-amber-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                >
                  {finished ? '✓ Finalizada' : r.isCurrent ? '● Activa' : 'Próxima'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Round Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900/30 border border-slate-800 px-3.5 sm:px-4 py-3 rounded-xl gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedRoundNumber(Math.max(1, selectedRoundNumber - 1))}
            disabled={selectedRoundNumber === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{currentRound?.title}</span>
              {currentRound?.isCurrent && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Semana Activa
                </span>
              )}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {currentRound?.startDate} hasta {currentRound?.endDate}
            </p>
          </div>
          <button
            onClick={() => setSelectedRoundNumber(Math.min(rounds.length, selectedRoundNumber + 1))}
            disabled={selectedRoundNumber === rounds.length}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <span className="text-xs font-mono text-slate-300">
            {completedCount} / {roundMatches.length} completados
          </span>
          <div className="w-24 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${(completedCount / Math.max(1, roundMatches.length)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">No hay partidos que coincidan con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const p1 = playerMap.get(match.player1Id);
            const p2 = match.player2Id ? playerMap.get(match.player2Id) : null;
            if (!p1) return null;

            return (
              <MatchCard
                key={match.id}
                match={match}
                player1={p1}
                player2={p2 || null}
                currentUser={currentUser}
                onMatchUpdated={handleMatchUpdated}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
