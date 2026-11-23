import { InkType, SwissStanding, Tournament, TournamentMatch, User } from '@/types';

function getRoundName(level: number, totalLevels: number): string {
  const diff = totalLevels - level;
  if (diff === 0) return 'Gran Final';
  if (diff === 1) return 'Semifinal';
  if (diff === 2) return 'Cuartos de Final';
  if (diff === 3) return 'Octavos de Final';
  if (diff === 4) return 'Dieciseisavos de Final';
  return `Ronda ${level}`;
}

// =========================================================================
// 1. ELIMINACIÓN DIRECTA (PLAYOFF BRACKET)
// =========================================================================

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

// =========================================================================
// 2. SISTEMA SUIZO (SWISS TOURNAMENT SYSTEM)
// =========================================================================

export function calculateDefaultSwissRounds(playerCount: number): number {
  if (playerCount <= 4) return 2;
  if (playerCount <= 8) return 3;
  if (playerCount <= 16) return 4;
  return 5;
}

export function generateSwissTournament(
  tournamentId: string,
  playerIds: string[],
  swissRoundsTotal?: number
): { matches: TournamentMatch[]; totalRounds: number } {
  if (playerIds.length < 2) {
    throw new Error('Se necesitan al menos 2 jugadores para un torneo suizo');
  }

  const totalRounds = swissRoundsTotal || calculateDefaultSwissRounds(playerIds.length);
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const matches: TournamentMatch[] = [];

  const hasOdd = shuffled.length % 2 !== 0;
  const byePlayer = hasOdd ? shuffled.pop()! : null;

  let matchIndex = 0;
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      id: `tmatch-${tournamentId}-S1-M${matchIndex}`,
      roundName: 'Ronda 1 Suizo',
      roundLevel: 1,
      swissRound: 1,
      matchIndex,
      player1Id: shuffled[i],
      player2Id: shuffled[i + 1],
      player1Score: 0,
      player2Score: 0,
      winnerId: null,
      status: 'pending',
    });
    matchIndex++;
  }

  if (byePlayer) {
    matches.push({
      id: `tmatch-${tournamentId}-S1-M${matchIndex}`,
      roundName: 'Ronda 1 Suizo',
      roundLevel: 1,
      swissRound: 1,
      matchIndex,
      player1Id: byePlayer,
      player2Id: null,
      player1Score: 2,
      player2Score: 0,
      winnerId: byePlayer,
      status: 'completed',
      notes: 'Descanso (BYE) - Victoria automática',
    });
  }

  return { matches, totalRounds };
}

export function calculateSwissStandings(
  matches: TournamentMatch[],
  playerIds: string[],
  users: User[]
): SwissStanding[] {
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

  const statsMap = new Map<
    string,
    {
      player: User;
      matchesPlayed: number;
      matchesWon: number;
      matchesDrawn: number;
      matchesLost: number;
      gamesWon: number;
      gamesLost: number;
      points: number;
      opponents: string[];
    }
  >();

  playerIds.forEach((pid) => {
    const user = userMap.get(pid);
    if (user) {
      statsMap.set(pid, {
        player: user,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesDrawn: 0,
        matchesLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0,
        opponents: [],
      });
    }
  });

  const completed = matches.filter((m) => m.status === 'completed');

  completed.forEach((m) => {
    if (!m.player1Id) return;
    const s1 = statsMap.get(m.player1Id);
    const s2 = m.player2Id ? statsMap.get(m.player2Id) : null;

    if (s1 && !m.player2Id) {
      // BYE
      s1.matchesPlayed += 1;
      s1.matchesWon += 1;
      s1.gamesWon += m.player1Score;
      s1.gamesLost += m.player2Score;
      s1.points += 3;
      return;
    }

    if (s1 && s2) {
      s1.matchesPlayed += 1;
      s2.matchesPlayed += 1;
      s1.gamesWon += m.player1Score;
      s1.gamesLost += m.player2Score;
      s2.gamesWon += m.player2Score;
      s2.gamesLost += m.player1Score;
      s1.opponents.push(s2.player.id);
      s2.opponents.push(s1.player.id);

      if (m.player1Score > m.player2Score) {
        s1.matchesWon += 1;
        s1.points += 3;
        s2.matchesLost += 1;
      } else if (m.player2Score > m.player1Score) {
        s2.matchesWon += 1;
        s2.points += 3;
        s1.matchesLost += 1;
      } else {
        s1.matchesDrawn += 1;
        s1.points += 1;
        s2.matchesDrawn += 1;
        s2.points += 1;
      }
    }
  });

  // Calculate Buchholz (sum of opponents' points)
  const list = Array.from(statsMap.values()).map((stat) => {
    const buchholz = stat.opponents.reduce((acc, oppId) => {
      const oppStat = statsMap.get(oppId);
      return acc + (oppStat ? oppStat.points : 0);
    }, 0);

    return {
      position: 0,
      player: stat.player,
      matchesPlayed: stat.matchesPlayed,
      matchesWon: stat.matchesWon,
      matchesDrawn: stat.matchesDrawn,
      matchesLost: stat.matchesLost,
      gamesWon: stat.gamesWon,
      gamesLost: stat.gamesLost,
      gameDiff: stat.gamesWon - stat.gamesLost,
      points: stat.points,
      buchholz,
    };
  });

  // Sort by Points DESC > Buchholz DESC > GameDiff DESC > GamesWon DESC
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gamesWon - a.gamesWon;
  });

  return list.map((item, idx) => ({ ...item, position: idx + 1 }));
}

export function generateNextSwissRound(
  tournament: Tournament,
  users: User[]
): {
  isFinished: boolean;
  championId?: string | null;
  runnerUpId?: string | null;
  newMatches?: TournamentMatch[];
  nextRoundNumber?: number;
} {
  const currentRound = tournament.currentSwissRound || 1;
  const totalRounds = tournament.swissRoundsTotal || 3;

  // Check if all matches in the current round are completed
  const currentRoundMatches = tournament.matches.filter((m) => m.swissRound === currentRound);
  const pendingCount = currentRoundMatches.filter((m) => m.status === 'pending').length;
  if (pendingCount > 0) {
    throw new Error(`Aún quedan ${pendingCount} partido(s) pendientes en la Ronda ${currentRound}`);
  }

  // If this was the last round, finish the tournament
  if (currentRound >= totalRounds) {
    const standings = calculateSwissStandings(tournament.matches, tournament.playerIds, users);
    return {
      isFinished: true,
      championId: standings[0]?.player.id || null,
      runnerUpId: standings[1]?.player.id || null,
    };
  }

  // Otherwise, pair for round currentRound + 1
  const nextRoundNumber = currentRound + 1;
  const standings = calculateSwissStandings(tournament.matches, tournament.playerIds, users);

  // Set of previous pairings (unordered pairs: 'idA-idB')
  const previousPairings = new Set<string>();
  const playersWithBye = new Set<string>();

  tournament.matches.forEach((m) => {
    if (m.player1Id && m.player2Id) {
      const pairKey1 = `${m.player1Id}-${m.player2Id}`;
      const pairKey2 = `${m.player2Id}-${m.player1Id}`;
      previousPairings.add(pairKey1);
      previousPairings.add(pairKey2);
    } else if (m.player1Id && !m.player2Id) {
      playersWithBye.add(m.player1Id);
    }
  });

  const pool = standings.map((s) => s.player.id);
  const newMatches: TournamentMatch[] = [];
  let matchIndex = 0;

  // If odd, select lowest-ranked player without a BYE
  if (pool.length % 2 !== 0) {
    let byeIndex = -1;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!playersWithBye.has(pool[i])) {
        byeIndex = i;
        break;
      }
    }
    if (byeIndex === -1) byeIndex = pool.length - 1;

    const [byePlayer] = pool.splice(byeIndex, 1);
    newMatches.push({
      id: `tmatch-${tournament.id}-S${nextRoundNumber}-M-BYE`,
      roundName: `Ronda ${nextRoundNumber} Suizo`,
      roundLevel: nextRoundNumber,
      swissRound: nextRoundNumber,
      matchIndex: 99,
      player1Id: byePlayer,
      player2Id: null,
      player1Score: 2,
      player2Score: 0,
      winnerId: byePlayer,
      status: 'completed',
      notes: 'Descanso (BYE) - Victoria automática',
    });
  }

  // Pair remaining players by closest standing without rematches
  const paired = new Set<string>();

  for (let i = 0; i < pool.length; i++) {
    const p1 = pool[i];
    if (paired.has(p1)) continue;

    // Find best opponent for p1 (first available who hasn't played p1)
    let opponentId: string | null = null;
    for (let j = i + 1; j < pool.length; j++) {
      const candidate = pool[j];
      if (paired.has(candidate)) continue;
      if (!previousPairings.has(`${p1}-${candidate}`)) {
        opponentId = candidate;
        break;
      }
    }

    // Fallback if everyone in bracket has played: take closest available
    if (!opponentId) {
      for (let j = i + 1; j < pool.length; j++) {
        const candidate = pool[j];
        if (!paired.has(candidate)) {
          opponentId = candidate;
          break;
        }
      }
    }

    if (opponentId) {
      paired.add(p1);
      paired.add(opponentId);
      newMatches.push({
        id: `tmatch-${tournament.id}-S${nextRoundNumber}-M${matchIndex}`,
        roundName: `Ronda ${nextRoundNumber} Suizo`,
        roundLevel: nextRoundNumber,
        swissRound: nextRoundNumber,
        matchIndex,
        player1Id: p1,
        player2Id: opponentId,
        player1Score: 0,
        player2Score: 0,
        winnerId: null,
        status: 'pending',
      });
      matchIndex++;
    }
  }

  return {
    isFinished: false,
    newMatches,
    nextRoundNumber,
  };
}

// =========================================================================
// 3. ACTUALIZACIÓN DE PARTIDOS CON TINTAS
// =========================================================================

export function updateTournamentMatchScore(
  matches: TournamentMatch[],
  matchId: string,
  player1Score: number,
  player2Score: number,
  notes?: string,
  player1Inks?: [InkType, InkType],
  player2Inks?: [InkType, InkType]
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
  if (player1Inks) match.player1Inks = player1Inks;
  if (player2Inks) match.player2Inks = player2Inks;

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

  // If this is a Swiss match:
  if (match.swissRound) {
    // Winner is recorded; Swiss rounds are finished via generateNextSwissRound
    return {
      updatedMatches: matches,
      isTournamentFinished: false,
    };
  }

  // If this is a Bracket Final:
  if (!match.nextMatchId) {
    return {
      updatedMatches: matches,
      isTournamentFinished: true,
      championId: winnerId,
      runnerUpId: loserId,
    };
  }

  // Propagate to next match in bracket
  propagateWinner(matches, match.id, winnerId);

  return {
    updatedMatches: matches,
    isTournamentFinished: false,
  };
}
