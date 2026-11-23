'use client';

import React, { useState, useEffect } from 'react';
import { BackupInfo, InkType, League, LeagueFormat, Match, Round, User } from '@/types';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge } from '@/components/InkBadge';

interface AdminClientProps {
  league?: League;
  players: User[];
  rounds: Round[];
  matches: Match[];
  adminUser: { userId: string; username: string; name: string };
}

export function AdminClient({
  league,
  players,
  rounds,
  matches,
  adminUser,
}: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'league' | 'rounds' | 'players' | 'backups'>('rounds');

  // Season / League state
  const [leagueName, setLeagueName] = useState(league?.name || 'CCREW - Caldereta Crew');
  const [seasonName, setSeasonName] = useState('Temporada 1: Porcana');
  const [format, setFormat] = useState<LeagueFormat>(league?.format || 'porcana');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    league?.playerIds || players.map((p) => p.id)
  );

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
  });

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
    } catch {}
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
    const prevPending = matches.filter((m) => m.roundNumber < round.roundNumber && m.status === 'pending').length;
    if (prevPending > 0) {
      const confirmLaunch = confirm(
        `Atención: Hay ${prevPending} partido(s) pendiente(s) en jornadas anteriores. ¿Estás seguro de que deseas lanzar la Jornada ${round.roundNumber}?`
      );
      if (!confirmLaunch) return;
    } else {
      if (!confirm(`¿Lanzar oficialmente la Jornada ${round.roundNumber} para el grupo?`)) return;
    }

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
    } catch {}
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
    if (!confirm(`¿Eliminar al jugador ${p.name}? Se quitará de la lista.`)) return;

    try {
      const res = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: `Jugador ${p.name} eliminado.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
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
    } catch {}
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
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              message.type === 'success'
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'rounds'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jornadas & Formatos ({rounds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'players'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Jugadores ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('league')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'league'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Temporadas & Resets</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'backups'
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

              {rounds.map((round) => {
                const roundMatches = matches.filter((m) => m.roundNumber === round.roundNumber);
                const completed = roundMatches.filter((m) => m.status === 'completed').length;
                const isCurrent = round.isCurrent || round.status === 'active';
                const currentFormat = round.format || league?.format || 'porcana';

                return (
                  <div
                    key={round.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isCurrent
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
                    <div className="mt-1">
                      <DualInkBadge primary={p.primaryInk} secondary={p.secondaryInk} size="sm" />
                    </div>
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
                      });
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                    title="Editar jugador"
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
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected
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
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                              isSelected
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
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
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
                      className={`p-1.5 rounded-lg text-lg flex items-center justify-center border transition-all ${
                        playerForm.avatar === av.id ? 'bg-amber-500/20 border-amber-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={av.name}
                    >
                      <span>{av.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
