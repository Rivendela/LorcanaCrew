import React from 'react';
import { getActiveLeague, getMatches, getRounds, getUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';
import { JornadasClient } from './JornadasClient';
import Link from 'next/link';

export default async function JornadasPage() {
  const league = await getActiveLeague();
  const allUsers = await getUsers();
  const players = allUsers.filter((u) => u.role === 'player');
  const currentUser = await getCurrentUser();

  if (!league) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-2">No hay jornadas activas</h1>
        <p className="text-xs text-slate-400 mb-6">
          Aún no se ha generado ninguna temporada. Cuando el Comisionado cree la liga, los cruces semanales aparecerán aquí.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-xs hover:from-amber-300 hover:to-amber-200 shadow-md"
        >
          Ir al Panel de Comisionado
        </Link>
      </div>
    );
  }

  const rounds = await getRounds(league.id);
  const matches = await getMatches(league.id);

  return (
    <JornadasClient
      league={league}
      rounds={rounds}
      initialMatches={matches}
      players={players}
      currentUser={currentUser}
    />
  );
}
