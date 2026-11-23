import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword, setSessionCookie, signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    // If password hash was empty (seed user), update it now
    if (!user.passwordHash) {
      const newHash = await hashPassword(password);
      await updateUser(user.id, { passwordHash: newHash });
    }

    const token = await signSession({
      id: user.id,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        primaryInk: user.primaryInk,
        secondaryInk: user.secondaryInk,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
