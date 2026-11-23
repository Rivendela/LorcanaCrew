'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Trophy,
  Swords,
  Lock,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  ArrowLeft,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { ALL_INKS, LORCANA_AVATARS, LORCANA_INKS } from '@/lib/constants';
import { InkType, Match } from '@/types';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge, InkBadge } from '@/components/InkBadge';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'player';
  avatar: string;
  primaryInk: InkType;
  secondaryInk: InkType;
  inksVisibility: 'public' | 'private';
  bio: string;
  favoriteCard: string;
  createdAt: string;
}

interface UserStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  matchWinRate: number;
  gameWinRate: number;
  points: number;
}

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('mickey');
  const [primaryInk, setPrimaryInk] = useState<InkType>('Amber');
  const [secondaryInk, setSecondaryInk] = useState<InkType>('Steel');
  const [inksVisibility, setInksVisibility] = useState<'public' | 'private'>('public');
  const [bio, setBio] = useState('');
  const [favoriteCard, setFavoriteCard] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.success) return;
        setProfile(data.profile);
        setStats(data.stats);
        setMatches(data.matches || []);

        setName(data.profile.name || '');
        setAvatar(data.profile.avatar || 'mickey');
        setPrimaryInk(data.profile.primaryInk || 'Amber');
        setSecondaryInk(data.profile.secondaryInk || 'Steel');
        setInksVisibility(data.profile.inksVisibility || 'public');
        setBio(data.profile.bio || '');
        setFavoriteCard(data.profile.favoriteCard || '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setMessage({ type: 'error', text: 'Error al cargar tu perfil' });
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          avatar,
          primaryInk,
          secondaryInk,
          inksVisibility,
          bio,
          favoriteCard,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar cambios');
      }

      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      if (profile) {
        setProfile({
          ...profile,
          name,
          avatar,
          primaryInk,
          secondaryInk,
          inksVisibility,
          bio,
          favoriteCard,
        });
      }
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando ficha de Iluminador...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">No se pudo cargar el perfil</h2>
        <p className="text-xs text-slate-400 mb-6">Inicia sesión para acceder a tu perfil personal.</p>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold text-xs hover:bg-amber-300 transition-colors"
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la Clasificación</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                <span>Mi Ficha de Iluminador</span>
                {profile.role === 'admin' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Gestiona tu avatar, colores de mazo, privacidad y consulta tus estadísticas de liga.
              </p>
            </div>
          </div>
        </div>

        {profile.role === 'admin' && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Shield className="w-4 h-4" />
            <span>Panel de Comisionado</span>
          </Link>
        )}
      </div>

      {/* Feedback Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Grid: Form (Left) & Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identity Card */}
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Identidad de Jugador</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre o Apodo en la Liga
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-amber-500 text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Usuario (@handle)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${profile.username}`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500 text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Avatar de Lorcana
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {LORCANA_AVATARS.map((av) => {
                    const isSelected = avatar === av.id;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setAvatar(av.id)}
                        title={av.name}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/20 scale-105 ring-1 ring-amber-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-2xl select-none mb-1">{av.icon}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[55px] text-center leading-tight">
                          {av.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inks & Privacy Card */}
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Tintas del Mazo & Privacidad</span>
                </h2>
                <div className="flex items-center gap-1.5">
                  <DualInkBadge
                    primary={primaryInk}
                    secondary={secondaryInk}
                    visibility="public"
                    size="sm"
                  />
                </div>
              </div>

              {/* Privacy Radio Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ¿Cómo quieres mostrar tus colores a los rivales?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInksVisibility('public')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      inksVisibility === 'public'
                        ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Público</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          Visible
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Tus colores se verán en la tabla y en la lista de jugadores para todos los miembros.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInksVisibility('private')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      inksVisibility === 'private'
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Privado</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Secreto 🔒
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Tus rivales verán <span className="text-amber-300 font-semibold">&ldquo;🔒 Oculto&rdquo;</span> para mantener tu baraja en secreto hasta que juegues.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Inks Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tinta Primaria
                  </label>
                  <select
                    value={primaryInk}
                    onChange={(e) => setPrimaryInk(e.target.value as InkType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-amber-500 text-white text-sm outline-none"
                  >
                    {ALL_INKS.map((ink) => (
                      <option key={ink} value={ink}>
                        {LORCANA_INKS[ink].label} ({ink})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tinta Secundaria
                  </label>
                  <select
                    value={secondaryInk}
                    onChange={(e) => setSecondaryInk(e.target.value as InkType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-amber-500 text-white text-sm outline-none"
                  >
                    {ALL_INKS.map((ink) => (
                      <option key={ink} value={ink}>
                        {LORCANA_INKS[ink].label} ({ink})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lore & Extra Info Card */}
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Ficha de Rol & Carta Favorita</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Carta Favorita de Lorcana
                </label>
                <input
                  type="text"
                  placeholder="Ej: Elsa - Espíritu del Invierno / Be Prepared / A Whole New World"
                  value={favoriteCard}
                  onChange={(e) => setFavoriteCard(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-amber-500 text-white text-sm outline-none placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Biografía / Frase de Combate
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Jugador de control paciente. Si tienes 3 personajes en mesa, prepárate..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-amber-500 text-white text-sm outline-none placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Perfil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Player Stats & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Summary Card */}
          <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4">
              <AvatarBadge avatarId={avatar} name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-extrabold text-white truncate">{name}</h3>
                <p className="text-xs text-slate-400 font-mono">@{profile.username}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <DualInkBadge
                    primary={primaryInk}
                    secondary={secondaryInk}
                    visibility={inksVisibility}
                    isOwnerOrAdmin={true}
                    size="sm"
                  />
                  <span className="text-[11px] font-mono text-slate-400">
                    {inksVisibility === 'private' ? '🔒 Privado' : '🌐 Público'}
                  </span>
                </div>
              </div>
            </div>

            {favoriteCard && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs flex items-center gap-2">
                <span className="text-amber-400 font-semibold">Carta insignia:</span>
                <span className="text-slate-200 font-medium truncate">{favoriteCard}</span>
              </div>
            )}

            {bio && (
              <div className="mt-2 text-xs text-slate-400 italic">
                &ldquo;{bio}&rdquo;
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Mis Estadísticas de Liga</span>
            </h2>

            {/* Big Points Box */}
            <div className="bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-950/20 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                  Puntos Totales
                </span>
                <span className="text-xs text-slate-400">Victoria (3) • Empate (1)</span>
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {stats?.points ?? 0} <span className="text-xs font-normal text-amber-500">PTS</span>
              </div>
            </div>

            {/* Grid of Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Partidos (Bo3)</span>
                <div className="mt-1 font-mono text-sm text-slate-200">
                  <span className="text-emerald-400 font-bold">{stats?.matchesWon ?? 0}V</span> -{' '}
                  <span className="text-amber-400">{stats?.matchesDrawn ?? 0}E</span> -{' '}
                  <span className="text-rose-400">{stats?.matchesLost ?? 0}D</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {stats?.matchesPlayed ?? 0} jugados
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Games Individuales</span>
                <div className="mt-1 font-mono text-sm text-slate-200">
                  <span className="text-emerald-400 font-bold">{stats?.gamesWon ?? 0}</span> a favor /{' '}
                  <span className="text-rose-400">{stats?.gamesLost ?? 0}</span> contra
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                  Dif: {(stats?.gameDiff ?? 0) > 0 ? `+${stats?.gameDiff}` : stats?.gameDiff ?? 0}
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Efectividad Partidos</span>
                <div className="mt-1 text-lg font-black font-mono text-amber-400">
                  {stats?.matchWinRate ?? 0}%
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Efectividad Games</span>
                <div className="mt-1 text-lg font-black font-mono text-slate-200">
                  {stats?.gameWinRate ?? 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Match History */}
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Historial de Partidos</span>
            </h2>

            {matches.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <p className="font-semibold text-slate-400">Aún no has disputado partidos</p>
                <p className="mt-1">
                  Cuando el Comisionado lance las jornadas semanales, aquí verás tus resultados.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {matches.map((m) => {
                  const isCompleted = m.status === 'completed';
                  const isP1 = m.player1Id === profile.id;
                  const myScore = isP1 ? m.player1Score : m.player2Score;
                  const oppScore = isP1 ? m.player2Score : m.player1Score;
                  const isBye = !m.player2Id;

                  const won = isCompleted && myScore > oppScore;
                  const lost = isCompleted && myScore < oppScore;
                  const draw = isCompleted && !isBye && myScore === oppScore;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          J{m.roundNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {isBye ? 'Jornada de Descanso (BYE)' : `Partido de Jornada ${m.roundNumber}`}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {isCompleted ? 'Finalizado' : 'Pendiente de disputar'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <span className="font-mono font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {myScore} - {oppScore}
                          </span>
                        )}

                        {isBye ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            BYE
                          </span>
                        ) : won ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Victoria
                          </span>
                        ) : lost ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Derrota
                          </span>
                        ) : draw ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Empate
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400/80">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
