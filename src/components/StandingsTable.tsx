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
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
              <th
                className="py-3.5 pl-4 pr-2 text-center w-12 cursor-help"
                title="Posición actual en la clasificación general de la liga"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  #
                </span>
              </th>
              <th
                className="py-3.5 px-3 cursor-help"
                title="Nombre del Iluminador y gemas con los colores de su mazo"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  Jugador / Tintas
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center font-extrabold text-amber-400 cursor-help"
                title="PUNTOS TOTALES: Victoria Bo3 = 3 pts | Empate = 1 pt | Derrota = 0 pts (se consolidan al cerrar la jornada)"
              >
                <span className="border-b border-dotted border-amber-500/70 hover:border-amber-300 hover:text-amber-300 transition-colors">
                  PTS
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center cursor-help"
                title="PARTIDOS JUGADOS: Número de series Bo3 disputadas en jornadas completadas"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  PJ
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center text-emerald-400 cursor-help"
                title="PARTIDOS GANADOS: Series al Mejor de 3 ganadas (2-0 o 2-1)"
              >
                <span className="border-b border-dotted border-emerald-500/70 hover:border-emerald-300 hover:text-emerald-300 transition-colors">
                  PG
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center text-amber-400 cursor-help"
                title="PARTIDOS EMPATADOS: Series al Mejor de 3 terminadas en tablas (1-1)"
              >
                <span className="border-b border-dotted border-amber-500/70 hover:border-amber-300 hover:text-amber-300 transition-colors">
                  PE
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center text-rose-400 cursor-help"
                title="PARTIDOS PERDIDOS: Series al Mejor de 3 perdidas (0-2 o 1-2)"
              >
                <span className="border-b border-dotted border-rose-500/70 hover:border-rose-300 hover:text-rose-300 transition-colors">
                  PP
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center hidden sm:table-cell cursor-help"
                title="GAMES A FAVOR: Partidas individuales ganadas dentro de las series Bo3"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  GF
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center hidden sm:table-cell cursor-help"
                title="GAMES EN CONTRA: Partidas individuales perdidas dentro de las series Bo3"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  GC
                </span>
              </th>
              <th
                className="py-3.5 px-2 text-center cursor-help"
                title="DIFERENCIAL DE GAMES: Games a Favor menos Games en Contra (+/-). Criterio principal de desempate tras los puntos"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  +/-
                </span>
              </th>
              <th
                className="py-3.5 px-3 text-center hidden md:table-cell cursor-help"
                title="PORCENTAJE DE EFECTIVIDAD: Ratio de games individuales ganados sobre el total de games disputados"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  % Partidas
                </span>
              </th>
              <th
                className="py-3.5 pr-4 pl-2 text-center hidden lg:table-cell cursor-help"
                title="RACHA RECIENTE: Forma en las últimas jornadas jugadas (V = Victoria, E = Empate, D = Derrota)"
              >
                <span className="border-b border-dotted border-slate-600/70 hover:border-amber-400 hover:text-white transition-colors">
                  Racha
                </span>
              </th>
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
                <td className="py-3 px-2 text-center" title={`${item.points} puntos totales (${item.matchesWon} victorias x 3 pts, ${item.matchesDrawn} empates x 1 pt)`}>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 font-black text-amber-400 font-mono text-base shadow-sm">
                    {item.points}
                  </span>
                </td>

                {/* Matches Played */}
                <td className="py-3 px-2 text-center font-mono text-slate-400" title={`${item.matchesPlayed} partidos jugados`}>
                  {item.matchesPlayed}
                </td>

                {/* Matches Won */}
                <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400" title={`${item.matchesWon} partidos ganados (series Bo3)`}>
                  {item.matchesWon}
                </td>

                {/* Matches Drawn */}
                <td className="py-3 px-2 text-center font-mono text-amber-400/90" title={`${item.matchesDrawn} partidos empatados (1-1)`}>
                  {item.matchesDrawn}
                </td>

                {/* Matches Lost */}
                <td className="py-3 px-2 text-center font-mono text-rose-400/90" title={`${item.matchesLost} partidos perdidos`}>
                  {item.matchesLost}
                </td>

                {/* Games Won (Bo3) */}
                <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell" title={`${item.gamesWon} games individuales ganados`}>
                  {item.gamesWon}
                </td>

                {/* Games Lost (Bo3) */}
                <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell" title={`${item.gamesLost} games individuales perdidos`}>
                  {item.gamesLost}
                </td>

                {/* Diff */}
                <td
                  className="py-3 px-2 text-center font-mono font-semibold"
                  title={`Diferencial: ${item.gameDiff > 0 ? `+${item.gameDiff}` : item.gameDiff} (${item.gamesWon} GF - ${item.gamesLost} GC)`}
                >
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
                <td className="py-3 px-3 text-center hidden md:table-cell font-mono text-xs text-slate-400" title={`${item.gameWinRate}% de efectividad en games`}>
                  {item.gameWinRate}%
                </td>

                {/* Form */}
                <td className="py-3 pr-4 pl-2 text-center hidden lg:table-cell" title="Racha de resultados recientes">
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

      {/* Interactive Mobile/Desktop Glossary Footer */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2 select-none">
        <span className="font-semibold text-slate-300 flex items-center gap-1">
          <span>ℹ️</span>
          <span>Pasa el ratón sobre cualquier cabecera para ver su significado:</span>
        </span>
        <div className="flex items-center gap-2.5 flex-wrap text-[10px] text-slate-400">
          <span><strong className="text-amber-400 font-mono">PTS:</strong> Puntos</span>
          <span>•</span>
          <span><strong className="text-slate-300 font-mono">PJ:</strong> Jugados</span>
          <span>•</span>
          <span><strong className="text-emerald-400 font-mono">PG:</strong> Ganados</span>
          <span>•</span>
          <span><strong className="text-amber-400 font-mono">PE:</strong> Empatados</span>
          <span>•</span>
          <span><strong className="text-rose-400 font-mono">PP:</strong> Perdidos</span>
          <span>•</span>
          <span><strong className="text-slate-300 font-mono">GF/GC:</strong> Games +/-</span>
          <span>•</span>
          <span><strong className="text-slate-300 font-mono">{'+/-:'}</strong> Diferencia</span>
        </div>
      </div>
    </div>
  );
}
