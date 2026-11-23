import React from 'react';
import { getActiveLeague, getMatches, getRounds, getUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';
import { calculateStandings } from '@/lib/league-engine';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge, InkBadge } from '@/components/InkBadge';
import { Users, Swords, Trophy, Sparkles, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

export default async function JugadoresPage() {
  const league = await getActiveLeague();
  const allUsers = await getUsers();
  const players = allUsers.filter((u) => u.role === 'player');
  const session = await getCurrentUser();
  const currentUser = session ? (allUsers.find((u) => u.id === session.userId || u.id === session.id) ?? null) : null;
  const matches = league ? await getMatches(league.id) : [];
  const rounds = league ? await getRounds(league.id) : [];

  const standings = calculateStandings(
    players,
    matches,
    league?.pointsWin || 3,
    league?.pointsDraw || 1,
    league?.pointsLoss || 0,
    rounds
  );

  const standingsMap = new Map(standings.map((s) => [s.player.id, s]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comunidad de Iluminadores</h1>
              <p className="text-xs text-slate-400">
                {players.length} jugadores registrados en la liga
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {currentUser && (
            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Mi Perfil</span>
            </Link>
          )}
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Registrar Nuevo Jugador</span>
          </Link>
        </div>
      </div>

      {/* Grid of Players */}
      {players.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Aún no hay jugadores registrados</h2>
          <p className="text-xs text-slate-400 mb-6">Invita a los amigos del Crew a crear su perfil.</p>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 rounded-xl font-bold text-xs hover:from-amber-300 hover:to-amber-200 shadow-md"
          >
            Registrar Primer Jugador
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => {
            const stats = standingsMap.get(p.id);
            const isSelf = currentUser?.id === p.id;
            const canSeeInks = isSelf || currentUser?.role === 'admin';

            return (
              <div
                key={p.id}
                className={`bg-slate-900/60 border rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.01] ${
                  isSelf ? 'border-amber-500/50 bg-slate-900/80' : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatarId={p.avatar} name={p.name} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base leading-tight">{p.name}</h3>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                            TÚ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">@{p.username}</p>
                      <div className="mt-1.5">
                        <DualInkBadge
                          primary={p.primaryInk}
                          secondary={p.secondaryInk}
                          visibility={p.inksVisibility}
                          isOwnerOrAdmin={canSeeInks}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  {stats && stats.position <= 3 && (
                    <span className="text-xl" title={`Posición #${stats.position}`}>
                      {stats.position === 1 ? '🥇' : stats.position === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>

                {/* Lore / Favorite Card */}
                {p.favoriteCard && (
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800/60">
                    <span className="text-amber-400">✨</span>
                    <span className="truncate">{p.favoriteCard}</span>
                  </div>
                )}

                {/* Player Match Stats */}
                {stats && (
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold">PUNTOS</span>
                      <span className="font-mono font-bold text-amber-400">{stats.points}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold">V - D</span>
                      <span className="font-mono text-slate-300">
                        {stats.matchesWon} - {stats.matchesLost}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold">PARTIDAS</span>
                      <span className="font-mono text-slate-300">{stats.gameWinRate}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
