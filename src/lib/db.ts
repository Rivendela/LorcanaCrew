import fs from 'fs';
import path from 'path';
import { DatabaseSchema, League, Match, Round, User } from '@/types';
import { generateRoundRobinSchedule } from './league-engine';

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
      cache: 'no-store',
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

  // 1. If Cloud KV (Vercel KV / Upstash) is configured:
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
  notes?: string
): Promise<Match | null> {
  const db = await getDatabase();
  const match = db.matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.status = 'completed';
  match.reportedBy = reportedByUserId;
  match.notes = notes || match.notes;
  match.playedAt = new Date().toISOString();

  await saveDatabase(db);
  return match;
}

export async function launchRound(leagueId: string, roundId: string): Promise<Round | null> {
  const db = await getDatabase();
  const league = db.leagues.find((l) => l.id === leagueId);
  const targetRound = db.rounds.find((r) => r.id === roundId && r.leagueId === leagueId);
  if (!targetRound || !league) return null;

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
      await saveDatabase(dataToRestore);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error restoring backup:', err);
    return false;
  }
}
