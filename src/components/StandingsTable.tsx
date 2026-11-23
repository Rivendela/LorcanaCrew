import React from 'react';
import { PlayerStanding } from '@/types';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import { Medal } from 'lucide-react';

interface StandingsTableProps {
  standings: PlayerStanding[];
  currentUserId?: string;
  currentUserRole?: string;
}

export function StandingsTable({ standings, currentUserId, currentUserRole }: StandingsTableProps) {
  const getRankBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md shadow-amber-500/10">
          <Medal className="w-4 h-4 text-amber-400" />
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold">
          2
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 font-bold">
          3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 text-slate-500 font-semibold font-mono text-sm">
        {pos}
      </span>
    );
  };

  const getFormBadge = (result: 'W' | 'D' | 'L', idx: number) => {
    if (result === 'W') {
      return (
        <span
          key={idx}
          className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
          title="Victoria"
        >
          V
        </span>
      );
    }
    if (result === 'D') {
      return (
        <span
          key={idx}
          className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold"
          title="Empate"
        >
          E
        </span>
      );
    }
    return (
      <span
        key={idx}
        className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
        title="Derrota"
      >
        D
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900/70 shadow-2xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 pl-4 pr-2 text-center w-12">#</th>
              <th className="py-3.5 px-3">Jugador / Tintas</th>
              <th className="py-3.5 px-2 text-center font-extrabold text-amber-400">PTS</th>
              <th className="py-3.5 px-2 text-center">PJ</th>
              <th className="py-3.5 px-2 text-center text-emerald-400">PG</th>
              <th className="py-3.5 px-2 text-center text-amber-400">PE</th>
              <th className="py-3.5 px-2 text-center text-rose-400">PP</th>
              <th className="py-3.5 px-2 text-center hidden sm:table-cell">GF</th>
              <th className="py-3.5 px-2 text-center hidden sm:table-cell">GC</th>
              <th className="py-3.5 px-2 text-center">+/-</th>
              <th className="py-3.5 px-3 text-center hidden md:table-cell">% Partidas</th>
              <th className="py-3.5 pr-4 pl-2 text-center hidden lg:table-cell">Racha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-slate-300 text-sm">Tabla de Clasificación Preparada</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Las posiciones y puntos de los Iluminadores se calcularán al disputar la Jornada 1.
                  </p>
                </td>
              </tr>
            ) : (
              standings.map((item) => (
              <tr
                key={item.player.id}
                className="hover:bg-amber-500/[0.04] transition-colors group"
              >
                {/* Position */}
                <td className="py-3 pl-4 pr-2 text-center">
                  <div className="flex justify-center">{getRankBadge(item.position)}</div>
                </td>

                {/* Player details */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatarId={item.player.avatar} name={item.player.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                          {item.player.name}
                        </span>
                        {item.player.role === 'admin' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded font-mono">
                            ADM
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <DualInkBadge
                          primary={item.player.primaryInk}
                          secondary={item.player.secondaryInk}
                          visibility={item.player.inksVisibility}
                          isOwnerOrAdmin={currentUserId === item.player.id || currentUserRole === 'admin'}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Points */}
                <td className="py-3 px-2 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 font-black text-amber-400 font-mono text-base shadow-sm">
                    {item.points}
                  </span>
                </td>

                {/* Matches Played */}
                <td className="py-3 px-2 text-center font-mono text-slate-400">{item.matchesPlayed}</td>

                {/* Matches Won */}
                <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">
                  {item.matchesWon}
                </td>

                {/* Matches Drawn */}
                <td className="py-3 px-2 text-center font-mono text-amber-400/90">{item.matchesDrawn}</td>

                {/* Matches Lost */}
                <td className="py-3 px-2 text-center font-mono text-rose-400/90">{item.matchesLost}</td>

                {/* Games Won (Bo3) */}
                <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">
                  {item.gamesWon}
                </td>

                {/* Games Lost (Bo3) */}
                <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">
                  {item.gamesLost}
                </td>

                {/* Diff */}
                <td className="py-3 px-2 text-center font-mono font-semibold">
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

                {/* Winrate */}
                <td className="py-3 px-3 text-center hidden md:table-cell font-mono text-xs text-slate-400">
                  {item.gameWinRate}%
                </td>

                {/* Form */}
                <td className="py-3 pr-4 pl-2 text-center hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {item.recentForm.length > 0 ? (
                      item.recentForm.map((res, i) => getFormBadge(res, i))
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
