'use client';

import React, { useState, useEffect } from 'react';
import { BackupInfo, InkType, League, LeagueFormat, Match, Round, Tournament, TournamentFormat, TournamentMatch, User } from '@/types';
import { ALL_INKS, LORCANA_AVATARS, LORCANA_FORMATS, LORCANA_INKS } from '@/lib/constants';
import {
  Shield,
  Sparkles,
  Check,
  AlertCircle,
  Calendar,
  Users,
  RefreshCw,
  Rocket,
  CheckCircle2,
  Database,
  Download,
  Trash2,
  Edit,
  UserPlus,
  RotateCcw,
  Sliders,
  Swords,
  X,
  Lock,
  Trophy,
  Crown,
  Eye,
  Award,
  Palette,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge } from '@/components/InkBadge';
import { TournamentBracket } from '@/components/TournamentBracket';
import { TournamentSwissView } from '@/components/TournamentSwissView';
import { calculateDefaultSwissRounds } from '@/lib/tournament-engine';

interface AdminClientProps {
  league?: League;
  players: User[];
  allUsers?: User[];
  rounds: Round[];
  matches: Match[];
  tournaments?: Tournament[];
  adminUser: { id?: string; userId?: string; username: string; name: string };
}

export function AdminClient({
  league,
  players,
  allUsers,
  rounds,
  matches,
  tournaments,
  adminUser,
}: AdminClientProps) {
  const router = useRouter();
  const [activeTabState, setActiveTabState] = useState<'rounds' | 'players' | 'tournaments' | 'league' | 'backups'>('rounds');
  const activeTab = activeTabState;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as any;
      const saved = localStorage.getItem('ccrew_admin_tab') as any;
      const target = hash || saved;
      if (['rounds', 'players', 'tournaments', 'league', 'backups'].includes(target)) {
        setActiveTabState(target);
      }
    }
  }, []);

  const setActiveTab = (tab: 'rounds' | 'players' | 'tournaments' | 'league' | 'backups') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ccrew_admin_tab', tab);
      window.location.hash = tab;
    }
  };

  // Season / League state
  const [leagueName, setLeagueName] = useState(league?.name || 'CCREW - Caldereta Crew');
  const [seasonName, setSeasonName] = useState('Temporada 1: Porcana');
  const [format, setFormat] = useState<LeagueFormat>(league?.format || 'porcana');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    league?.playerIds || players.map((p) => p.id)
  );

  // Mid-season player additions & fixture regeneration state
  const [midSeasonPlayers, setMidSeasonPlayers] = useState<string[]>(
    league?.playerIds || players.map((p) => p.id)
  );

  useEffect(() => {
    if (league?.playerIds) {
      setMidSeasonPlayers(league.playerIds);
    }
  }, [league?.playerIds]);

  const toggleMidSeasonPlayer = (id: string) => {
    setMidSeasonPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backups state
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Player Edit Modal State
  const [editingPlayer, setEditingPlayer] = useState<User | null>(null);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    username: '',
    password: '',
    avatar: 'mickey',
    primaryInk: 'Amber' as InkType,
    secondaryInk: 'Steel' as InkType,
    inksVisibility: 'public' as 'public' | 'private',
    favoriteCard: '',
    bio: '',
  });

  // Tournament Management State
  const tournamentList = tournaments || [];
  const activeTournament = tournamentList.find((t) => t.status === 'active') || null;
  const pastTournaments = tournamentList.filter((t) => t.status === 'completed');

  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [tName, setTName] = useState('I Copa Caldereta Lorcana');
  const [tFormat, setTFormat] = useState<TournamentFormat>('porcana');
  const [tType, setTType] = useState<'bracket' | 'swiss'>('bracket');
  const [tSwissRoundsTotal, setTSwissRoundsTotal] = useState<number>(3);
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
  const [tDescription, setTDescription] = useState('Torneo oficial Bo3 CCREW');
  const [tSelectedPlayers, setTSelectedPlayers] = useState<string[]>(players.map((p) => p.id));

  // Tournament Match Scoring Modal
  const [tScoringMatch, setTScoringMatch] = useState<{ match: TournamentMatch; tournamentId: string } | null>(null);
  const [tScore1, setTScore1] = useState(2);
  const [tScore2, setTScore2] = useState(0);
  const [tMatchNotes, setTMatchNotes] = useState('');
  const [tP1Ink1, setTP1Ink1] = useState<InkType>('Amber');
  const [tP1Ink2, setTP1Ink2] = useState<InkType>('Steel');
  const [tP2Ink1, setTP2Ink1] = useState<InkType>('Amber');
  const [tP2Ink2, setTP2Ink2] = useState<InkType>('Steel');

  // Match Fix Modal State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchScores, setMatchScores] = useState({ s1: 0, s2: 0, notes: '', status: 'completed' as 'pending' | 'completed' });

  // Fetch backups when switching to backups tab
  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch { }
    setLoadingBackups(false);
  };

  useEffect(() => {
    if (activeTab === 'backups') {
      fetchBackups();
    }
  }, [activeTab]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // --- ACTIONS ---

  // 1. Create or Advance Season
  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayers.length < 2) {
      setMessage({ type: 'error', text: 'Selecciona al menos 2 jugadores' });
      return;
    }

    if (!confirm('¿Deseas generar la temporada? Esto creará el calendario de cruces semanales Bo3.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/league/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leagueName,
          seasonName,
          format,
          playerIds: selectedPlayers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar la liga');

      setMessage({ type: 'success', text: '¡Nueva temporada y jornadas generadas con éxito!' });
      router.refresh();
      setActiveTab('rounds');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Reset League
  const handleResetLeague = async () => {
    const confirmText = prompt('Escribe "RESET" para confirmar el reseteo completo de la liga (no se borrarán los jugadores):');
    if (confirmText !== 'RESET') return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/league/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'La liga ha sido reseteada a 0.' });
      router.refresh();
      setActiveTab('league');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Launch Round
  const handleLaunchRound = async (round: Round) => {
    const prevPending = matches.filter(
      (m) => m.roundNumber < round.roundNumber && m.status === 'pending' && m.player2Id && !m.isBye
    ).length;
    if (prevPending > 0) {
      alert(
        `No se puede pasar a la Jornada ${round.roundNumber}: aún quedan ${prevPending} partido(s) pendiente(s) en jornadas anteriores. Todos los partidos deben haberse completado antes de avanzar.`
      );
      setMessage({
        type: 'error',
        text: `No se puede avanzar de jornada: quedan ${prevPending} partido(s) pendientes en jornadas anteriores.`,
      });
      return;
    }

    if (!confirm(`¿Lanzar oficialmente la Jornada ${round.roundNumber} para el grupo?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/rounds/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: league?.id,
          roundId: round.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: `¡Jornada ${round.roundNumber} lanzada oficialmente!` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 4. Close Round (dispatches auto-backup)
  const handleCloseRound = async (round: Round) => {
    const roundPending = matches.filter(
      (m) => m.roundId === round.id && m.status === 'pending' && m.player2Id && !m.isBye
    ).length;
    if (roundPending > 0) {
      alert(
        `No se puede cerrar la Jornada ${round.roundNumber}: aún quedan ${roundPending} partido(s) pendiente(s). Todos los partidos deben haberse jugado antes de cerrar.`
      );
      setMessage({
        type: 'error',
        text: `No se puede cerrar la Jornada ${round.roundNumber}: quedan ${roundPending} partido(s) pendientes.`,
      });
      return;
    }

    if (!confirm(`¿Cerrar oficialmente la Jornada ${round.roundNumber}? Esto creará automáticamente un punto de restauración (Backup).`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: round.id,
          leagueId: league?.id,
          action: 'close',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: `Jornada ${round.roundNumber} cerrada y backup automático generado.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 5. Change Weekly Format for a specific round
const handleChangeRoundFormat = async (roundId: string, newFormat: LeagueFormat) => {
  try {
    const res = await fetch('/api/admin/rounds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, format: newFormat }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: 'Formato de la jornada actualizado.' });
      router.refresh();
    }
  } catch { }
};

// 6. Save Match Score (Fix / Retocar)
const handleSaveMatchScore = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingMatch) return;

  setLoading(true);
  try {
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: editingMatch.id,
        player1Score: matchScores.s1,
        player2Score: matchScores.s2,
        status: matchScores.status,
        notes: matchScores.notes,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: 'Resultado del partido corregido con éxito.' });
    setEditingMatch(null);
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

// 7. Save Player (Create or Edit)
const handleSavePlayer = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isCreatingPlayer) {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `Jugador ${playerForm.name} creado correctamente.` });
    } else if (editingPlayer) {
      const res = await fetch('/api/admin/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlayer.id,
          name: playerForm.name,
          username: playerForm.username,
          avatar: playerForm.avatar,
          primaryInk: playerForm.primaryInk,
          secondaryInk: playerForm.secondaryInk,
          inksVisibility: playerForm.inksVisibility,
          favoriteCard: playerForm.favoriteCard,
          bio: playerForm.bio,
          newPassword: playerForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `Jugador ${playerForm.name} actualizado.` });
    }

    setEditingPlayer(null);
    setIsCreatingPlayer(false);
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

// 8. Delete Player
const handleDeletePlayer = async (p: User) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al jugador "${p.name}" (@${p.username})?`)) return;

  try {
    const res = await fetch('/api/admin/players', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: `Jugador ${p.name} eliminado.` });
    if (editingPlayer?.id === p.id) {
      setEditingPlayer(null);
    }
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  }
};

// 8.1. Tournament Handlers
const handleCreateTournament = async (e: React.FormEvent) => {
  e.preventDefault();
  if (tSelectedPlayers.length < 2) {
    setMessage({ type: 'error', text: 'Selecciona al menos 2 jugadores para el torneo.' });
    return;
  }
  setLoading(true);
  try {
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tName,
        format: tFormat,
        type: tType,
        swissRoundsTotal: tType === 'swiss' ? tSwissRoundsTotal : undefined,
        date: tDate,
        description: tDescription,
        playerIds: tSelectedPlayers,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: `¡Torneo "${tName}" (${tType === 'swiss' ? 'Suizo' : 'Eliminatoria'}) creado y generado con éxito!` });
    setIsCreatingTournament(false);
    setActiveTab('tournaments');
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

const handleDeleteTournament = async (tId: string, name: string) => {
  if (!confirm(`¿Eliminar el torneo "${name}"? Se borrarán sus emparejamientos y resultados.`)) return;
  setLoading(true);
  try {
    const res = await fetch('/api/tournaments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: 'Torneo eliminado.' });
    setActiveTab('tournaments');
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

const handleSaveTournamentScore = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!tScoringMatch) return;
  if (tScore1 === tScore2) {
    setMessage({ type: 'error', text: 'En eliminatorias Bo3 debe haber un ganador (sin empates).' });
    return;
  }
  setLoading(true);
  try {
    const res = await fetch('/api/tournaments/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournamentId: tScoringMatch.tournamentId,
        matchId: tScoringMatch.match.id,
        player1Score: tScore1,
        player2Score: tScore2,
        player1Inks: [tP1Ink1, tP1Ink2],
        player2Inks: [tP2Ink1, tP2Ink2],
        notes: tMatchNotes,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.isFinished) {
      setMessage({ type: 'success', text: '¡Torneo completado y Campeón coronado! Ha pasado al Palmarés.' });
    } else {
      setMessage({ type: 'success', text: 'Resultado registrado y ganador avanzado en el cuadro.' });
    }
    setTScoringMatch(null);
    setActiveTab('tournaments');
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

// 8.2. Mid-Season Addition: Regenerate Future Schedule
const handleRegenerateFuture = async () => {
  if (!league?.id) {
    setMessage({ type: 'error', text: 'No hay ninguna liga activa para regenerar cruces' });
    return;
  }
  if (midSeasonPlayers.length < 2) {
    setMessage({ type: 'error', text: 'La liga debe tener al menos 2 jugadores' });
    return;
  }
  if (
    !confirm(
      '¿Confirmar regeneración de cruces futuros? Las jornadas pasadas ya jugadas o cerradas se mantendrán 100% intactas. Solo se programarán los cruces de las semanas pendientes para incluir a los jugadores seleccionados.'
    )
  ) {
    return;
  }

  setLoading(true);
  setMessage(null);
  try {
    const res = await fetch('/api/league/regenerate-future', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leagueId: league.id,
        playerIds: midSeasonPlayers,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: data.message });
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

// 9. Backups (Create & Restore)
const handleCreateBackupNow = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', label: 'Manual Admin' }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: 'Backup creado con los datos actuales.' });
      fetchBackups();
    }
  } catch { }
  setLoading(false);
};

const handleRestoreBackup = async (filename?: string) => {
  if (!confirm('¿Restaurar la base de datos a este backup? Se sobrescribirán los datos actuales.')) return;

  setLoading(true);
  try {
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', filename }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessage({ type: 'success', text: 'Base de datos restaurada con éxito desde el backup.' });
    router.refresh();
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setLoading(false);
  }
};

const completedMatches = matches.filter((m) => m.status === 'completed').length;
const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Panel de Comisionado CCREW</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                FULL CONTROL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Control total de jugadores, rondas semanales, formatos, corrección de partidas y backups
            </p>
          </div>
        </div>
      </div>

      {/* Action feedback message */}
      {message && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${message.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>

    {/* Tabs */}
    <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
      <button
        onClick={() => setActiveTab('rounds')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'rounds'
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Jornadas & Formatos ({rounds.length})</span>
      </button>

      <button
        onClick={() => setActiveTab('players')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'players'
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
      >
        <Users className="w-4 h-4" />
        <span>Gestión de Jugadores ({players.length})</span>
      </button>

      <button
        onClick={() => setActiveTab('tournaments')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'tournaments'
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
      >
        <Trophy className="w-4 h-4" />
        <span>Torneos CCREW ({tournamentList.length})</span>
      </button>

      <button
        onClick={() => setActiveTab('league')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'league'
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
      >
        <Sliders className="w-4 h-4" />
        <span>Temporadas & Resets</span>
      </button>

      <button
        onClick={() => setActiveTab('backups')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'backups'
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
      >
        <Database className="w-4 h-4" />
        <span>Backups Semanales</span>
      </button>
    </div>

    {/* --- TAB 1: JORNADAS & FORMATOS & CORRECCIÓN DE PARTIDOS --- */}
    {activeTab === 'rounds' && (
      <div className="space-y-6">
        {rounds.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Aún no hay jornadas generadas</h3>
            <p className="text-xs text-slate-400 mb-6">Ve a la pestaña de "Temporadas & Resets" para generar la primera temporada.</p>
            <button
              onClick={() => setActiveTab('league')}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Generar Temporada
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-amber-400" />
                  <span>Lanzador de Jornadas y Formato Semanal</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Lanza rondas, cambia el formato de cualquier semana (Porcana, Core o Infiniti) y corrige partidos erróneos.
                </p>
              </div>
            </div>

            {/* Mid-Season Player Enrollment Callout */}
            {league && (
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <span>¿Se une gente nueva a la liga?</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold">
                        NUEVO
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Añade jugadores a mitad de temporada y regenera solo los cruces a futuro. Lo jugado en jornadas pasadas queda 100% intacto.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('league')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Incorporar & Regenerar Cruces</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {rounds.map((round) => {
              const roundMatches = matches.filter((m) => m.roundNumber === round.roundNumber);
              const completed = roundMatches.filter((m) => m.status === 'completed').length;
              const isCurrent = round.isCurrent || round.status === 'active';
              const currentFormat = round.format || league?.format || 'porcana';

              return (
                <div
                  key={round.id}
                  className={`rounded-2xl border p-5 transition-all ${isCurrent
                    ? 'bg-slate-900/90 border-amber-500/40 shadow-xl'
                    : 'bg-slate-900/50 border-slate-800'
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-white">{round.title}</h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ● EN CURSO
                          </span>
                        )}
                        {round.status === 'completed' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ FINALIZADA
                          </span>
                        )}
                        {round.status === 'upcoming' && !isCurrent && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Pendiente de lanzar
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          ({completed}/{roundMatches.length} partidos reportados)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Semana programada: {round.startDate} al {round.endDate}
                      </p>
                    </div>

                    {/* Controls for this round */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Format selector for the week */}
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Formato:</span>
                        <select
                          value={currentFormat}
                          onChange={(e) => handleChangeRoundFormat(round.id, e.target.value as LeagueFormat)}
                          className="bg-transparent text-xs font-semibold text-amber-400 focus:outline-none cursor-pointer"
                        >
                          <option value="porcana" className="bg-slate-950">Porcana</option>
                          <option value="core" className="bg-slate-950">Core</option>
                          <option value="infiniti" className="bg-slate-950">Infiniti</option>
                        </select>
                      </div>

                      {/* Launch button */}
                      {!isCurrent && (
                        <button
                          onClick={() => handleLaunchRound(round)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Lanzar Ronda</span>
                        </button>
                      )}

                      {/* Close round button */}
                      {isCurrent && (
                        <button
                          onClick={() => handleCloseRound(round)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cerrar Ronda & Backup</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Matches List for this round (with Quick Edit / Retocar) */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {roundMatches.map((match) => {
                      const p1 = playerMap.get(match.player1Id);
                      const p2 = match.player2Id ? playerMap.get(match.player2Id) : null;
                      const isBye = !p2;

                      return (
                        <div
                          key={match.id}
                          className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-200 truncate">{p1?.name || 'Jugador'}</span>
                            <span className="font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {match.status === 'completed' ? `${match.player1Score} - ${match.player2Score}` : 'vs'}
                            </span>
                            <span className="font-semibold text-slate-200 truncate">{isBye ? 'BYE (Descanso)' : p2?.name}</span>
                          </div>

                          {!isBye && (
                            <button
                              onClick={() => {
                                setEditingMatch(match);
                                setMatchScores({
                                  s1: match.player1Score,
                                  s2: match.player2Score,
                                  notes: match.notes || '',
                                  status: match.status === 'completed' ? 'completed' : 'pending',
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors shrink-0"
                              title="Corregir partido"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* --- TAB 2: GESTIÓN DE JUGADORES --- */}
    {activeTab === 'players' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Gestión Completa de Jugadores</span>
            </h2>
            <p className="text-xs text-slate-400">
              Añade jugadores directamente, edita sus datos o resetea sus contraseñas en caso de olvido.
            </p>
          </div>

          <button
            onClick={() => {
              setIsCreatingPlayer(true);
              setEditingPlayer(null);
              setPlayerForm({
                name: '',
                username: '',
                password: '',
                avatar: 'mickey',
                primaryInk: 'Amber',
                secondaryInk: 'Steel',
                inksVisibility: 'public',
                favoriteCard: '',
                bio: '',
              });
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir Jugador Directamente</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AvatarBadge avatarId={p.avatar} name={p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-200 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">@{p.username}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <DualInkBadge primary={p.primaryInk} secondary={p.secondaryInk} size="sm" isOwnerOrAdmin={true} />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.inksVisibility === 'private' ? '🔒 Oculto' : '🌐 Público'}
                    </span>
                  </div>
                  {p.favoriteCard && (
                    <p className="text-[10px] text-amber-400/90 truncate mt-0.5">
                      ✨ {p.favoriteCard}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingPlayer(p);
                    setIsCreatingPlayer(false);
                    setPlayerForm({
                      name: p.name,
                      username: p.username,
                      password: '',
                      avatar: p.avatar || 'mickey',
                      primaryInk: p.primaryInk || 'Amber',
                      secondaryInk: p.secondaryInk || 'Steel',
                      inksVisibility: p.inksVisibility || 'public',
                      favoriteCard: p.favoriteCard || '',
                      bio: p.bio || '',
                    });
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                  title="Editar información del jugador"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeletePlayer(p)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Eliminar jugador"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* --- TAB: GESTIÓN DE TORNEOS CCREW --- */}
    {activeTab === 'tournaments' && (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Gestión de Torneos y Copas CCREW</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crea torneos eliminatorios independientes de la liga semanal. Registra marcadores Bo3 y corona campeones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingTournament(!isCreatingTournament)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Swords className="w-4 h-4" />
              <span>{isCreatingTournament ? 'Ocultar Formulario' : 'Crear Nuevo Torneo'}</span>
            </button>
          </div>
        </div>

        {/* Create Tournament Form */}
        {isCreatingTournament && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Configurar Nuevo Torneo CCREW</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Elige el formato, el sistema de juego (Eliminatoria o Suizo) y los participantes para arrancar el torneo.
            </p>

            <form onSubmit={handleCreateTournament} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nombre del Torneo
                  </label>
                  <input
                    type="text"
                    required
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="Ej. I Torneo del Caldero"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Formato de Barajas
                  </label>
                  <select
                    value={tFormat}
                    onChange={(e) => setTFormat(e.target.value as TournamentFormat)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="porcana">Porcana (Especial CCREW)</option>
                    <option value="core">Core Constructed (Oficial)</option>
                    <option value="infiniti">Infiniti (Libre / Casual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Sistema / Tipo de Torneo
                  </label>
                  <select
                    value={tType}
                    onChange={(e) => {
                      const val = e.target.value as 'bracket' | 'swiss';
                      setTType(val);
                      if (val === 'swiss') {
                        setTSwissRoundsTotal(calculateDefaultSwissRounds(tSelectedPlayers.length));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="bracket">⚔️ Eliminatoria Directa (Playoffs Bo3)</option>
                    <option value="swiss">🛡️ Sistema Suizo (Todas las Rondas)</option>
                  </select>
                </div>

                {tType === 'swiss' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Rondas Suizas Totales
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={tSwissRoundsTotal}
                      onChange={(e) => setTSwissRoundsTotal(Math.max(2, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Fecha del Torneo
                    </label>
                    <input
                      type="date"
                      value={tDate}
                      onChange={(e) => setTDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                )}
              </div>

              {tType === 'swiss' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Fecha del Torneo
                    </label>
                    <input
                      type="date"
                      value={tDate}
                      onChange={(e) => setTDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Descripción / Detalles (Opcional)
                    </label>
                    <input
                      type="text"
                      value={tDescription}
                      onChange={(e) => setTDescription(e.target.value)}
                      placeholder="Ej. Torneo suizo Bo3 con desempates Buchholz"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              )}

              {tType === 'bracket' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Descripción / Detalles (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tDescription}
                    onChange={(e) => setTDescription(e.target.value)}
                    placeholder="Ej. Torneo eliminatorio de fin de semana con premio para el campeón"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              )}

              {/* Player multi-selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Participantes ({tSelectedPlayers.length} de {players.length} seleccionados)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setTSelectedPlayers(players.map((p) => p.id))}
                      className="text-amber-400 hover:underline"
                    >
                      Seleccionar todos
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setTSelectedPlayers([])}
                      className="text-slate-400 hover:underline"
                    >
                      Deseleccionar todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  {players.map((p) => {
                    const isSelected = tSelectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setTSelectedPlayers((prev) =>
                            prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${isSelected
                          ? 'bg-amber-500/20 border-amber-500/50 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <AvatarBadge avatarId={p.avatar} name={p.name} size="sm" />
                        <span className="text-xs font-semibold truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTournament(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Generando Torneo...' : tType === 'swiss' ? 'Generar Rondas Suizas & Iniciar Torneo' : 'Generar Cuadro de Eliminatorias & Iniciar Torneo'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Tournament */}
        {activeTournament && (
          <div className="bg-slate-900/70 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    ● EN DISPUTA
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {activeTournament.date}
                  </span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {LORCANA_FORMATS[activeTournament.format]?.label || activeTournament.format}
                  </span>
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {activeTournament.type === 'swiss' ? '🛡️ Sistema Suizo' : '⚔️ Playoffs Eliminatorios'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{activeTournament.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteTournament(activeTournament.id, activeTournament.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Torneo</span>
                </button>
              </div>
            </div>

            {activeTournament.type === 'swiss' ? (
              <TournamentSwissView
                tournament={activeTournament}
                players={players}
                currentUser={{ id: adminUser.id || adminUser.userId || 'admin', role: 'admin' }}
              />
            ) : (
              <TournamentBracket
                tournament={activeTournament}
                players={players}
                currentUser={{ id: adminUser.id || adminUser.userId || 'admin', role: 'admin' }}
                onEditMatch={(m) => {
                  const p1 = m.player1Id ? playerMap.get(m.player1Id) : null;
                  const p2 = m.player2Id ? playerMap.get(m.player2Id) : null;
                  setTScoringMatch({ match: m, tournamentId: activeTournament.id });
                  setTScore1(m.player1Score || 2);
                  setTScore2(m.player2Score || 0);
                  setTP1Ink1(m.player1Inks?.[0] || p1?.primaryInk || 'Amber');
                  setTP1Ink2(m.player1Inks?.[1] || p1?.secondaryInk || 'Steel');
                  setTP2Ink1(m.player2Inks?.[0] || p2?.primaryInk || 'Amber');
                  setTP2Ink2(m.player2Inks?.[1] || p2?.secondaryInk || 'Steel');
                  setTMatchNotes(m.notes || '');
                }}
              />
            )}
          </div>
        )}

        {/* Past Tournaments (Palmarés) in Admin */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Palmarés de Torneos Pasados ({pastTournaments.length})</span>
          </h3>

          {pastTournaments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aún no hay torneos finalizados. Cuando un torneo concluya su Gran Final, se guardará aquí automáticamente.
            </div>
          ) : (
            <div className="space-y-3">
              {pastTournaments.map((t) => {
                const champ = t.championId ? playerMap.get(t.championId) : null;
                const runner = t.runnerUpId ? playerMap.get(t.runnerUpId) : null;

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between flex-wrap gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                          {t.date}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400">
                          {LORCANA_FORMATS[t.format]?.label || t.format}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {t.type === 'swiss' ? '🛡️ Suizo' : '⚔️ Playoffs'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                    </div>

                    <div className="flex items-center gap-4">
                      {champ && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                          <span>👑</span>
                          <span className="text-xs font-bold text-amber-300">{champ.name}</span>
                        </div>
                      )}
                      {runner && (
                        <div className="text-xs text-slate-400 hidden sm:block">
                          🥈 {runner.name}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteTournament(t.id, t.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar torneo del historial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* --- TAB 3: TEMPORADAS & RESETS --- */}
    {activeTab === 'league' && (
      <div className="space-y-6">
        {/* Current Season Info */}
        {league && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{league.name}</h3>
                <p className="text-xs text-slate-400">{league.seasonName} • {league.playerIds.length} jugadores inscritos</p>
              </div>
              <button
                onClick={handleResetLeague}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetear Liga a 0</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Jornadas Totales</span>
                <span className="text-xl font-mono font-bold text-white">{rounds.length}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Jugadores</span>
                <span className="text-xl font-mono font-bold text-white">{league.playerIds.length}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Partidos Jugados</span>
                <span className="text-xl font-mono font-bold text-emerald-400">{completedMatches}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Pendientes</span>
                <span className="text-xl font-mono font-bold text-amber-400">{matches.length - completedMatches}</span>
              </div>
            </div>
          </div>
        )}

        {/* --- MID-SEASON ENROLLMENT: AÑADIR JUGADORES Y REGENERAR CRUCES A FUTURO --- */}
        {league && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Añadir Jugadores a la Liga & Regenerar Cruces a Futuro
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Si entra un nuevo participante a mitad de temporada, selecciónalo aquí y regenera el calendario restante.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Total en liga:</span>
                <span className="font-bold text-emerald-400">{midSeasonPlayers.length} jugadores</span>
              </div>
            </div>

            {/* Info Alert on Full Preservation of Past Rounds */}
            <div className="mb-5 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-start gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">
                  Las jornadas pasadas y sus resultados quedarán 100% guardadas e intactas
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Las jornadas completadas, los resultados jugados, los BYEs anteriores y las puntuaciones se mantienen intactos. Solo se regenerarán a futuro los cruces de las semanas pendientes para programar los partidos restantes e incorporar a los nuevos miembros.
                </p>
              </div>
            </div>

            {/* Player Selector for League */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Jugadores Seleccionados para la Liga ({midSeasonPlayers.length} de {players.length})
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMidSeasonPlayers(players.map((p) => p.id))}
                    className="text-amber-400 hover:underline"
                  >
                    Seleccionar todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {players.map((p) => {
                  const isEnrolled = midSeasonPlayers.includes(p.id);
                  const wasInOriginal = (league.playerIds || []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleMidSeasonPlayer(p.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isEnrolled
                          ? wasInOriginal
                            ? 'bg-amber-500/15 border-amber-500/40 text-slate-100 shadow-sm'
                            : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-100 shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <AvatarBadge avatarId={p.avatar} name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold truncate leading-tight">{p.name}</p>
                          {!wasInOriginal && isEnrolled && (
                            <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-semibold shrink-0">
                              NUEVO
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <DualInkBadge primary={p.primaryInk} secondary={p.secondaryInk} size="sm" />
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                          isEnrolled
                            ? wasInOriginal
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-emerald-400 text-slate-950 border-emerald-300 font-bold'
                            : 'border-slate-700'
                        }`}
                      >
                        {isEnrolled && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-400">
                Pulsa el botón para guardar los nuevos participantes y reprogramar las jornadas futuras:
              </p>
              <button
                type="button"
                onClick={handleRegenerateFuture}
                disabled={loading || midSeasonPlayers.length < 2}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerar Cruces a Futuro</span>
              </button>
            </div>
          </div>
        )}

        {/* Create or Advance Season Form */}
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Crear Nueva Temporada / Avanzar Liga</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Selecciona el formato predeterminado y a los amigos que van a participar para generar el nuevo calendario Round-Robin Bo3.
          </p>

          <form onSubmit={handleCreateLeague} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nombre de la Liga
                </label>
                <input
                  type="text"
                  required
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nombre de la Temporada
                </label>
                <input
                  type="text"
                  required
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="Ej. Temporada 2: Rise of Floodborn"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Formato Predeterminado
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as LeagueFormat)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                >
                  <option value="porcana">Porcana (Especial CCREW)</option>
                  <option value="core">Core Constructed (Oficial)</option>
                  <option value="infiniti">Infiniti (Casual / Libre)</option>
                </select>
              </div>
            </div>

            {/* Player Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Jugadores Participantes ({selectedPlayers.length} de {players.length} seleccionados)
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayers(players.map((p) => p.id))}
                    className="text-amber-400 hover:underline"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayers([])}
                    className="text-slate-400 hover:underline"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">No hay jugadores registrados todavía</p>
                  <p className="mt-1">Pídeles a tus amigos que creen su perfil en la web o créalos desde la pestaña "Gestión de Jugadores".</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {players.map((p) => {
                    const isSelected = selectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-slate-100 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <AvatarBadge avatarId={p.avatar} name={p.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate leading-tight">{p.name}</p>
                          <div className="mt-0.5">
                            <DualInkBadge primary={p.primaryInk} secondary={p.secondaryInk} size="sm" />
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'border-slate-700'
                            }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || selectedPlayers.length < 2}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Generando Cruces...' : 'Generar Cruces y Comenzar Temporada'}</span>
            </button>
          </form>
        </div>
      </div>
    )}

    {/* --- TAB 4: BACKUPS Y RESTAURACIÓN --- */}
    {activeTab === 'backups' && (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>Copias de Seguridad (Backups JSON)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Los backups se actualizan automáticamente al cerrar cada jornada semanal. También puedes forzar una copia manual o descargarla.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBackupNow}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Backup Ahora</span>
            </button>

            <a
              href="/api/admin/backup?download=true"
              download
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar JSON</span>
            </a>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loadingBackups ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando lista de backups...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aún no hay backups generados. Pulsa en "Actualizar Backup Ahora" para guardar el primer punto de restauración.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {backups.map((b) => (
                <div key={b.filename} className="p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-950/40">
                  <div>
                    <p className="font-bold text-white text-sm">{b.label}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {new Date(b.createdAt).toLocaleString()} • {(b.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Este Backup</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* --- MODAL: FIX / EDIT MATCH SCORES --- */}
    {editingMatch && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setEditingMatch(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Corregir Partido (Admin)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Jornada {editingMatch.roundNumber}</p>

          <form onSubmit={handleSaveMatchScore} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {playerMap.get(editingMatch.player1Id)?.name || 'P1'}
                </span>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={matchScores.s1}
                  onChange={(e) => setMatchScores({ ...matchScores, s1: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-lg text-amber-400 p-1 mx-auto"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {editingMatch.player2Id ? playerMap.get(editingMatch.player2Id)?.name : 'BYE'}
                </span>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={matchScores.s2}
                  onChange={(e) => setMatchScores({ ...matchScores, s2: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-amber-400 p-1 mx-auto"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Estado</label>
              <select
                value={matchScores.status}
                onChange={(e) => setMatchScores({ ...matchScores, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="completed">Completado</option>
                <option value="pending">Pendiente por disputar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Notas / Motivo del cambio</label>
              <input
                type="text"
                value={matchScores.notes}
                onChange={(e) => setMatchScores({ ...matchScores, notes: e.target.value })}
                placeholder="Ej. Corrección por error de reporte"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300"
              >
                Guardar Corrección
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* --- MODAL: CREATE OR EDIT PLAYER --- */}
    {(isCreatingPlayer || editingPlayer) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => {
              setEditingPlayer(null);
              setIsCreatingPlayer(false);
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>{isCreatingPlayer ? 'Crear Nuevo Jugador' : `Editar a ${editingPlayer?.name}`}</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Configura sus datos de Iluminador</p>

          <form onSubmit={handleSavePlayer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre / Apodo</label>
                <input
                  type="text"
                  required
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Usuario (Login)</label>
                <input
                  type="text"
                  required
                  value={playerForm.username}
                  onChange={(e) => setPlayerForm({ ...playerForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isCreatingPlayer ? 'Contraseña inicial' : 'Nueva Contraseña (dejar vacío para mantener actual)'}
              </label>
              <input
                type="password"
                value={playerForm.password}
                onChange={(e) => setPlayerForm({ ...playerForm, password: e.target.value })}
                placeholder={isCreatingPlayer ? 'Ej. ccrew123' : '••••••••'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Inks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tinta Primaria</label>
                <select
                  value={playerForm.primaryInk}
                  onChange={(e) => setPlayerForm({ ...playerForm, primaryInk: e.target.value as InkType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {ALL_INKS.map((ink) => (
                    <option key={ink} value={ink}>
                      {LORCANA_INKS[ink].label} ({ink})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tinta Secundaria</label>
                <select
                  value={playerForm.secondaryInk}
                  onChange={(e) => setPlayerForm({ ...playerForm, secondaryInk: e.target.value as InkType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {ALL_INKS.map((ink) => (
                    <option key={ink} value={ink}>
                      {LORCANA_INKS[ink].label} ({ink})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avatar</label>
              <div className="grid grid-cols-8 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                {LORCANA_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setPlayerForm({ ...playerForm, avatar: av.id })}
                    className={`p-1.5 rounded-lg text-lg flex items-center justify-center border transition-all ${playerForm.avatar === av.id ? 'bg-amber-500/20 border-amber-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    title={av.name}
                  >
                    <span>{av.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visibilidad de Tintas</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlayerForm({ ...playerForm, inksVisibility: 'public' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${playerForm.inksVisibility === 'public'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Público</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerForm({ ...playerForm, inksVisibility: 'private' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${playerForm.inksVisibility === 'private'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privado (Oculto)</span>
                </button>
              </div>
            </div>

            {/* Favorite Card & Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Carta Favorita de Lorcana</label>
              <input
                type="text"
                value={playerForm.favoriteCard}
                onChange={(e) => setPlayerForm({ ...playerForm, favoriteCard: e.target.value })}
                placeholder="Ej. Elsa - Espíritu del Invierno"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Biografía / Lema</label>
              <textarea
                rows={2}
                value={playerForm.bio}
                onChange={(e) => setPlayerForm({ ...playerForm, bio: e.target.value })}
                placeholder="Ej. Jugador de control paciente"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {editingPlayer ? (
                <button
                  type="button"
                  onClick={() => handleDeletePlayer(editingPlayer)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Jugador</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlayer(null);
                    setIsCreatingPlayer(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md"
                >
                  {isCreatingPlayer ? 'Crear Jugador' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* --- MODAL: SCORING TOURNAMENT MATCH (ADMIN) --- */}
    {tScoringMatch && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setTScoringMatch(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Anotar Resultado de Torneo</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">{tScoringMatch.match.roundName} (Bo3)</p>

          <form onSubmit={handleSaveTournamentScore} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                  {playerMap.get(tScoringMatch.match.player1Id || '')?.name || 'Jugador 1'}
                </span>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={tScore1}
                  onChange={(e) => setTScore1(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                  {playerMap.get(tScoringMatch.match.player2Id || '')?.name || 'Jugador 2'}
                </span>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={tScore2}
                  onChange={(e) => setTScore2(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                />
              </div>
            </div>

            {/* Quick Presets for Tournament Bo3 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Resultados Rápidos Bo3
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: `${playerMap.get(tScoringMatch.match.player1Id || '')?.name || 'P1'} 2 - 0`,
                    s1: 2,
                    s2: 0,
                  },
                  {
                    label: `${playerMap.get(tScoringMatch.match.player1Id || '')?.name || 'P1'} 2 - 1`,
                    s1: 2,
                    s2: 1,
                  },
                  {
                    label: `${playerMap.get(tScoringMatch.match.player2Id || '')?.name || 'P2'} 2 - 1`,
                    s1: 1,
                    s2: 2,
                  },
                  {
                    label: `${playerMap.get(tScoringMatch.match.player2Id || '')?.name || 'P2'} 2 - 0`,
                    s1: 0,
                    s2: 2,
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTScore1(preset.s1);
                      setTScore2(preset.s2);
                    }}
                    className={`px-2 py-2 text-xs font-semibold rounded-xl border transition-all text-center truncate ${
                      tScore1 === preset.s1 && tScore2 === preset.s2
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inks Pickers for Meta Stats */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Colores de baraja jugados (Meta Report)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block truncate">
                    {playerMap.get(tScoringMatch.match.player1Id || '')?.name || 'Jugador 1'}:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={tP1Ink1}
                      onChange={(e) => setTP1Ink1(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                      ))}
                    </select>
                    <select
                      value={tP1Ink2}
                      onChange={(e) => setTP1Ink2(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block truncate">
                    {playerMap.get(tScoringMatch.match.player2Id || '')?.name || 'Jugador 2'}:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={tP2Ink1}
                      onChange={(e) => setTP2Ink1(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                      ))}
                    </select>
                    <select
                      value={tP2Ink2}
                      onChange={(e) => setTP2Ink2(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>{LORCANA_INKS[ink].name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Notas del partido</label>
              <input
                type="text"
                placeholder="Ej. Final muy ajustada"
                value={tMatchNotes}
                onChange={(e) => setTMatchNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTScoringMatch(null)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md"
              >
                {loading ? 'Guardando...' : 'Confirmar & Avanzar Ganador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
