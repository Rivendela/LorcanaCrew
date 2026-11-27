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
  const matches = pairSwissRound(tournamentId, 1, playerIds, [], []);

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
      matchWinRate: number;
      gameWinRate: number;
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
        matchWinRate: 0.3333,
        gameWinRate: 0.3333,
      });
    }
  });

  const completed = matches.filter((m) => m.status === 'completed');

  completed.forEach((m) => {
    if (!m.player1Id) return;
    const s1 = statsMap.get(m.player1Id);
    const s2 = m.player2Id ? statsMap.get(m.player2Id) : null;

    if (s1 && !m.player2Id) {
      // BYE: counts as a 2-0 match win in Swiss
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

  // Step 1: Calculate individual Match Win Rate (MW%) and Game Win Rate (GW%)
  // Official Lorcana Rule: Minimum floor of 33.33% (0.3333)
  statsMap.forEach((stat) => {
    const rawMW = stat.matchesPlayed > 0 ? stat.points / (stat.matchesPlayed * 3) : 0.3333;
    stat.matchWinRate = Math.max(0.3333, rawMW);

    const totalGames = stat.gamesWon + stat.gamesLost;
    const rawGW = totalGames > 0 ? stat.gamesWon / totalGames : 0.3333;
    stat.gameWinRate = Math.max(0.3333, rawGW);
  });

  // Step 2: Calculate Opponents' Match Win % (OMW%) and Opponents' Game Win % (OGW%)
  const list = Array.from(statsMap.values()).map((stat) => {
    const oppCount = stat.opponents.length;

    let omwSum = 0;
    let ogwSum = 0;
    let buchholz = 0;

    stat.opponents.forEach((oppId) => {
      const opp = statsMap.get(oppId);
      if (opp) {
        omwSum += opp.matchWinRate;
        ogwSum += opp.gameWinRate;
        buchholz += opp.points;
      } else {
        omwSum += 0.3333;
        ogwSum += 0.3333;
      }
    });

    const omwRate = oppCount > 0 ? (omwSum / oppCount) * 100 : 33.33;
    const ogwRate = oppCount > 0 ? (ogwSum / oppCount) * 100 : 33.33;
    const matchWinRate = Math.round(stat.matchWinRate * 10000) / 100;
    const gameWinRate = Math.round(stat.gameWinRate * 10000) / 100;

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
      matchWinRate,
      gameWinRate,
      omwRate: Math.round(omwRate * 100) / 100,
      ogwRate: Math.round(ogwRate * 100) / 100,
      buchholz,
    };
  });

  // Official Lorcana Ranking Hierarchy:
  // 1. Points DESC
  // 2. OMW% (Opponents' Match Win %) DESC
  // 3. GW% (Game Win %) DESC
  // 4. OGW% (Opponents' Game Win %) DESC
  // 5. Game Differential (+/-) DESC
  // 6. Games Won DESC
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (Math.abs(b.omwRate - a.omwRate) > 0.001) return b.omwRate - a.omwRate;
    if (Math.abs(b.gameWinRate - a.gameWinRate) > 0.001) return b.gameWinRate - a.gameWinRate;
    if (Math.abs(b.ogwRate - a.ogwRate) > 0.001) return b.ogwRate - a.ogwRate;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gamesWon - a.gamesWon;
  });

  return list.map((item, idx) => ({ ...item, position: idx + 1 }));
}

export function pairSwissRound(
  tournamentId: string,
  roundNumber: number,
  playerIds: string[],
  priorMatches: TournamentMatch[],
  users: User[]
): TournamentMatch[] {
  if (roundNumber === 1) {
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

    return matches;
  }

  // Round 2+
  const standings = calculateSwissStandings(priorMatches, playerIds, users);

  const previousPairings = new Set<string>();
  const playersWithBye = new Set<string>();

  priorMatches.forEach((m) => {
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

  // If odd, select lowest-ranked player without a previous BYE
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
      id: `tmatch-${tournamentId}-S${roundNumber}-M-BYE`,
      roundName: `Ronda ${roundNumber} Suizo`,
      roundLevel: roundNumber,
      swissRound: roundNumber,
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

  // Pair remaining players using backtracking to strictly avoid rematches
  // and minimize score differences (score bracket matching)
  const standingsMap = new Map<string, SwissStanding>(standings.map((s) => [s.player.id, s]));

  function solveSwissPairings(unpaired: string[]): [string, string][] | null {
    if (unpaired.length === 0) return [];

    const p1 = unpaired[0];
    const s1 = standingsMap.get(p1);
    const p1Pts = s1 ? s1.points : 0;

    // Sort candidate opponents:
    // 1. Unplayed opponents first
    // 2. Minimum point difference |pts1 - pts2|
    // 3. Closeness in standings order
    const candidates = unpaired.slice(1).sort((a, b) => {
      const sa = standingsMap.get(a);
      const sb = standingsMap.get(b);
      const ptsDiffA = Math.abs((sa ? sa.points : 0) - p1Pts);
      const ptsDiffB = Math.abs((sb ? sb.points : 0) - p1Pts);

      const playedA = previousPairings.has(`${p1}-${a}`) ? 1 : 0;
      const playedB = previousPairings.has(`${p1}-${b}`) ? 1 : 0;

      if (playedA !== playedB) return playedA - playedB;
      if (ptsDiffA !== ptsDiffB) return ptsDiffA - ptsDiffB;
      return 0;
    });

    for (const p2 of candidates) {
      const isRematch = previousPairings.has(`${p1}-${p2}`);
      if (isRematch) {
        const hasUnplayed = candidates.some((c) => !previousPairings.has(`${p1}-${c}`));
        if (hasUnplayed) continue;
      }

      const rest = unpaired.filter((id) => id !== p1 && id !== p2);
      const result = solveSwissPairings(rest);
      if (result !== null) {
        return [[p1, p2], ...result];
      }
    }

    return null;
  }

  const pairedTuples = solveSwissPairings(pool) || [];

  // Fallback in extreme corner cases where rematches cannot be avoided
  if (pairedTuples.length === 0 && pool.length > 0) {
    for (let i = 0; i < pool.length; i += 2) {
      if (pool[i + 1]) {
        pairedTuples.push([pool[i], pool[i + 1]]);
      }
    }
  }

  pairedTuples.forEach(([p1, p2]) => {
    newMatches.push({
      id: `tmatch-${tournamentId}-S${roundNumber}-M${matchIndex}`,
      roundName: `Ronda ${roundNumber} Suizo`,
      roundLevel: roundNumber,
      swissRound: roundNumber,
      matchIndex,
      player1Id: p1,
      player2Id: p2,
      player1Score: 0,
      player2Score: 0,
      winnerId: null,
      status: 'pending',
    });
    matchIndex++;
  });

  return newMatches;
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
  const currentRoundMatches = tournament.matches.filter((m) => (m.swissRound || m.roundLevel) === currentRound);
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
  const newMatches = pairSwissRound(
    tournament.id,
    nextRoundNumber,
    tournament.playerIds,
    tournament.matches,
    users
  );

  return {
    isFinished: false,
    newMatches,
    nextRoundNumber,
  };
}

export function repairSwissRound(
  tournament: Tournament,
  roundNumber: number,
  users: User[]
): TournamentMatch[] {
  // Keep all matches strictly prior to roundNumber
  const priorMatches = tournament.matches.filter(
    (m) => (m.swissRound || m.roundLevel) < roundNumber
  );

  // Generate fresh matches for roundNumber
  const newRoundMatches = pairSwissRound(
    tournament.id,
    roundNumber,
    tournament.playerIds,
    priorMatches,
    users
  );

  return [...priorMatches, ...newRoundMatches];
}

export function updateSwissPairings(
  tournament: Tournament,
  roundNumber: number,
  pairings: { matchIndex: number; player1Id: string; player2Id: string | null }[]
): TournamentMatch[] {
  const otherMatches = tournament.matches.filter(
    (m) => (m.swissRound || m.roundLevel) !== roundNumber
  );

  const existingRoundMatches = tournament.matches.filter(
    (m) => (m.swissRound || m.roundLevel) === roundNumber
  );
  const existingMap = new Map<number, TournamentMatch>(
    existingRoundMatches.map((m) => [m.matchIndex, m])
  );

  const updatedRoundMatches: TournamentMatch[] = pairings.map((p, idx) => {
    const existing = existingMap.get(p.matchIndex) || existingRoundMatches[idx];
    const isBye = !p.player2Id;
    const isSamePairing = existing && existing.player1Id === p.player1Id && existing.player2Id === p.player2Id;

    if (existing && isSamePairing) {
      return {
        ...existing,
        matchIndex: p.matchIndex,
      };
    }

    const matchId = existing?.id || `tmatch-${tournament.id}-S${roundNumber}-M${p.matchIndex}`;

    if (isBye) {
      return {
        id: matchId,
        roundName: `Ronda ${roundNumber} Suizo`,
        roundLevel: roundNumber,
        swissRound: roundNumber,
        matchIndex: p.matchIndex,
        player1Id: p.player1Id,
        player2Id: null,
        player1Score: 2,
        player2Score: 0,
        winnerId: p.player1Id,
        status: 'completed',
        notes: 'Descanso (BYE) - Victoria automática',
      };
    }

    return {
      id: matchId,
      roundName: `Ronda ${roundNumber} Suizo`,
      roundLevel: roundNumber,
      swissRound: roundNumber,
      matchIndex: p.matchIndex,
      player1Id: p.player1Id,
      player2Id: p.player2Id,
      player1Score: 0,
      player2Score: 0,
      winnerId: null,
      status: 'pending',
    };
  });

  return [...otherMatches, ...updatedRoundMatches];
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
