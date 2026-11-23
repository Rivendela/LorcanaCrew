import { InkType, Match, PlayerStanding, Round, TournamentMatch, User } from '@/types';

/**
 * Generates a full Round-Robin tournament schedule using the Berger tables / circle method.
 * Handles both even and odd number of players (adds a "BYE" round for odd counts).
 */
export function generateRoundRobinSchedule(
  leagueId: string,
  playerIds: string[],
  startDate: Date = new Date()
): { rounds: Round[]; matches: Match[] } {
  const pool = [...playerIds];

  // If odd, add null representing a BYE
  const hasBye = pool.length % 2 !== 0;
  if (hasBye) {
    pool.push('BYE');
  }

  const n = pool.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;

  const rounds: Round[] = [];
  const matches: Match[] = [];

  // Circle method: Fix index 0, rotate the rest [1 ... n-1]
  const players = [...pool];

  for (let r = 0; r < totalRounds; r++) {
    const roundNumber = r + 1;
    const roundId = `round-${leagueId}-${roundNumber}`;

    // Calculate week dates (1 week per round)
    const roundStart = new Date(startDate);
    roundStart.setDate(roundStart.getDate() + r * 7);
    const roundEnd = new Date(roundStart);
    roundEnd.setDate(roundEnd.getDate() + 6);

    rounds.push({
      id: roundId,
      leagueId,
      roundNumber,
      title: `Jornada ${roundNumber}`,
      startDate: roundStart.toISOString().split('T')[0],
      endDate: roundEnd.toISOString().split('T')[0],
      status: roundNumber === 1 ? 'active' : 'upcoming',
      isCurrent: roundNumber === 1,
    });

    for (let m = 0; m < matchesPerRound; m++) {
      const p1 = players[m];
      const p2 = players[n - 1 - m];

      // If one of the players is the BYE, skip or set player2Id as null
      if (p1 === 'BYE' || p2 === 'BYE') {
        const realPlayer = p1 === 'BYE' ? p2 : p1;
        matches.push({
          id: `match-${leagueId}-r${roundNumber}-m${m + 1}`,
          leagueId,
          roundId,
          roundNumber,
          player1Id: realPlayer,
          player2Id: null, // Bye
          player1Score: 2,
          player2Score: 0,
          status: 'pending', // No se computa hasta que la jornada se cierre oficialmente
          notes: 'Descanso (BYE) - Se computa al cerrar la jornada',
        });
      } else {
        // Alternate home/away to be fair
        const isAlternate = (m + r) % 2 === 0;
        const player1Id = isAlternate ? p1 : p2;
        const player2Id = isAlternate ? p2 : p1;

        matches.push({
          id: `match-${leagueId}-r${roundNumber}-m${m + 1}`,
          leagueId,
          roundId,
          roundNumber,
          player1Id,
          player2Id,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
      }
    }

    // Rotate array: keep players[0] fixed, rotate players[1...n-1]
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  return { rounds, matches };
}

/**
 * Regenerates upcoming/future rounds and matches for an ongoing league when new players join,
 * while STRICTLY preserving all past completed rounds, existing match scores, and previous BYEs.
 */
export function regenerateFutureSchedule(
  leagueId: string,
  allPlayerIds: string[],
  existingRounds: Round[],
  existingMatches: Match[],
  startDate?: Date
): {
  rounds: Round[];
  matches: Match[];
  maxPreservedRound: number;
  newRoundsCount: number;
} {
  // 1. Identify preserved rounds:
  // Any round marked 'completed' OR containing at least one match marked 'completed' is strictly preserved.
  const preservedRoundNumbers = new Set<number>();
  for (const r of existingRounds) {
    if (r.status === 'completed') {
      preservedRoundNumbers.add(r.roundNumber);
    }
  }
  for (const m of existingMatches) {
    if (m.status === 'completed') {
      preservedRoundNumbers.add(m.roundNumber);
    }
  }

  const maxPreservedRound = preservedRoundNumbers.size > 0
    ? Math.max(...Array.from(preservedRoundNumbers))
    : 0;

  const preservedRounds = existingRounds.filter((r) => r.roundNumber <= maxPreservedRound);
  const preservedMatches = existingMatches.filter((m) => m.roundNumber <= maxPreservedRound);

  // 2. Identify played pairs and BYE counts in preserved matches
  const playedPairs = new Set<string>();
  const byeCounts: Record<string, number> = {};
  allPlayerIds.forEach((id) => { byeCounts[id] = 0; });

  for (const m of preservedMatches) {
    if (m.player1Id && m.player2Id) {
      const key = [m.player1Id, m.player2Id].sort().join(':::');
      playedPairs.add(key);
    } else if (m.player1Id && !m.player2Id) {
      byeCounts[m.player1Id] = (byeCounts[m.player1Id] || 0) + 1;
    }
  }

  // 3. Find missing pairings
  const missingPairs: { p1: string; p2: string; key: string }[] = [];
  for (let i = 0; i < allPlayerIds.length; i++) {
    for (let j = i + 1; j < allPlayerIds.length; j++) {
      const p1 = allPlayerIds[i];
      const p2 = allPlayerIds[j];
      const key = [p1, p2].sort().join(':::');
      if (!playedPairs.has(key)) {
        missingPairs.push({ p1, p2, key });
      }
    }
  }

  let remaining = [...missingPairs];
  const newRounds: Round[] = [];
  const newMatches: Match[] = [];
  let roundNum = maxPreservedRound + 1;

  // Determine base date from last preserved round or startDate
  const lastRound = preservedRounds.find((r) => r.roundNumber === maxPreservedRound);
  let baseDate = startDate || new Date();
  if (lastRound && lastRound.endDate) {
    baseDate = new Date(lastRound.endDate);
    baseDate.setDate(baseDate.getDate() + 1);
  }

  // 4. Pack missing pairings into rounds
  while (remaining.length > 0) {
    const degree: Record<string, number> = {};
    allPlayerIds.forEach((id) => { degree[id] = 0; });
    for (const edge of remaining) {
      degree[edge.p1] = (degree[edge.p1] || 0) + 1;
      degree[edge.p2] = (degree[edge.p2] || 0) + 1;
    }

    const roundId = `round-${leagueId}-${roundNum}`;
    const roundStart = new Date(baseDate);
    roundStart.setDate(roundStart.getDate() + (roundNum - maxPreservedRound - 1) * 7);
    const roundEnd = new Date(roundStart);
    roundEnd.setDate(roundEnd.getDate() + 6);

    const busy = new Set<string>();
    const roundMatches: Match[] = [];

    // Prioritize edges connecting players with the highest remaining degrees
    remaining.sort((a, b) => {
      const scoreA = (degree[a.p1] || 0) + (degree[a.p2] || 0);
      const scoreB = (degree[b.p1] || 0) + (degree[b.p2] || 0);
      return scoreB - scoreA;
    });

    const keptRemaining: typeof remaining = [];
    let matchIdx = 1;

    for (const edge of remaining) {
      if (!busy.has(edge.p1) && !busy.has(edge.p2)) {
        busy.add(edge.p1);
        busy.add(edge.p2);

        const isAlternate = (matchIdx + roundNum) % 2 === 0;
        const player1Id = isAlternate ? edge.p1 : edge.p2;
        const player2Id = isAlternate ? edge.p2 : edge.p1;

        roundMatches.push({
          id: `match-${leagueId}-r${roundNum}-m${matchIdx}`,
          leagueId,
          roundId,
          roundNumber: roundNum,
          player1Id,
          player2Id,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
        matchIdx++;
      } else {
        keptRemaining.push(edge);
      }
    }

    // Assign BYE if odd number of players
    const idlePlayers = allPlayerIds.filter((id) => !busy.has(id));
    if (allPlayerIds.length % 2 !== 0 && idlePlayers.length > 0) {
      idlePlayers.sort((a, b) => (byeCounts[a] || 0) - (byeCounts[b] || 0));
      const byePlayer = idlePlayers[0];
      byeCounts[byePlayer] = (byeCounts[byePlayer] || 0) + 1;

      roundMatches.push({
        id: `match-${leagueId}-r${roundNum}-m${matchIdx}`,
        leagueId,
        roundId,
        roundNumber: roundNum,
        player1Id: byePlayer,
        player2Id: null,
        player1Score: 2,
        player2Score: 0,
        status: 'pending',
        isBye: true,
        notes: 'Descanso (BYE) - Se computa al cerrar la jornada',
      });
    }

    // Set first newly generated round to active if no preserved round is active
    const isFirstNewRound = roundNum === maxPreservedRound + 1;
    const hasActivePreserved = preservedRounds.some((r) => r.status === 'active');
    const shouldBeActive = isFirstNewRound && !hasActivePreserved;

    newRounds.push({
      id: roundId,
      leagueId,
      roundNumber: roundNum,
      title: `Jornada ${roundNum}`,
      startDate: roundStart.toISOString().split('T')[0],
      endDate: roundEnd.toISOString().split('T')[0],
      status: shouldBeActive ? 'active' : 'upcoming',
      isCurrent: shouldBeActive,
    });

    newMatches.push(...roundMatches);
    remaining = keptRemaining;
    roundNum++;

    // Safety guard
    if (roundNum > maxPreservedRound + 100) {
      break;
    }
  }

  return {
    rounds: [...preservedRounds, ...newRounds],
    matches: [...preservedMatches, ...newMatches],
    maxPreservedRound,
    newRoundsCount: newRounds.length,
  };
}

/**
 * Calculates current standings based on completed matches in Best-of-3 format.
 * IMPORTANT: Points and stats are ONLY awarded for rounds that are officially CLOSED (completed),
 * preventing points from future rounds or unearned BYEs.
 */
export function calculateStandings(
  players: User[],
  matches: Match[],
  pointsWin: number = 3,
  pointsDraw: number = 1,
  pointsLoss: number = 0,
  rounds?: Round[]
): PlayerStanding[] {
  // Ensure admins are never treated as league players
  const leaguePlayers = players.filter((p) => p.role !== 'admin');

  const playerMap = new Map<string, User>();
  leaguePlayers.forEach((p) => playerMap.set(p.id, p));

  const statsMap = new Map<
    string,
    {
      matchesPlayed: number;
      matchesWon: number;
      matchesDrawn: number;
      matchesLost: number;
      gamesWon: number;
      gamesLost: number;
      points: number;
      recentForm: ('W' | 'D' | 'L')[];
    }
  >();

  leaguePlayers.forEach((p) => {
    statsMap.set(p.id, {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesDrawn: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
      recentForm: [],
    });
  });

  // Closed rounds IDs: Only count matches if their round is officially completed
  const completedRoundIds = rounds
    ? new Set(rounds.filter((r) => r.status === 'completed').map((r) => r.id))
    : null;

  // Filter matches: Only completed matches belonging to completed rounds (and closed BYEs)
  const completedMatches = matches
    .filter((m) => {
      // If rounds are passed, the round MUST be completed for points to count
      if (completedRoundIds && !completedRoundIds.has(m.roundId)) {
        return false;
      }

      // If it's a regular match, status must be completed
      if (m.player2Id) {
        return m.status === 'completed';
      }

      // If it's a BYE, only count if the round is completed!
      if (!m.player2Id) {
        if (completedRoundIds) {
          return completedRoundIds.has(m.roundId);
        }
        return m.status === 'completed';
      }

      return false;
    })
    .sort((a, b) => a.roundNumber - b.roundNumber);

  completedMatches.forEach((m) => {
    // Skip if match has no opponent and isn't a handled bye
    if (!m.player1Id) return;

    const s1 = statsMap.get(m.player1Id);
    const s2 = m.player2Id ? statsMap.get(m.player2Id) : null;

    if (s1 && !m.player2Id) {
      // BYE win
      s1.matchesPlayed += 1;
      s1.matchesWon += 1;
      s1.gamesWon += m.player1Score;
      s1.gamesLost += m.player2Score;
      s1.points += pointsWin;
      s1.recentForm.push('W');
      return;
    }

    if (s1 && s2) {
      s1.matchesPlayed += 1;
      s2.matchesPlayed += 1;

      s1.gamesWon += m.player1Score;
      s1.gamesLost += m.player2Score;
      s2.gamesWon += m.player2Score;
      s2.gamesLost += m.player1Score;

      if (m.player1Score > m.player2Score) {
        // Player 1 won
        s1.matchesWon += 1;
        s1.points += pointsWin;
        s1.recentForm.push('W');

        s2.matchesLost += 1;
        s2.points += pointsLoss;
        s2.recentForm.push('L');
      } else if (m.player2Score > m.player1Score) {
        // Player 2 won
        s2.matchesWon += 1;
        s2.points += pointsWin;
        s2.recentForm.push('W');

        s1.matchesLost += 1;
        s1.points += pointsLoss;
        s1.recentForm.push('L');
      } else {
        // Draw (e.g. 1-1 timeout)
        s1.matchesDrawn += 1;
        s1.points += pointsDraw;
        s1.recentForm.push('D');

        s2.matchesDrawn += 1;
        s2.points += pointsDraw;
        s2.recentForm.push('D');
      }
    }
  });

  // Convert to array and calculate rates
  const standings: PlayerStanding[] = leaguePlayers.map((p) => {
    const s = statsMap.get(p.id)!;
    const gameDiff = s.gamesWon - s.gamesLost;
    const totalGames = s.gamesWon + s.gamesLost;
    const gameWinRate = totalGames > 0 ? (s.gamesWon / totalGames) * 100 : 0;
    const matchWinRate = s.matchesPlayed > 0 ? (s.matchesWon / s.matchesPlayed) * 100 : 0;

    return {
      position: 0,
      player: p,
      matchesPlayed: s.matchesPlayed,
      matchesWon: s.matchesWon,
      matchesDrawn: s.matchesDrawn,
      matchesLost: s.matchesLost,
      gamesWon: s.gamesWon,
      gamesLost: s.gamesLost,
      gameDiff,
      gameWinRate: Math.round(gameWinRate * 10) / 10,
      matchWinRate: Math.round(matchWinRate * 10) / 10,
      points: s.points,
      recentForm: s.recentForm.slice(-5), // Last 5 matches
    };
  });

  // Sort by: Points DESC -> Game Diff DESC -> Games Won DESC -> Head-to-Head
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;

    // Head-to-head lookup
    const directMatch = completedMatches.find(
      (m) =>
        (m.player1Id === a.player.id && m.player2Id === b.player.id) ||
        (m.player1Id === b.player.id && m.player2Id === a.player.id)
    );

    if (directMatch) {
      if (directMatch.player1Id === a.player.id) {
        return directMatch.player2Score - directMatch.player1Score;
      } else {
        return directMatch.player1Score - directMatch.player2Score;
      }
    }

    return a.player.name.localeCompare(b.player.name);
  });

  // Assign rankings (1, 2, 3...)
  return standings.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

/**
 * Calculates Lorcana ink meta statistics from recorded league and tournament matches.
 * Uses the exact decks played in each match, falling back to profile inks if not entered.
 */
export function calculateMetaStats(
  matches: Match[],
  players: User[],
  tournamentMatches: TournamentMatch[] = []
) {
  const inkCounts: Record<InkType, { played: number; won: number }> = {
    Amber: { played: 0, won: 0 },
    Amethyst: { played: 0, won: 0 },
    Emerald: { played: 0, won: 0 },
    Ruby: { played: 0, won: 0 },
    Sapphire: { played: 0, won: 0 },
    Steel: { played: 0, won: 0 },
  };

  const completed = matches.filter((m) => m.status === 'completed' && m.player2Id);
  const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));

  // Process League Matches
  completed.forEach((m) => {
    const p1 = playerMap.get(m.player1Id);
    const p2 = m.player2Id ? playerMap.get(m.player2Id) : null;

    const p1Inks: [InkType, InkType] | null = m.player1Inks || (p1?.primaryInk && p1?.secondaryInk ? [p1.primaryInk, p1.secondaryInk] : null);
    const p2Inks: [InkType, InkType] | null = m.player2Inks || (p2?.primaryInk && p2?.secondaryInk ? [p2.primaryInk, p2.secondaryInk] : null);

    const p1Won = m.player1Score > m.player2Score;
    const p2Won = m.player2Score > m.player1Score;

    if (p1Inks) {
      p1Inks.forEach((ink: InkType) => {
        if (inkCounts[ink]) {
          inkCounts[ink].played += 1;
          if (p1Won) inkCounts[ink].won += 1;
        }
      });
    }

    if (p2Inks) {
      p2Inks.forEach((ink: InkType) => {
        if (inkCounts[ink]) {
          inkCounts[ink].played += 1;
          if (p2Won) inkCounts[ink].won += 1;
        }
      });
    }
  });

  // Process Tournament Matches
  tournamentMatches
    .filter((m) => m.status === 'completed' && m.player1Id && m.player2Id)
    .forEach((m) => {
      const p1 = playerMap.get(m.player1Id!);
      const p2 = playerMap.get(m.player2Id!);

      const p1Inks: [InkType, InkType] | null = m.player1Inks || (p1?.primaryInk && p1?.secondaryInk ? [p1.primaryInk, p1.secondaryInk] : null);
      const p2Inks: [InkType, InkType] | null = m.player2Inks || (p2?.primaryInk && p2?.secondaryInk ? [p2.primaryInk, p2.secondaryInk] : null);

      const p1Won = m.winnerId === m.player1Id || m.player1Score > m.player2Score;
      const p2Won = m.winnerId === m.player2Id || m.player2Score > m.player1Score;

      if (p1Inks) {
        p1Inks.forEach((ink: InkType) => {
          if (inkCounts[ink]) {
            inkCounts[ink].played += 1;
            if (p1Won) inkCounts[ink].won += 1;
          }
        });
      }

      if (p2Inks) {
        p2Inks.forEach((ink: InkType) => {
          if (inkCounts[ink]) {
            inkCounts[ink].played += 1;
            if (p2Won) inkCounts[ink].won += 1;
          }
        });
      }
    });

  return Object.entries(inkCounts).map(([ink, stat]) => ({
    ink: ink as InkType,
    played: stat.played,
    won: stat.won,
    winRate: stat.played > 0 ? Math.round((stat.won / stat.played) * 100) : 0,
  }));
}
