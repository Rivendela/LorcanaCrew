export type InkType = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

export interface InkInfo {
  name: InkType;
  label: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  description: string;
}

export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  primaryInk?: InkType;
  secondaryInk?: InkType;
  inksVisibility?: 'public' | 'private';
  bio?: string;
  favoriteCard?: string;
  deckName?: string;
  createdAt: string;
}

export type LeagueStatus = 'draft' | 'active' | 'completed';
export type LeagueFormat = 'core' | 'infiniti' | 'porcana';

export interface League {
  id: string;
  name: string;
  seasonName: string;
  description: string;
  status: LeagueStatus;
  format: LeagueFormat;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  startDate: string;
  playerIds: string[];
  currentRound: number;
  createdAt: string;
}

export type MatchStatus = 'pending' | 'completed' | 'disputed';

export interface Match {
  id: string;
  leagueId: string;
  roundId: string;
  roundNumber: number;
  player1Id: string;
  player2Id: string | null; // null = BYE
  player1Score: number;     // Games won in Bo3 (0, 1, 2)
  player2Score: number;     // Games won in Bo3 (0, 1, 2)
  player1Inks?: [InkType, InkType];
  player2Inks?: [InkType, InkType];
  status: MatchStatus;
  reportedBy?: string;
  notes?: string;
  playedAt?: string;
}

export type RoundStatus = 'upcoming' | 'active' | 'completed';

export interface Round {
  id: string;
  leagueId: string;
  roundNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  status: RoundStatus;
  format?: LeagueFormat;
  isCurrent: boolean;
}

export interface BackupInfo {
  filename: string;
  label: string;
  createdAt: string;
  sizeBytes: number;
}

export interface PlayerStanding {
  position: number;
  player: User;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  gameWinRate: number;
  matchWinRate: number;
  points: number;
  recentForm: ('W' | 'D' | 'L')[];
}

export type TournamentStatus = 'draft' | 'active' | 'completed';
export type TournamentFormat = 'porcana' | 'core' | 'infiniti';

export interface TournamentMatch {
  id: string;
  roundName: string; // 'Cuartos de Final', 'Semifinal', 'Gran Final', 'Tercer Puesto'
  roundLevel: number; // 1 = Primera ronda, 2 = Semis, 3 = Final
  matchIndex: number;
  nextMatchId?: string;
  nextMatchSlot?: 1 | 2;
  player1Id: string | null;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  status: 'pending' | 'completed';
  notes?: string;
  playedAt?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  date: string;
  status: TournamentStatus;
  playerIds: string[];
  matches: TournamentMatch[];
  championId?: string | null;
  runnerUpId?: string | null;
  thirdPlaceId?: string | null;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  leagues: League[];
  rounds: Round[];
  matches: Match[];
  tournaments?: Tournament[];
}
