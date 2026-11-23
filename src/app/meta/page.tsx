import React from 'react';
import { getActiveLeague, getMatches, getUsers } from '@/lib/db';
import { MetaStatsView } from '@/components/MetaStatsView';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MetaPage() {
  const league = await getActiveLeague();
  const allUsers = await getUsers();
  const players = allUsers.filter((u) => u.role === 'player');
  const matches = league ? await getMatches(league.id) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Meta y Estadísticas de Tintas</h1>
            <p className="text-xs text-slate-400">
              Análisis del rendimiento de cada color en las partidas Bo3 de la liga
            </p>
          </div>
        </div>
      </div>

      <MetaStatsView matches={matches} players={players} />
    </div>
  );
}
