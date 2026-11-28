import fs from 'fs';
import path from 'path';
import { DatabaseSchema, InkType, League, Match, Round, Tournament, User } from '@/types';
import { generateRoundRobinSchedule, regenerateFutureSchedule } from './league-engine';

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const REPO_SEED_FILE = path.join(process.cwd(), 'data', 'database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Cloud KV & Redis configuration (Vercel KV or Upstash)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_KEY = 'ccrew_lorcana_database';

// Memory cache with mtime check for instant reads and perfect cache-invalidation
let cachedDb: DatabaseSchema | null = null;
let lastMtimeMs = 0;
let lastCloudFetchTime = 0;
const CLOUD_CACHE_TTL_MS = 3000; // 3 seconds in-memory cache to avoid duplicate calls in same SSR turn

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Initial clean seed data generator
function getInitialSeedData(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'user-admin',
      username: 'admin',
      name: 'Comisionado CCREW',
      passwordHash: '$2b$10$sbTzVOoJQI.L80LVBmCtl./IMC0S2.oU.YiKexsJHXOihb/sYkMZy',
      role: 'admin',
      avatar: 'mickey',
      primaryInk: 'Amethyst',
      secondaryInk: 'Steel',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    leagues: [],
    rounds: [],
    matches: [],
    tournaments: [],
  };
}

// Cloud KV helpers (Upstash / Vercel KV REST API)
async function fetchFromCloudKV(): Promise<DatabaseSchema | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || json.result === null || json.result === undefined) return null;

    const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
    if (parsed && Array.isArray(parsed.users)) {
      return parsed as DatabaseSchema;
    }
    return null;
  } catch (err) {
    console.error('Error fetching from Cloud KV:', err);
    return null;
  }
}

async function saveToCloudKV(data: DatabaseSchema): Promise<boolean> {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving to Cloud KV:', err);
    return false;
  }
}

function getLocalOrSeedData(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    if (isVercel && fs.existsSync(REPO_SEED_FILE)) {
      try {
        const raw = fs.readFileSync(REPO_SEED_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        saveDatabaseSync(parsed);
        cachedDb = parsed;
        return parsed;
      } catch {}
    }
    const initialData = getInitialSeedData();
    saveDatabaseSync(initialData);
    cachedDb = initialData;
    return initialData;
  }

  try {
    const stat = fs.statSync(DB_FILE);
    if (cachedDb && stat.mtimeMs === lastMtimeMs) {
      return cachedDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    cachedDb = parsed;
    lastMtimeMs = stat.mtimeMs;
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    if (cachedDb) return cachedDb;
    const initialData = getInitialSeedData();
    saveDatabaseSync(initialData);
    cachedDb = initialData;
    return initialData;
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  ensureDirectoryExists();

  const isBuildTime =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';

  // During Next.js build / static optimization, use local seed data to avoid dynamic server bailouts
  if (isBuildTime) {
    return getLocalOrSeedData();
  }

  // 1. If Cloud KV (Vercel KV / Upstash) is configured at runtime:
  if (KV_URL && KV_TOKEN) {
    if (cachedDb && Date.now() - lastCloudFetchTime < CLOUD_CACHE_TTL_MS) {
      return cachedDb;
    }

    const cloudData = await fetchFromCloudKV();
    if (cloudData) {
      cachedDb = cloudData;
      lastCloudFetchTime = Date.now();
      saveDatabaseSync(cloudData);
      return cloudData;
    }

    // First time Cloud KV setup: Seed KV with initial data from database.json
    const initialData = getLocalOrSeedData();
    await saveToCloudKV(initialData);
    cachedDb = initialData;
    lastCloudFetchTime = Date.now();
    return initialData;
  }

  // 2. Local fallback (File-based storage with mtime check)
  return getLocalOrSeedData();
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  ensureDirectoryExists();
  cachedDb = data;
  lastCloudFetchTime = Date.now();

  // 1. Save to Cloud KV if configured
  if (KV_URL && KV_TOKEN) {
    await saveToCloudKV(data);
  }

  // 2. Always persist locally or to /tmp
  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.promises.rename(tempFile, DB_FILE);
  try {
    lastMtimeMs = fs.statSync(DB_FILE).mtimeMs;
  } catch {}
}

function saveDatabaseSync(data: DatabaseSchema): void {
  ensureDirectoryExists();
  cachedDb = data;
  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  try {
    lastMtimeMs = fs.statSync(DB_FILE).mtimeMs;
  } catch {}
}

// Convenience accessors
export async function getUsers(): Promise<User[]> {
  const db = await getDatabase();
  return db.users;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function createUser(user: User): Promise<User> {
  const db = await getDatabase();
  db.users.push(user);
  await saveDatabase(db);
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const db = await getDatabase();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  db.users[index] = { ...db.users[index], ...updates };
  await saveDatabase(db);
  return db.users[index];
}

export async function getActiveLeague(): Promise<League | undefined> {
  const db = await getDatabase();
  return db.leagues.find((l) => l.status === 'active') || db.leagues[0];
}

export async function getRounds(leagueId: string): Promise<Round[]> {
  const db = await getDatabase();
  return db.rounds.filter((r) => r.leagueId === leagueId).sort((a, b) => a.roundNumber - b.roundNumber);
}

export async function getMatches(leagueId: string, roundId?: string): Promise<Match[]> {
  const db = await getDatabase();
  return db.matches.filter(
    (m) => m.leagueId === leagueId && (!roundId || m.roundId === roundId)
  );
}

export async function updateMatchResult(
  matchId: string,
  player1Score: number,
  player2Score: number,
  reportedByUserId: string,
  notes?: string,
  player1Inks?: [InkType, InkType],
  player2Inks?: [InkType, InkType]
): Promise<Match | null> {
  const db = await getDatabase();
  const match = db.matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.status = 'completed';
  match.reportedBy = reportedByUserId;
  match.notes = notes || match.notes;
  if (player1Inks) match.player1Inks = player1Inks;
  if (player2Inks) match.player2Inks = player2Inks;
  match.playedAt = new Date().toISOString();

  await saveDatabase(db);
  return match;
}

export async function launchRound(leagueId: string, roundId: string): Promise<Round | null> {
  const db = await getDatabase();
  const league = db.leagues.find((l) => l.id === leagueId);
  const targetRound = db.rounds.find((r) => r.id === roundId && r.leagueId === leagueId);
  if (!targetRound || !league) return null;

  // Verify that all previous round matches are completed
  const pendingPreviousMatches = db.matches.filter(
    (m) =>
      m.leagueId === leagueId &&
      m.roundNumber < targetRound.roundNumber &&
      m.status === 'pending' &&
      m.player2Id &&
      !m.isBye
  );

  if (pendingPreviousMatches.length > 0) {
    throw new Error(
      `No se puede pasar a la Jornada ${targetRound.roundNumber}: aún quedan ${pendingPreviousMatches.length} partido(s) pendiente(s) en jornadas anteriores. Todos los partidos deben completarse.`
    );
  }

  // Update round statuses
  db.rounds.forEach((r) => {
    if (r.leagueId === leagueId) {
      if (r.roundNumber < targetRound.roundNumber) {
        r.status = 'completed';
        r.isCurrent = false;
      } else if (r.id === roundId) {
        r.status = 'active';
        r.isCurrent = true;
      } else {
        r.status = 'upcoming';
        r.isCurrent = false;
      }
    }
  });

  league.currentRound = targetRound.roundNumber;
  await saveDatabase(db);
  return targetRound;
}

export async function createNewLeague(
  name: string,
  seasonName: string,
  playerIds: string[],
  format: import('@/types').LeagueFormat = 'porcana',
  startDate: Date = new Date()
): Promise<League> {
  const db = await getDatabase();
  const leagueId = `league-${Date.now()}`;

  const { rounds, matches } = generateRoundRobinSchedule(leagueId, playerIds, startDate);

  const newLeague: League = {
    id: leagueId,
    name,
    seasonName,
    description: `Liga CCREW Bo3 (${format.toUpperCase()})`,
    status: 'active',
    format,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    startDate: startDate.toISOString().split('T')[0],
    playerIds,
    currentRound: 1,
    createdAt: new Date().toISOString(),
  };

  // Archive any currently active leagues
  db.leagues.forEach((l) => {
    if (l.status === 'active') l.status = 'completed';
  });

  db.leagues.push(newLeague);
  db.rounds.push(...rounds);
  db.matches.push(...matches);

  await saveDatabase(db);
  return newLeague;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getDatabase();
  const initialLength = db.users.length;
  // Never allow deleting the primary admin
  db.users = db.users.filter((u) => u.id !== id || u.username === 'admin');
  if (db.users.length !== initialLength) {
    // Also remove from any league playerIds
    db.leagues.forEach((l) => {
      l.playerIds = l.playerIds.filter((pId) => pId !== id);
    });
    await saveDatabase(db);
    return true;
  }
  return false;
}

export async function adminUpdateMatch(
  matchId: string,
  player1Score: number,
  player2Score: number,
  status: import('@/types').MatchStatus = 'completed',
  notes?: string
): Promise<Match | null> {
  const db = await getDatabase();
  const match = db.matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.status = status;
  if (notes !== undefined) match.notes = notes;
  if (status === 'completed' && !match.playedAt) {
    match.playedAt = new Date().toISOString();
  }

  await saveDatabase(db);
  return match;
}

export async function updateRound(
  roundId: string,
  updates: Partial<Round>
): Promise<Round | null> {
  const db = await getDatabase();
  const round = db.rounds.find((r) => r.id === roundId);
  if (!round) return null;

  Object.assign(round, updates);
  await saveDatabase(db);
  return round;
}

export async function closeRound(leagueId: string, roundId: string): Promise<Round | null> {
  const db = await getDatabase();
  const round = db.rounds.find((r) => r.id === roundId && r.leagueId === leagueId);
  if (!round) return null;

  // Check if any real match in this round is still pending
  const pendingMatches = db.matches.filter(
    (m) => m.leagueId === leagueId && m.roundId === roundId && m.status === 'pending' && m.player2Id && !m.isBye
  );

  if (pendingMatches.length > 0) {
    throw new Error(
      `No se puede cerrar la Jornada ${round.roundNumber}: aún quedan ${pendingMatches.length} partido(s) pendiente(s) por terminar.`
    );
  }

  // Auto-complete any BYE match in this round so points are awarded upon closing
  db.matches.forEach((m) => {
    if (m.leagueId === leagueId && m.roundId === roundId && (!m.player2Id || m.isBye)) {
      m.status = 'completed';
      m.player1Score = 2;
      m.player2Score = 0;
    }
  });

  round.status = 'completed';
  round.isCurrent = false;

  await saveDatabase(db);

  // Auto-backup whenever a round is closed!
  await createBackup(`Fin de ${round.title}`);

  return round;
}

export async function resetCurrentLeague(): Promise<boolean> {
  const db = await getDatabase();
  db.leagues = [];
  db.rounds = [];
  db.matches = [];
  await saveDatabase(db);
  return true;
}

export async function regenerateLeagueFutureSchedule(
  leagueId: string,
  updatedPlayerIds: string[]
): Promise<{
  league: League;
  rounds: Round[];
  matches: Match[];
  maxPreservedRound: number;
  newRoundsCount: number;
}> {
  const db = await getDatabase();
  const league = db.leagues.find((l) => l.id === leagueId);
  if (!league) {
    throw new Error('Liga no encontrada.');
  }

  const existingRounds = db.rounds.filter((r) => r.leagueId === leagueId);
  const existingMatches = db.matches.filter((m) => m.leagueId === leagueId);

  const result = regenerateFutureSchedule(
    leagueId,
    updatedPlayerIds,
    existingRounds,
    existingMatches
  );

  league.playerIds = updatedPlayerIds;

  // Replace this league's rounds and matches with preserved + regenerated ones
  db.rounds = db.rounds.filter((r) => r.leagueId !== leagueId).concat(result.rounds);
  db.matches = db.matches.filter((m) => m.leagueId !== leagueId).concat(result.matches);

  await saveDatabase(db);
  await createBackup(`Regeneración cruces futuros (${updatedPlayerIds.length} jugadores)`);

  return {
    league,
    rounds: result.rounds,
    matches: result.matches,
    maxPreservedRound: result.maxPreservedRound,
    newRoundsCount: result.newRoundsCount,
  };
}

// Tournament System (Independent of regular league)
export async function getTournaments(): Promise<Tournament[]> {
  const db = await getDatabase();
  return db.tournaments || [];
}

export async function getTournamentById(id: string): Promise<Tournament | undefined> {
  const tournaments = await getTournaments();
  return tournaments.find((t) => t.id === id);
}

export async function createTournament(tournament: Tournament): Promise<Tournament> {
  const db = await getDatabase();
  if (!db.tournaments) db.tournaments = [];
  db.tournaments.push(tournament);
  await saveDatabase(db);
  return tournament;
}

export async function updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | null> {
  const db = await getDatabase();
  if (!db.tournaments) db.tournaments = [];
  const idx = db.tournaments.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.tournaments[idx] = { ...db.tournaments[idx], ...updates };
  await saveDatabase(db);
  return db.tournaments[idx];
}

export async function deleteTournament(id: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db.tournaments) return false;
  const initialLen = db.tournaments.length;
  db.tournaments = db.tournaments.filter((t) => t.id !== id);
  if (db.tournaments.length !== initialLen) {
    await saveDatabase(db);
    return true;
  }
  return false;
}

// Backup system
export async function createBackup(label: string = 'manual'): Promise<import('@/types').BackupInfo> {
  ensureDirectoryExists();
  const db = await getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  const payload = {
    metadata: {
      label,
      createdAt: new Date().toISOString(),
      userCount: db.users.length,
      leagueCount: db.leagues.length,
      matchCount: db.matches.length,
    },
    data: db,
  };

  const content = JSON.stringify(payload, null, 2);
  await fs.promises.writeFile(filePath, content, 'utf-8');

  // Also save a latest copy for quick single-click restore
  const latestPath = path.join(BACKUP_DIR, 'backup_latest.json');
  await fs.promises.writeFile(latestPath, content, 'utf-8');

  return {
    filename,
    label,
    createdAt: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(content, 'utf-8'),
  };
}

export async function getBackups(): Promise<import('@/types').BackupInfo[]> {
  ensureDirectoryExists();
  try {
    const files = await fs.promises.readdir(BACKUP_DIR);
    const jsonFiles = files.filter((f) => f.startsWith('backup_') && f.endsWith('.json') && f !== 'backup_latest.json');

    const list: import('@/types').BackupInfo[] = [];

    for (const f of jsonFiles) {
      try {
        const filePath = path.join(BACKUP_DIR, f);
        const stat = await fs.promises.stat(filePath);
        const raw = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);

        list.push({
          filename: f,
          label: parsed.metadata?.label || 'Backup',
          createdAt: parsed.metadata?.createdAt || stat.mtime.toISOString(),
          sizeBytes: stat.size,
        });
      } catch {}
    }

    // Sort descending (most recent first)
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function restoreBackup(filename?: string): Promise<boolean> {
  ensureDirectoryExists();
  const targetFile = filename ? path.join(BACKUP_DIR, filename) : path.join(BACKUP_DIR, 'backup_latest.json');

  if (!fs.existsSync(targetFile)) {
    return false;
  }

  try {
    const raw = await fs.promises.readFile(targetFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const dataToRestore: DatabaseSchema = parsed.data || parsed;

    if (dataToRestore.users && Array.isArray(dataToRestore.users)) {
      // Auto safety backup before overwriting
      await createBackup('Pre-Restauración Archivo');
      await saveDatabase(dataToRestore);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error restoring backup:', err);
    return false;
  }
}

export function validateDatabaseSchema(rawInput: any): {
  valid: boolean;
  error?: string;
  normalizedData?: DatabaseSchema;
  stats?: {
    userCount: number;
    leagueCount: number;
    roundCount: number;
    matchCount: number;
    tournamentCount: number;
  };
} {
  if (!rawInput || typeof rawInput !== 'object') {
    return { valid: false, error: 'El archivo JSON no contiene un objeto válido.' };
  }

  // Support both raw DatabaseSchema and wrapped { metadata, data } backup structures
  const candidate = (rawInput.data && typeof rawInput.data === 'object' && Array.isArray(rawInput.data.users))
    ? rawInput.data
    : rawInput;

  if (!Array.isArray(candidate.users)) {
    return { valid: false, error: 'Estructura inválida: Falta la lista de usuarios ("users").' };
  }

  if (candidate.users.length === 0) {
    return { valid: false, error: 'Estructura inválida: La lista de usuarios está vacía.' };
  }

  const hasAdmin = candidate.users.some((u: any) => u && (u.role === 'admin' || u.username === 'admin'));
  if (!hasAdmin) {
    return { valid: false, error: 'El archivo debe contener al menos un usuario administrador ("role": "admin").' };
  }

  for (const u of candidate.users) {
    if (!u || typeof u !== 'object' || !u.id || !u.username || !u.name) {
      return { valid: false, error: 'Uno o más usuarios tienen un formato inválido (se requieren id, username y name).' };
    }
  }

  if (!Array.isArray(candidate.leagues)) {
    return { valid: false, error: 'Estructura inválida: Falta la lista de ligas ("leagues").' };
  }

  if (!Array.isArray(candidate.rounds)) {
    return { valid: false, error: 'Estructura inválida: Falta la lista de jornadas ("rounds").' };
  }

  if (!Array.isArray(candidate.matches)) {
    return { valid: false, error: 'Estructura inválida: Falta la lista de partidos ("matches").' };
  }

  const tournaments = Array.isArray(candidate.tournaments) ? candidate.tournaments : [];

  const normalizedData: DatabaseSchema = {
    users: candidate.users,
    leagues: candidate.leagues,
    rounds: candidate.rounds,
    matches: candidate.matches,
    tournaments,
  };

  return {
    valid: true,
    normalizedData,
    stats: {
      userCount: normalizedData.users.length,
      leagueCount: normalizedData.leagues.length,
      roundCount: normalizedData.rounds.length,
      matchCount: normalizedData.matches.length,
      tournamentCount: (normalizedData.tournaments || []).length,
    },
  };
}

export async function restoreUploadedBackup(data: any): Promise<{ success: boolean; stats: any }> {
  const validation = validateDatabaseSchema(data);
  if (!validation.valid || !validation.normalizedData) {
    throw new Error(validation.error || 'Datos de base de datos no válidos.');
  }

  // Create an automatic safety snapshot of current data before overwriting
  await createBackup('Pre-Restauración Subida PC');

  // Persist the restored normalized database
  await saveDatabase(validation.normalizedData);

  return { success: true, stats: validation.stats };
}

export async function getBackupFile(filename: string): Promise<{ filename: string; content: string } | null> {
  ensureDirectoryExists();
  const safeFilename = path.basename(filename);
  const targetFile = path.join(BACKUP_DIR, safeFilename);

  if (!fs.existsSync(targetFile)) {
    return null;
  }

  const content = await fs.promises.readFile(targetFile, 'utf-8');
  return { filename: safeFilename, content };
}

export async function deleteBackup(filename: string): Promise<boolean> {
  ensureDirectoryExists();
  const safeFilename = path.basename(filename);
  if (safeFilename === 'backup_latest.json' || !safeFilename.startsWith('backup_') || !safeFilename.endsWith('.json')) {
    return false;
  }
  const targetFile = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(targetFile)) {
    await fs.promises.unlink(targetFile);
    return true;
  }
  return false;
}
