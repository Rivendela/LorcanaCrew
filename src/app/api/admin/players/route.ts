import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createUser, deleteUser, getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { username, name, password, avatar, primaryInk, secondaryInk } = await req.json();

    if (!username || !name) {
      return NextResponse.json({ error: 'Nombre y usuario requeridos' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'Ese nombre de usuario ya existe' }, { status: 400 });
    }

    const passwordToHash = password && password.trim() ? password.trim() : 'ccrew123';
    const passwordHash = await hashPassword(passwordToHash);

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      name: name.trim(),
      passwordHash,
      role: 'player',
      avatar: avatar || 'mickey',
      primaryInk: primaryInk || 'Amber',
      secondaryInk: secondaryInk || 'Steel',
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear jugador' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { id, name, username, avatar, primaryInk, secondaryInk, newPassword } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de jugador requerido' }, { status: 400 });
    }

    const updates: Partial<User> = {};
    if (name) updates.name = name.trim();
    if (username) updates.username = username.trim().toLowerCase();
    if (avatar) updates.avatar = avatar;
    if (primaryInk) updates.primaryInk = primaryInk;
    if (secondaryInk) updates.secondaryInk = secondaryInk;

    if (newPassword && newPassword.trim()) {
      updates.passwordHash = await hashPassword(newPassword.trim());
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar jugador' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const success = await deleteUser(id);
    if (!success) {
      return NextResponse.json({ error: 'No se pudo eliminar el jugador o es el administrador principal' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar jugador' }, { status: 500 });
  }
}
