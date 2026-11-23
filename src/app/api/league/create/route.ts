import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createNewLeague, getUsers } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el comisionado (admin) puede crear o reiniciar ligas' }, { status: 403 });
    }

    const { name, seasonName, playerIds, format } = await req.json();

    if (!name || !seasonName) {
      return NextResponse.json({ error: 'Nombre de liga y temporada requeridos' }, { status: 400 });
    }

    const allUsers = await getUsers();
    const nonAdminUserIds = new Set(allUsers.filter((u) => u.role === 'player').map((u) => u.id));

    let finalPlayerIds: string[] = [];
    if (!playerIds || playerIds.length === 0) {
      finalPlayerIds = Array.from(nonAdminUserIds);
    } else {
      finalPlayerIds = (playerIds as string[]).filter((id) => nonAdminUserIds.has(id));
    }

    if (finalPlayerIds.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 jugadores válidos (el administrador no puede ser jugador)' }, { status: 400 });
    }

    const newLeague = await createNewLeague(name, seasonName, finalPlayerIds, format || 'porcana');

    return NextResponse.json({ success: true, league: newLeague });
  } catch (error) {
    console.error('Create league error:', error);
    return NextResponse.json({ error: 'Error al generar la liga' }, { status: 500 });
  }
}
