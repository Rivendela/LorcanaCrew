import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      primaryInk: user.primaryInk,
      secondaryInk: user.secondaryInk,
      inksVisibility: user.inksVisibility || 'public',
      bio: user.bio || '',
      favoriteCard: user.favoriteCard || '',
      deckName: user.deckName,
    },
  });
}
