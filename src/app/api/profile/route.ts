import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getActiveLeague, getDatabase, getMatches, getUserById, updateUser } from '@/lib/db';
import { calculateStandings } from '@/lib/league-engine';
import { User } from '@/types';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const league = await getActiveLeague();
    const db = getDatabase();
    const allMatches = league ? await getMatches(league.id) : [];

    // Filter user matches
    const userMatches = allMatches.filter(
      (m) => m.player1Id === user.id || m.player2Id === user.id
    );

    const completedMatches = userMatches.filter((m) => m.status === 'completed');

    // Calculate user's specific stats
    let matchesWon = 0;
    let matchesDrawn = 0;
    let matchesLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    completedMatches.forEach((m) => {
      const isP1 = m.player1Id === user.id;
      const myScore = isP1 ? m.player1Score : m.player2Score;
      const oppScore = isP1 ? m.player2Score : m.player1Score;

      gamesWon += myScore;
      gamesLost += oppScore;

      if (!m.player2Id) {
        // BYE
        matchesWon += 1;
      } else if (myScore > oppScore) {
        matchesWon += 1;
      } else if (myScore < oppScore) {
        matchesLost += 1;
      } else {
        matchesDrawn += 1;
      }
    });

    const totalMatches = completedMatches.length;
    const matchWinRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;
    const totalGames = gamesWon + gamesLost;
    const gameWinRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar || 'mickey',
        primaryInk: user.primaryInk || 'Amber',
        secondaryInk: user.secondaryInk || 'Steel',
        inksVisibility: user.inksVisibility || 'public',
        bio: user.bio || '',
        favoriteCard: user.favoriteCard || '',
        createdAt: user.createdAt,
      },
      stats: {
        matchesPlayed: totalMatches,
        matchesWon,
        matchesDrawn,
        matchesLost,
        gamesWon,
        gamesLost,
        gameDiff: gamesWon - gamesLost,
        matchWinRate,
        gameWinRate,
        points: matchesWon * 3 + matchesDrawn * 1,
      },
      matches: userMatches,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, avatar, primaryInk, secondaryInk, inksVisibility, bio, favoriteCard } = await req.json();

    const updates: Partial<User> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;
    if (primaryInk) updates.primaryInk = primaryInk;
    if (secondaryInk) updates.secondaryInk = secondaryInk;
    if (inksVisibility === 'public' || inksVisibility === 'private') {
      updates.inksVisibility = inksVisibility;
    }
    if (bio !== undefined) updates.bio = bio.trim();
    if (favoriteCard !== undefined) updates.favoriteCard = favoriteCard.trim();

    const updated = await updateUser(session.userId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
