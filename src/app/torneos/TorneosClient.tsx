'use client';

import React, { useState, useMemo } from 'react';
import { InkType, Tournament, TournamentMatch, User } from '@/types';
import { TournamentBracket } from '@/components/TournamentBracket';
import { TournamentSwissView } from '@/components/TournamentSwissView';
import {
  Trophy,
  Swords,
  Crown,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
  Medal,
  Search,
  Filter,
  Sparkles,
  Flame,
  Award,
  Users,
  Calendar,
  Palette,
} from 'lucide-react';
import { ALL_INKS, LORCANA_FORMATS, LORCANA_INKS } from '@/lib/constants';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge } from '@/components/InkBadge';
import Link from 'next/link';

interface TorneosClientProps {
  tournaments: Tournament[];
  players: User[];
  currentUser: { id: string; role: 'admin' | 'player' } | null;
}

interface TournamentPlayerStats {
  player: User;
  tournamentsPlayed: number;
  titles: number;
  runnersUp: number;
  matchesWon: number;
  matchesLost: number;
  matchesPlayed: number;
  winRate: number;
  points: number;
}

export function TorneosClient({
  tournaments,
  players,
  currentUser,
}: TorneosClientProps) {
  const activeTournament = tournaments.find((t) => t.status === 'active') || null;
  const pastTournaments = tournaments.filter((t) => t.status === 'completed');
  const validPlayers = useMemo(() => players.filter((p) => p.role !== 'admin'), [players]);
  const playerMap = useMemo(() => new Map<string, User>(validPlayers.map((p) => [p.id, p])), [validPlayers]);

  // Open on 'active' if a tournament is running, otherwise open on 'ranking'
  const [activeTab, setActiveTab] = useState<'active' | 'ranking' | 'history'>(() => {
    return activeTournament ? 'active' : 'ranking';
  });

  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);

  // Ranking Filters
  const [rankingSearch, setRankingSearch] = useState('');
  const [onlyPlayedTournaments, setOnlyPlayedTournaments] = useState(true);

  // History Filters
  const [historyFormat, setHistoryFormat] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState('');

  // Match Scoring Modal state (for Admin)
  const [scoringMatch, setScoringMatch] = useState<{ match: TournamentMatch; tournamentId: string } | null>(null);
  const [score1, setScore1] = useState(2);
  const [score2, setScore2] = useState(0);
  const [matchNotes, setMatchNotes] = useState('');
  const [p1Ink1, setP1Ink1] = useState<InkType>('Amber');
  const [p1Ink2, setP1Ink2] = useState<InkType>('Steel');
  const [p2Ink1, setP2Ink1] = useState<InkType>('Amber');
  const [p2Ink2, setP2Ink2] = useState<InkType>('Steel');
  const [savingScore, setSavingScore] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Compute accumulated tournament statistics for all players
  const tournamentStats = useMemo(() => {
    const map = new Map<string, TournamentPlayerStats>();

    // Initialize map with all players
    validPlayers.forEach((p) => {
      map.set(p.id, {
        player: p,
        tournamentsPlayed: 0,
        titles: 0,
        runnersUp: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesPlayed: 0,
        winRate: 0,
        points: 0,
      });
    });

    // Iterate across all tournaments
    tournaments.forEach((t) => {
      // Participation
      t.playerIds.forEach((pid) => {
        const stat = map.get(pid);
        if (stat) stat.tournamentsPlayed += 1;
      });

      // Champion & Runner-up bonus points
      if (t.status === 'completed') {
        if (t.championId && map.has(t.championId)) {
          const champ = map.get(t.championId)!;
          champ.titles += 1;
          champ.points += 5; // +5 pts per title
        }
        if (t.runnerUpId && map.has(t.runnerUpId)) {
          const runner = map.get(t.runnerUpId)!;
          runner.runnersUp += 1;
          runner.points += 2; // +2 pts per runner-up
        }
      }

      // Matches stats
      t.matches.forEach((m) => {
        if (m.status === 'completed' && m.winnerId) {
          if (m.player1Id && map.has(m.player1Id)) {
            const s1 = map.get(m.player1Id)!;
            s1.matchesPlayed += 1;
            if (m.winnerId === m.player1Id) {
              s1.matchesWon += 1;
              s1.points += 3; // +3 pts per Bo3 win
            } else {
              s1.matchesLost += 1;
            }
          }
          if (m.player2Id && map.has(m.player2Id)) {
            const s2 = map.get(m.player2Id)!;
            s2.matchesPlayed += 1;
            if (m.winnerId === m.player2Id) {
              s2.matchesWon += 1;
              s2.points += 3; // +3 pts per Bo3 win
            } else {
              s2.matchesLost += 1;
            }
          }
        }
      });
    });

    // Compute winrates and sort
    const list = Array.from(map.values()).map((item) => ({
      ...item,
      winRate: item.matchesPlayed > 0 ? Math.round((item.matchesWon / item.matchesPlayed) * 100) : 0,
    }));

    return list.sort((a, b) => {
      if (b.titles !== a.titles) return b.titles - a.titles;
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.tournamentsPlayed - a.tournamentsPlayed;
    });
  }, [tournaments, players]);

  // Filtered ranking list
  const filteredRanking = useMemo(() => {
    return tournamentStats.filter((item) => {
      if (onlyPlayedTournaments && item.tournamentsPlayed === 0 && item.matchesPlayed === 0) {
        return false;
      }
      if (rankingSearch.trim()) {
        const query = rankingSearch.toLowerCase();
        const nameMatch = item.player.name.toLowerCase().includes(query);
        const userMatch = item.player.username.toLowerCase().includes(query);
        return nameMatch || userMatch;
      }
      return true;
    });
  }, [tournamentStats, onlyPlayedTournaments, rankingSearch]);

  // Overall statistics for banner
  const rankingSummary = useMemo(() => {
    const playersWithActivity = tournamentStats.filter((s) => s.tournamentsPlayed > 0 || s.matchesPlayed > 0);
    const kingOfCups = tournamentStats.find((s) => s.titles > 0);
    const bestWinrate = [...playersWithActivity]
      .filter((s) => s.matchesPlayed >= 2)
      .sort((a, b) => b.winRate - a.winRate)[0];

    const totalMatchesPlayed = tournaments.reduce((acc, t) => {
      return acc + t.matches.filter((m) => m.status === 'completed').length;
    }, 0);

    return {
      activePlayersCount: playersWithActivity.length,
      kingOfCups,
      bestWinrate,
      totalMatchesPlayed,
    };
  }, [tournamentStats, tournaments]);

  // Filtered past tournaments
  const filteredHistory = useMemo(() => {
    return pastTournaments.filter((t) => {
      if (historyFormat !== 'all' && t.format !== historyFormat) {
        return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const champ = t.championId ? playerMap.get(t.championId)?.name.toLowerCase() : '';
        const nameMatch = t.name.toLowerCase().includes(q);
        const champMatch = champ ? champ.includes(q) : false;
        return nameMatch || champMatch;
      }
      return true;
    });
  }, [pastTournaments, historyFormat, historySearch, playerMap]);

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringMatch) return;
    if (score1 === score2) {
      setModalError('En eliminatorias Bo3 debe haber un ganador (no se permiten empates).');
      return;
    }

    setSavingScore(true);
    setModalError(null);

    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: scoringMatch.tournamentId,
          matchId: scoringMatch.match.id,
          player1Score: score1,
          player2Score: score2,
          player1Inks: [p1Ink1, p1Ink2],
          player2Inks: [p2Ink1, p2Ink2],
          notes: matchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar resultado');
      }

      setScoringMatch(null);
      window.location.reload();
    } catch (err: any) {
      setModalError(err.message || 'Error de conexión');
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Torneos Oficiales & Copas CCREW</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {pastTournaments.length} torneos finalizados
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Torneos de Disney Lorcana</span>
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
              Copas especiales independientes de la liga semanal. Ranking exclusivo de eliminatorias Bo3, finales de infarto y coronación de campeones.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all self-start md:self-auto"
            >
              <Shield className="w-4 h-4" />
              <span>Crear o Gestionar Torneo</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'active'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Torneo en Curso</span>
          {activeTournament ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          ) : (
            <span className="text-[10px] text-slate-500 ml-1">(0)</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'ranking'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Ranking de Torneos</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            {rankingSummary.activePlayersCount || players.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Historial Pasado ({pastTournaments.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* --- TAB 1: TORNEO EN CURSO / EN VIVO --- */}
      {/* ========================================================= */}
      {activeTab === 'active' && (
        <div>
          {activeTournament ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/70 border border-amber-500/20 p-5 rounded-2xl shadow-lg">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      EN DISPUTA
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      Formato: {LORCANA_FORMATS[activeTournament.format]?.label || activeTournament.format}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      {activeTournament.type === 'swiss' ? '🛡️ Sistema Suizo' : '⚔️ Eliminatoria Directa'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeTournament.playerIds.length} participantes
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{activeTournament.name}</h2>
                  {activeTournament.description && (
                    <p className="text-xs text-slate-400 mt-1">{activeTournament.description}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Fecha del evento</span>
                  <span className="text-sm font-semibold text-slate-300">{activeTournament.date}</span>
                </div>
              </div>

              {activeTournament.type === 'swiss' ? (
                <TournamentSwissView
                  tournament={activeTournament}
                  players={players}
                  currentUser={currentUser}
                />
              ) : (
                <TournamentBracket
                  tournament={activeTournament}
                  players={players}
                  currentUser={currentUser}
                  onEditMatch={(m) => {
                    const p1 = m.player1Id ? playerMap.get(m.player1Id) : null;
                    const p2 = m.player2Id ? playerMap.get(m.player2Id) : null;
                    setScoringMatch({ match: m, tournamentId: activeTournament.id });
                    setScore1(m.player1Score || 2);
                    setScore2(m.player2Score || 0);
                    setP1Ink1(m.player1Inks?.[0] || p1?.primaryInk || 'Amber');
                    setP1Ink2(m.player1Inks?.[1] || p1?.secondaryInk || 'Steel');
                    setP2Ink1(m.player2Inks?.[0] || p2?.primaryInk || 'Amber');
                    setP2Ink2(m.player2Inks?.[1] || p2?.secondaryInk || 'Steel');
                    setMatchNotes(m.notes || '');
                  }}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Swords className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No hay ningún torneo activo ahora mismo</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Cuando el Comisionado cree un nuevo torneo eliminatorio, podrás seguir los cruces y resultados Bo3 en vivo aquí.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab('ranking')}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Ver Ranking de Torneos
                </button>
                {pastTournaments.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Ver Historial Pasado ({pastTournaments.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* --- TAB 2: RANKING DE TORNEOS --- */}
      {/* ========================================================= */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          {/* Summary Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Torneos Jugados</span>
                <span className="text-xl font-black text-white">{pastTournaments.length}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Rey de Copas</span>
                <span className="text-sm font-black text-white truncate max-w-[120px] block">
                  {rankingSummary.kingOfCups ? rankingSummary.kingOfCups.player.name : 'Aún vacante'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Mayor Winrate</span>
                <span className="text-sm font-black text-white truncate max-w-[120px] block">
                  {rankingSummary.bestWinrate
                    ? `${rankingSummary.bestWinrate.player.name} (${rankingSummary.bestWinrate.winRate}%)`
                    : 'Sin datos'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Partidas Bo3 Jugadas</span>
                <span className="text-xl font-black text-white">{rankingSummary.totalMatchesPlayed}</span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium if there are tournament title/match holders */}
          {tournamentStats.some((s) => s.titles > 0 || s.matchesWon > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {tournamentStats[1] && (
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-700/60 p-5 rounded-3xl flex flex-col items-center text-center relative overflow-hidden shadow-lg">
                  <span className="text-2xl mb-2">🥈</span>
                  <AvatarBadge
                    avatarId={tournamentStats[1].player.avatar}
                    name={tournamentStats[1].player.name}
                    size="lg"
                  />
                  <h4 className="mt-2 font-black text-white text-base">{tournamentStats[1].player.name}</h4>
                  <span className="text-xs text-slate-400 mb-2">@{tournamentStats[1].player.username}</span>

                  <DualInkBadge
                    primary={tournamentStats[1].player.primaryInk}
                    secondary={tournamentStats[1].player.secondaryInk}
                    visibility={tournamentStats[1].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === tournamentStats[1].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />

                  <div className="mt-4 pt-3 border-t border-slate-800 w-full grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">TÍTULOS</span>
                      <span className="text-xs font-bold text-white">{tournamentStats[1].titles}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">WINRATE</span>
                      <span className="text-xs font-bold text-amber-400">{tournamentStats[1].winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">PUNTOS</span>
                      <span className="text-xs font-bold text-emerald-400">{tournamentStats[1].points} pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {tournamentStats[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 border-2 border-amber-500/50 p-5 sm:p-6 rounded-3xl flex flex-col items-center text-center relative overflow-hidden shadow-2xl md:-mt-2">
                  <div className="absolute top-2 right-3 text-amber-400 text-xs font-black uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    LÍDER
                  </div>
                  <span className="text-4xl mb-2 animate-bounce">👑</span>
                  <AvatarBadge
                    avatarId={tournamentStats[0].player.avatar}
                    name={tournamentStats[0].player.name}
                    size="xl"
                  />
                  <h4 className="mt-2 font-black text-white text-lg">{tournamentStats[0].player.name}</h4>
                  <span className="text-xs text-amber-300 mb-2">@{tournamentStats[0].player.username}</span>

                  <DualInkBadge
                    primary={tournamentStats[0].player.primaryInk}
                    secondary={tournamentStats[0].player.secondaryInk}
                    visibility={tournamentStats[0].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === tournamentStats[0].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />

                  <div className="mt-5 pt-3 border-t border-amber-500/30 w-full grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="text-[10px] text-amber-300/80 block">TÍTULOS</span>
                      <span className="text-sm font-black text-white flex items-center justify-center gap-1">
                        🏆 {tournamentStats[0].titles}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300/80 block">WINRATE</span>
                      <span className="text-sm font-black text-amber-400">{tournamentStats[0].winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300/80 block">PUNTOS</span>
                      <span className="text-sm font-black text-emerald-400">{tournamentStats[0].points} pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {tournamentStats[2] && (
                <div className="order-3 bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 p-5 rounded-3xl flex flex-col items-center text-center relative overflow-hidden shadow-lg">
                  <span className="text-2xl mb-2">🥉</span>
                  <AvatarBadge
                    avatarId={tournamentStats[2].player.avatar}
                    name={tournamentStats[2].player.name}
                    size="lg"
                  />
                  <h4 className="mt-2 font-black text-white text-base">{tournamentStats[2].player.name}</h4>
                  <span className="text-xs text-slate-400 mb-2">@{tournamentStats[2].player.username}</span>

                  <DualInkBadge
                    primary={tournamentStats[2].player.primaryInk}
                    secondary={tournamentStats[2].player.secondaryInk}
                    visibility={tournamentStats[2].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === tournamentStats[2].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />

                  <div className="mt-4 pt-3 border-t border-slate-800 w-full grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">TÍTULOS</span>
                      <span className="text-xs font-bold text-white">{tournamentStats[2].titles}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">WINRATE</span>
                      <span className="text-xs font-bold text-amber-400">{tournamentStats[2].winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">PUNTOS</span>
                      <span className="text-xs font-bold text-emerald-400">{tournamentStats[2].points} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar jugador por nombre o alias..."
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setOnlyPlayedTournaments(!onlyPlayedTournaments)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  onlyPlayedTournaments
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {onlyPlayedTournaments ? 'Mostrando con Torneos' : 'Mostrando Todos los Miembros'}
              </button>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 text-center w-12">#</th>
                    <th className="py-3.5 px-4">Jugador</th>
                    <th className="py-3.5 px-4 text-center">Torneos</th>
                    <th className="py-3.5 px-4 text-center">🏆 Títulos</th>
                    <th className="py-3.5 px-4 text-center">🥈 Subcampeón</th>
                    <th className="py-3.5 px-4 text-center">Partidas Bo3</th>
                    <th className="py-3.5 px-4 text-center">% Victoria</th>
                    <th className="py-3.5 px-4 text-right pr-6">Puntos de Copa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRanking.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No se encontraron jugadores con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRanking.map((item, index) => {
                      const isPodium = index < 3;
                      const podiumMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                      return (
                        <tr
                          key={item.player.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            index === 0 ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {podiumMedal ? (
                              <span className="text-base">{podiumMedal}</span>
                            ) : (
                              <span className="text-slate-500">{index + 1}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <AvatarBadge
                                avatarId={item.player.avatar}
                                name={item.player.name}
                                size="sm"
                              />
                              <div>
                                <span className="font-bold text-white block hover:text-amber-300 transition-colors">
                                  {item.player.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-500">@{item.player.username}</span>
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

                          <td className="py-3 px-4 text-center font-mono font-medium text-slate-300">
                            {item.tournamentsPlayed}
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                            {item.titles > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs">
                                🏆 {item.titles}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {item.runnersUp > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full text-xs">
                                🥈 {item.runnersUp}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-300">
                            <span className="text-emerald-400 font-semibold">{item.matchesWon}G</span>
                            {' - '}
                            <span className="text-rose-400 font-semibold">{item.matchesLost}P</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-bold text-slate-200">{item.winRate}%</span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                                  style={{ width: `${item.winRate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right pr-6 font-mono font-black text-amber-300 text-sm">
                            {item.points} <span className="text-[10px] text-slate-500 font-normal">pts</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Points System Explanation Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sistema de Puntuación de Copas:
              </span>
              <div className="flex items-center gap-4 flex-wrap">
                <span>🏆 Campeón: <strong className="text-amber-400">+5 pts</strong></span>
                <span>🥈 Subcampeón: <strong className="text-slate-300">+2 pts</strong></span>
                <span>⚔️ Victoria en Bo3: <strong className="text-emerald-400">+3 pts</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --- TAB 3: HISTORIAL PASADO (PALMARÉS) --- */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar torneo o campeón..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Formato:
              </span>
              <button
                onClick={() => setHistoryFormat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  historyFormat === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Todos
              </button>
              {Object.entries(LORCANA_FORMATS).map(([key, f]) => (
                <button
                  key={key}
                  onClick={() => setHistoryFormat(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    historyFormat === key
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto shadow-xl">
              <Crown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                {pastTournaments.length === 0 ? 'El Palmarés está vacío' : 'No hay torneos que coincidan'}
              </h3>
              <p className="text-xs text-slate-400">
                {pastTournaments.length === 0
                  ? 'Los torneos finalizados se guardarán aquí automáticamente con su campeón, podio y cuadro completo de resultados.'
                  : 'Prueba a cambiar el filtro de formato o limpiar el término de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((t) => {
                const champ = t.championId ? playerMap.get(t.championId) : null;
                const runner = t.runnerUpId ? playerMap.get(t.runnerUpId) : null;
                const isExpanded = expandedTournamentId === t.id;

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 rounded-2xl overflow-hidden shadow-xl transition-all"
                  >
                    {/* Header Row */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {t.date}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              {LORCANA_FORMATS[t.format]?.label || t.format}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {t.type === 'swiss' ? '🛡️ Suizo' : '⚔️ Playoffs'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {t.playerIds.length} participantes
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white">{t.name}</h3>
                          {t.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Winners Preview */}
                      <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                        {champ && (
                          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-amber-500/40 px-3.5 py-2 rounded-xl">
                            <span className="text-lg">👑</span>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-amber-400 block leading-tight">
                                CAMPEÓN
                              </span>
                              <span className="text-xs font-bold text-white">{champ.name}</span>
                            </div>
                          </div>
                        )}

                        {runner && (
                          <div className="flex items-center gap-2.5 bg-slate-950/50 border border-slate-800 px-3 py-2 rounded-xl">
                            <span className="text-sm">🥈</span>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                                SUBCAMPEÓN
                              </span>
                              <span className="text-xs font-medium text-slate-300">{runner.name}</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedTournamentId(isExpanded ? null : t.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <span>{isExpanded ? 'Ocultar Cuadro' : 'Ver Cuadro Completo'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Bracket or Swiss View */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 animate-in fade-in duration-200">
                        {t.type === 'swiss' ? (
                          <TournamentSwissView
                            tournament={t}
                            players={players}
                            currentUser={currentUser}
                          />
                        ) : (
                          <TournamentBracket
                            tournament={t}
                            players={players}
                            currentUser={currentUser}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* --- MODAL: SCORING TOURNAMENT MATCH (ADMIN) --- */}
      {/* ========================================================= */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setScoringMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Anotar Resultado de Torneo</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{scoringMatch.match.roundName} (Bo3)</p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                    {playerMap.get(scoringMatch.match.player1Id || '')?.name || 'Jugador 1'}
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
                    {playerMap.get(scoringMatch.match.player2Id || '')?.name || 'Jugador 2'}
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
                      label: `${playerMap.get(scoringMatch.match.player1Id || '')?.name || 'P1'} 2 - 0`,
                      s1: 2,
                      s2: 0,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.match.player1Id || '')?.name || 'P1'} 2 - 1`,
                      s1: 2,
                      s2: 1,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.match.player2Id || '')?.name || 'P2'} 2 - 1`,
                      s1: 1,
                      s2: 2,
                    },
                    {
                      label: `${playerMap.get(scoringMatch.match.player2Id || '')?.name || 'P2'} 2 - 0`,
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

              {/* Inks Pickers for Meta Stats */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Colores de baraja jugados (Meta Report)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium block truncate">
                      {playerMap.get(scoringMatch.match.player1Id || '')?.name || 'Jugador 1'}:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={p1Ink1}
                        onChange={(e) => setP1Ink1(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                        ))}
                      </select>
                      <select
                        value={p1Ink2}
                        onChange={(e) => setP1Ink2(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium block truncate">
                      {playerMap.get(scoringMatch.match.player2Id || '')?.name || 'Jugador 2'}:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={p2Ink1}
                        onChange={(e) => setP2Ink1(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                        ))}
                      </select>
                      <select
                        value={p2Ink2}
                        onChange={(e) => setP2Ink2(e.target.value as InkType)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                      >
                        {ALL_INKS.map((ink) => (
                          <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas de la partida</label>
                <input
                  type="text"
                  placeholder="Ej. Final muy ajustada decidida en el turno 6"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-600"
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
                  disabled={savingScore}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingScore ? 'Avanzando ganador...' : 'Confirmar & Avanzar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
