import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getActiveLeague, getMatches, getRounds, getUsers } from '@/lib/db';
import { calculateStandings } from '@/lib/league-engine';
import { StandingsTable } from '@/components/StandingsTable';
import { MatchCard } from '@/components/MatchCard';
import { getCurrentUser } from '@/lib/auth';
import { Trophy, Calendar, Sparkles, ChevronRight, Swords, User, Lock, Eye, Shield } from 'lucide-react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge } from '@/components/InkBadge';
import { LORCANA_FORMATS } from '@/lib/constants';

export default async function HomePage() {
  const league = await getActiveLeague();
  const allUsers = await getUsers();
  const players = allUsers.filter((u) => u.role === 'player');
  const session = await getCurrentUser();
  const currentUser = session ? (allUsers.find((u) => u.id === session.userId || u.id === session.id) ?? null) : null;

  const rounds = league ? await getRounds(league.id) : [];
  const matches = league ? await getMatches(league.id) : [];
  const standings = calculateStandings(
    players,
    matches,
    league?.pointsWin || 3,
    league?.pointsDraw || 1,
    league?.pointsLoss || 0,
    rounds
  );

  const currentRound = rounds.find((r) => r.isCurrent) || rounds[0];
  const currentMatches = matches.filter((m) => m.roundId === currentRound?.id);

  // Top 3 with actual points or matches played
  const hasFinishedMatches = matches.some((m) => m.status === 'completed');
  const top3 = hasFinishedMatches ? standings.slice(0, 3) : [];
  const playerMap = new Map(allUsers.map((u) => [u.id, u]));

  const formatKey = league?.format || 'porcana';
  const formatInfo = LORCANA_FORMATS[formatKey] || LORCANA_FORMATS.porcana;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 p-5 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{league ? league.seasonName : 'Temporada 1 en preparación'}</span>
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider ${formatInfo.badgeClass}`}>
                Formato: {formatInfo.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                Bo3
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{league ? league.name : 'CCREW - Caldereta Crew'}</span>
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
              {league
                ? league.description
                : 'Liga oficial de Disney Lorcana para el grupo Caldereta Crew. Victoria (3 pts), Empate (1 pt), Derrota (0 pts).'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentRound ? (
              <Link
                href="/jornadas"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                <span>Ver Jornada Actual ({currentRound.title})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : currentUser?.role === 'admin' ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
              >
                <Shield className="w-4 h-4" />
                <span>Configurar y Lanzar Temporada</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                <span>Esperando a que el Comisionado lance la Jornada 1</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Quick Hub (If logged in) */}
      {currentUser && (
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <AvatarBadge avatarId={currentUser.avatar} name={currentUser.name} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-base truncate">{currentUser.name}</span>
                <span className="text-xs text-slate-400">@{currentUser.username}</span>
                {currentUser.role === 'admin' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <DualInkBadge
                  primary={currentUser.primaryInk}
                  secondary={currentUser.secondaryInk}
                  visibility="public"
                  size="sm"
                />
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  {currentUser.inksVisibility === 'private' ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Colores en secreto (Privado)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Colores visibles (Público)</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/perfil"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Ver mi Perfil & Estadísticas</span>
            </Link>
          </div>
        </div>
      )}

      {/* Guest Notice (If not logged in) */}
      {!currentUser && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-300">
            ¿Eres miembro de Caldereta Crew? Inicia sesión o regístrate para tener tu ficha de jugador.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors"
            >
              Crear Perfil
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      )}

      {/* Top 3 Podium (Only if matches have been completed) */}
      {top3.length >= 3 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Podio de la Liga</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 */}
            <div className="order-2 md:order-1 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-xl text-slate-200 shrink-0">
                2º
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-100 truncate">{top3[1].player.name}</p>
                <div className="mt-1">
                  <DualInkBadge
                    primary={top3[1].player.primaryInk}
                    secondary={top3[1].player.secondaryInk}
                    visibility={top3[1].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === top3[1].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  <strong className="text-white">{top3[1].points} pts</strong> • {top3[1].matchesWon}V - {top3[1].matchesLost}D
                </p>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/15 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl flex items-center gap-4 md:scale-[1.02]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center font-black text-2xl text-amber-300 shrink-0 shadow-lg shadow-amber-500/20">
                👑
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-0.5">
                  Líder Actual
                </span>
                <p className="font-extrabold text-lg text-white truncate">{top3[0].player.name}</p>
                <div className="mt-1">
                  <DualInkBadge
                    primary={top3[0].player.primaryInk}
                    secondary={top3[0].player.secondaryInk}
                    visibility={top3[0].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === top3[0].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  <strong className="text-amber-400 text-sm">{top3[0].points} pts</strong> • {top3[0].matchesWon}V - {top3[0].matchesLost}D
                </p>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="order-3 md:order-3 bg-slate-900/60 border border-amber-800/40 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-700/50 flex items-center justify-center font-black text-xl text-amber-500 shrink-0">
                3º
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-100 truncate">{top3[2].player.name}</p>
                <div className="mt-1">
                  <DualInkBadge
                    primary={top3[2].player.primaryInk}
                    secondary={top3[2].player.secondaryInk}
                    visibility={top3[2].player.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === top3[2].player.id || currentUser?.role === 'admin'}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  <strong className="text-white">{top3[2].points} pts</strong> • {top3[2].matchesWon}V - {top3[2].matchesLost}D
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Standings Table (ALWAYS VISIBLE!) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Tabla de Clasificación General</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Puntos: Victoria (3 pts), Empate (1 pt), Derrota (0 pts). Criterio de desempate: Puntos &gt; +/- Partidas Bo3 &gt; Cara a Cara.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
            {players.length} Iluminadores en el Crew
          </span>
        </div>

        <StandingsTable
          standings={standings}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
        />
      </div>

      {/* Current Round Preview (If rounds exist) */}
      {currentRound && currentMatches.length > 0 && (
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span>Partidos de la Semana ({currentRound.title})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Del {currentRound.startDate} al {currentRound.endDate}
              </p>
            </div>
            <Link
              href="/jornadas"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver todas las jornadas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentMatches.map((match) => {
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
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
