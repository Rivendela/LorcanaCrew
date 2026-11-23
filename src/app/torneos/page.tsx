import React from 'react';
import { getTournaments, getUsers } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { TorneosClient } from './TorneosClient';

export const dynamic = 'force-dynamic';

export default async function TorneosPage() {
  const tournaments = await getTournaments();
  const allUsers = await getUsers();
  const currentUser = await getCurrentUser();

  return (
    <TorneosClient
      tournaments={tournaments}
      players={allUsers}
      currentUser={currentUser}
    />
  );
}
