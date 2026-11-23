import { TournamentMatch } from '@/types';

function getRoundName(level: number, totalLevels: number): string {
  const diff = totalLevels - level;
  if (diff === 0) return 'Gran Final';
  if (diff === 1) return 'Semifinal';
  if (diff === 2) return 'Cuartos de Final';
  if (diff === 3) return 'Octavos de Final';
  if (diff === 4) return 'Dieciseisavos de Final';
  return `Ronda ${level}`;
}

export function generateTournamentBracket(
  tournamentId: string,
  playerIds: string[]
): TournamentMatch[] {
  if (playerIds.length < 2) {
    throw new Error('Se necesitan al menos 2 jugadores para generar un torneo');
  }

  // Calculate bracket size (next power of 2: 4, 8, 16, 32...)
  let bracketSize = 2;
  while (bracketSize < playerIds.length) {
    bracketSize *= 2;
  }

  // Seed / Shuffle slots
  const slots: (string | null)[] = [...playerIds];
  while (slots.length < bracketSize) {
    slots.push(null); // BYE
  }

  const totalLevels = Math.log2(bracketSize);
  const matches: TournamentMatch[] = [];

  // Generate match shells per level from final backwards or level 1 forwards
  // Let's create an array of levels: level 1 to totalLevels
  // Level 1 has bracketSize / 2 matches
  // Level 2 has bracketSize / 4 matches, etc.

  let currentLevelMatchCount = bracketSize / 2;
  const levelMatchesMap: TournamentMatch[][] = [];

  for (let level = 1; level <= totalLevels; level++) {
    const roundName = getRoundName(level, totalLevels);
    const roundMatches: TournamentMatch[] = [];

    for (let i = 0; i < currentLevelMatchCount; i++) {
      const matchId = `tmatch-${tournamentId}-L${level}-M${i}`;
      roundMatches.push({
        id: matchId,
        roundName,
        roundLevel: level,
        matchIndex: i,
        player1Id: null,
        player2Id: null,
        player1Score: 0,
        player2Score: 0,
        winnerId: null,
        status: 'pending',
      });
    }

    levelMatchesMap.push(roundMatches);
    currentLevelMatchCount /= 2;
  }

  // Link matches between levels
  for (let l = 0; l < totalLevels - 1; l++) {
    const currentLevel = levelMatchesMap[l];
    const nextLevel = levelMatchesMap[l + 1];

    for (let i = 0; i < currentLevel.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const nextSlot = (i % 2 === 0 ? 1 : 2) as 1 | 2;
      currentLevel[i].nextMatchId = nextLevel[nextMatchIndex].id;
      currentLevel[i].nextMatchSlot = nextSlot;
    }
  }

  // Assign Level 1 players from initial slots
  const level1 = levelMatchesMap[0];
  for (let i = 0; i < level1.length; i++) {
    level1[i].player1Id = slots[i * 2] || null;
    level1[i].player2Id = slots[i * 2 + 1] || null;
  }

  // Flatten all matches into single list
  levelMatchesMap.forEach((roundMatches) => {
    matches.push(...roundMatches);
  });

  // Resolve immediate BYEs in Level 1 (if player2 is null, player1 automatically advances)
  for (const m of matches) {
    if (m.roundLevel === 1) {
      if (m.player1Id && !m.player2Id) {
        // BYE: Player 1 wins
        m.status = 'completed';
        m.winnerId = m.player1Id;
        m.player1Score = 2;
        m.player2Score = 0;
        m.notes = 'Victoria automática por descanso (BYE)';
        propagateWinner(matches, m.id, m.player1Id);
      } else if (!m.player1Id && m.player2Id) {
        // BYE: Player 2 wins
        m.status = 'completed';
        m.winnerId = m.player2Id;
        m.player1Score = 0;
        m.player2Score = 2;
        m.notes = 'Victoria automática por descanso (BYE)';
        propagateWinner(matches, m.id, m.player2Id);
      }
    }
  }

  return matches;
}

export function propagateWinner(
  matches: TournamentMatch[],
  completedMatchId: string,
  winnerId: string
) {
  const match = matches.find((m) => m.id === completedMatchId);
  if (!match || !match.nextMatchId) return;

  const nextMatch = matches.find((m) => m.id === match.nextMatchId);
  if (!nextMatch) return;

  if (match.nextMatchSlot === 1) {
    nextMatch.player1Id = winnerId;
  } else {
    nextMatch.player2Id = winnerId;
  }
}

export function updateTournamentMatchScore(
  matches: TournamentMatch[],
  matchId: string,
  player1Score: number,
  player2Score: number,
  notes?: string
): {
  updatedMatches: TournamentMatch[];
  isTournamentFinished: boolean;
  championId?: string | null;
  runnerUpId?: string | null;
} {
  const match = matches.find((m) => m.id === matchId);
  if (!match) throw new Error('Partido de torneo no encontrado');
  if (!match.player1Id || !match.player2Id) {
    throw new Error('El partido aún no tiene ambos jugadores definidos');
  }

  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.status = 'completed';
  match.playedAt = new Date().toISOString();
  if (notes !== undefined) match.notes = notes;

  let winnerId: string;
  let loserId: string;

  if (player1Score > player2Score) {
    winnerId = match.player1Id;
    loserId = match.player2Id;
  } else if (player2Score > player1Score) {
    winnerId = match.player2Id;
    loserId = match.player1Id;
  } else {
    throw new Error('En eliminatorias Bo3 debe haber un ganador (marcador no puede ser empate)');
  }

  match.winnerId = winnerId;

  // Check if this was the Final
  if (!match.nextMatchId) {
    // This is the Grand Final!
    return {
      updatedMatches: matches,
      isTournamentFinished: true,
      championId: winnerId,
      runnerUpId: loserId,
    };
  }

  // Propagate to next match
  propagateWinner(matches, match.id, winnerId);

  return {
    updatedMatches: matches,
    isTournamentFinished: false,
  };
}
