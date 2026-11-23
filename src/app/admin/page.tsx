import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getActiveLeague, getMatches, getRounds, getUsers } from '@/lib/db';
import { AdminClient } from './AdminClient';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default async function AdminPage() {
  const session = await getCurrentUser();

  if (!session || session.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
        <p className="text-sm text-slate-400 mb-6">
          Solo el Comisionado de la liga (cuenta de administrador) puede acceder a este panel.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400"
        >
          Iniciar sesión como Admin
        </Link>
      </div>
    );
  }

  const league = await getActiveLeague();
  const allUsers = await getUsers();
  const players = allUsers.filter((u) => u.role === 'player');
  const rounds = league ? await getRounds(league.id) : [];
  const matches = league ? await getMatches(league.id) : [];

  return (
    <AdminClient
      league={league}
      players={players}
      rounds={rounds}
      matches={matches}
      adminUser={session}
    />
  );
}
