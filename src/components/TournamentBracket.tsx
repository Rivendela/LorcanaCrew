'use client';

import React from 'react';
import { Tournament, TournamentMatch, User } from '@/types';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import { Trophy, Crown, Swords, CheckCircle2, Clock, Edit3 } from 'lucide-react';

interface TournamentBracketProps {
  tournament: Tournament;
  players: User[];
  currentUser?: { id: string; role: 'admin' | 'player' } | null;
  onEditMatch?: (match: TournamentMatch) => void;
}

export function TournamentBracket({
  tournament,
  players,
  currentUser,
  onEditMatch,
}: TournamentBracketProps) {
  const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));

  // Group matches by round level
  const levels = Array.from(new Set(tournament.matches.map((m) => m.roundLevel))).sort(
    (a, b) => a - b
  );

  const champion = tournament.championId ? playerMap.get(tournament.championId) : null;
  const runnerUp = tournament.runnerUpId ? playerMap.get(tournament.runnerUpId) : null;

  return (
    <div className="space-y-8">
      {/* Champion Podium if Completed */}
      {tournament.status === 'completed' && champion && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-950/30 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
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
                  🏆 ¡Campeón del Torneo!
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
              <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-4 py-3 rounded-2xl">
                <AvatarBadge avatarId={runnerUp.avatar} name={runnerUp.name} size="md" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subcampeón 🥈</span>
                  <p className="font-semibold text-slate-200 text-xs">{runnerUp.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bracket Rounds Grid */}
      <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-fr gap-6 items-stretch overflow-x-auto pb-4">
        {levels.map((level) => {
          const roundMatches = tournament.matches
            .filter((m) => m.roundLevel === level)
            .sort((a, b) => a.matchIndex - b.matchIndex);
          const roundName = roundMatches[0]?.roundName || `Ronda ${level}`;

          return (
            <div key={level} className="flex flex-col min-w-[260px] space-y-4">
              {/* Round Header */}
              <div className="text-center py-2 px-3 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                  {roundName}
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {roundMatches.filter((m) => m.status === 'completed').length} / {roundMatches.length} completados
                </span>
              </div>

              {/* Match Cards in this Column */}
              <div className="flex-1 flex flex-col justify-around gap-4">
                {roundMatches.map((match) => {
                  const p1 = match.player1Id ? playerMap.get(match.player1Id) : null;
                  const p2 = match.player2Id ? playerMap.get(match.player2Id) : null;
                  const isCompleted = match.status === 'completed';
                  const isReady = !!(match.player1Id && match.player2Id);
                  const p1Won = isCompleted && match.winnerId === match.player1Id;
                  const p2Won = isCompleted && match.winnerId === match.player2Id;

                  return (
                    <div
                      key={match.id}
                      className={`rounded-2xl border p-3.5 transition-all relative ${
                        isCompleted
                          ? 'bg-slate-900/80 border-slate-800 shadow-md'
                          : isReady
                          ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50 shadow-lg'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      {/* Match Header Badge */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-mono">
                        <span>M#{match.matchIndex + 1}</span>
                        {isCompleted ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Finalizado
                          </span>
                        ) : isReady ? (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" /> Pendiente Bo3
                          </span>
                        ) : (
                          <span>Esperando cruces</span>
                        )}
                      </div>

                      {/* Player 1 Row */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                          p1Won
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                            : 'bg-slate-950/60 border border-slate-850 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {p1 ? (
                            <>
                              <AvatarBadge avatarId={p1.avatar} name={p1.name} size="sm" />
                              <span className="text-xs truncate">{p1.name}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 italic">Por determinar</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs ml-2">
                          {isCompleted ? match.player1Score : '-'}
                        </span>
                      </div>

                      {/* Player 2 Row */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-xl mt-1.5 transition-all ${
                          p2Won
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                            : 'bg-slate-950/60 border border-slate-850 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {p2 ? (
                            <>
                              <AvatarBadge avatarId={p2.avatar} name={p2.name} size="sm" />
                              <span className="text-xs truncate">{p2.name}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 italic">Por determinar</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs ml-2">
                          {isCompleted ? match.player2Score : '-'}
                        </span>
                      </div>

                      {/* Admin Score Button */}
                      {currentUser?.role === 'admin' && isReady && onEditMatch && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-end">
                          <button
                            onClick={() => onEditMatch(match)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isCompleted ? 'Editar Marcador' : 'Anotar Resultado'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
