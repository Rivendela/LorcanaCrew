import React from 'react';
import { InkType, Match, TournamentMatch, User } from '@/types';
import { calculateMetaStats } from '@/lib/league-engine';
import { LORCANA_INKS } from '@/lib/constants';
import { BarChart2, ShieldCheck, Flame, Sparkles } from 'lucide-react';

interface MetaStatsViewProps {
  matches: Match[];
  players: User[];
  tournamentMatches?: TournamentMatch[];
}

export function MetaStatsView({ matches, players, tournamentMatches = [] }: MetaStatsViewProps) {
  const stats = calculateMetaStats(matches, players, tournamentMatches);

  // Sort by win rate DESC
  const sortedStats = [...stats].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-amber-500/20 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tinta Más Dominante</p>
              <h4 className="text-lg font-bold text-white">
                {sortedStats[0]?.ink ? LORCANA_INKS[sortedStats[0].ink].label : '-'}
              </h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">
            {sortedStats[0]?.winRate || 0}% de victorias en el grupo
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Partidas Bo3 Jugadas</p>
              <h4 className="text-lg font-bold text-white">
                {matches.filter((m) => m.status === 'completed').length}
              </h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">
            {matches.filter((m) => m.status === 'pending').length} encuentros pendientes
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Jugadores Registrados</p>
              <h4 className="text-lg font-bold text-white">{players.length} Amigos</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">Formato Competitivo Bo3</p>
        </div>
      </div>

      {/* Inks Performance Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Rendimiento por Tintas de Lorcana</h3>
          </div>
          <span className="text-xs text-slate-400">Ordenado por % de victoria</span>
        </div>

        <div className="space-y-5">
          {sortedStats.map((item) => {
            const info = LORCANA_INKS[item.ink];
            return (
              <div key={item.ink} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${info.accentColor}`} />
                    <span className="font-semibold text-slate-200">
                      {info.label} <span className="text-xs text-slate-500">({item.ink})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">
                      {item.won}W / {item.played - item.won}L ({item.played} jugadas)
                    </span>
                    <span className="font-bold text-amber-400 w-12 text-right">
                      {item.winRate}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${info.bgGradient} ${info.accentColor} transition-all duration-500`}
                    style={{ width: `${Math.max(5, item.winRate)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
