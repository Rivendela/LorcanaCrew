import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { username, name, password, avatar, primaryInk, secondaryInk, deckName } = await req.json();

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Todos los campos obligatorios deben completarse' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      name: name.trim(),
      passwordHash,
      role: 'player',
      avatar: avatar || 'mickey',
      primaryInk: primaryInk || 'Amber',
      secondaryInk: secondaryInk || 'Steel',
      deckName: deckName || '',
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);

    const token = await signSession({
      id: newUser.id,
      userId: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
        primaryInk: newUser.primaryInk,
        secondaryInk: newUser.secondaryInk,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
  }
}
