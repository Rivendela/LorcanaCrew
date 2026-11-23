'use client';

import React, { useState } from 'react';
import { Tournament, TournamentMatch, User } from '@/types';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Trophy, Swords, Calendar, Crown, ChevronDown, ChevronUp, Sparkles, X, CheckCircle2, Shield } from 'lucide-react';
import { LORCANA_FORMATS } from '@/lib/constants';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge } from '@/components/InkBadge';
import Link from 'next/link';

interface TorneosClientProps {
  tournaments: Tournament[];
  players: User[];
  currentUser: { id: string; role: 'admin' | 'player' } | null;
}

export function TorneosClient({
  tournaments,
  players,
  currentUser,
}: TorneosClientProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);

  // Match Scoring Modal state
  const [scoringMatch, setScoringMatch] = useState<{ match: TournamentMatch; tournamentId: string } | null>(null);
  const [score1, setScore1] = useState(2);
  const [score2, setScore2] = useState(0);
  const [matchNotes, setMatchNotes] = useState('');
  const [savingScore, setSavingScore] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const activeTournament = tournaments.find((t) => t.status === 'active') || null;
  const pastTournaments = tournaments.filter((t) => t.status === 'completed');
  const playerMap = new Map<string, User>(players.map((p) => [p.id, p]));

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringMatch) return;
    if (score1 === score2) {
      setModalError('En eliminatorias Bo3 debe haber un ganador (no se permiten empates).');
      return;
    }

    setSavingScore(true);
    setModalError(null);

    try {
      const res = await fetch('/api/tournaments/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: scoringMatch.tournamentId,
          matchId: scoringMatch.match.id,
          player1Score: score1,
          player2Score: score2,
          notes: matchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar resultado');
      }

      setScoringMatch(null);
      window.location.reload();
    } catch (err: any) {
      setModalError(err.message || 'Error de conexión');
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Torneos Oficiales & Copas CCREW</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {pastTournaments.length} torneos celebrados
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Torneos de Disney Lorcana</span>
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
              Copas especiales independientes de la liga semanal. Árbol de eliminatorias Bo3, finales de infarto y coronación de campeones.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all self-start md:self-auto"
            >
              <Shield className="w-4 h-4" />
              <span>Crear o Gestionar Torneo</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'active'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Torneo Actual / En Vivo</span>
          {activeTournament && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Palmarés & Historial ({pastTournaments.length})</span>
        </button>
      </div>

      {/* --- TAB 1: ACTIVE TOURNAMENT --- */}
      {activeTab === 'active' && (
        <div>
          {activeTournament ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/70 border border-amber-500/20 p-5 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      ● EN DISPUTA
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      Formato: {LORCANA_FORMATS[activeTournament.format]?.label || activeTournament.format}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeTournament.playerIds.length} participantes
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{activeTournament.name}</h2>
                  {activeTournament.description && (
                    <p className="text-xs text-slate-400 mt-1">{activeTournament.description}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Fecha del evento</span>
                  <span className="text-sm font-semibold text-slate-300">{activeTournament.date}</span>
                </div>
              </div>

              <TournamentBracket
                tournament={activeTournament}
                players={players}
                currentUser={currentUser}
                onEditMatch={(m) => {
                  setScoringMatch({ match: m, tournamentId: activeTournament.id });
                  setScore1(m.player1Score || 2);
                  setScore2(m.player2Score || 0);
                  setMatchNotes(m.notes || '');
                }}
              />
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">No hay ningún torneo activo en este momento</h3>
              <p className="text-xs text-slate-400 mb-6">
                Cuando el Comisionado cree una nueva copa o torneo eliminatorio, el cuadro de cruces aparecerá aquí en tiempo real.
              </p>
              {pastTournaments.length > 0 && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Ver Torneos Pasados en el Palmarés
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PAST TOURNAMENTS (PALMARÉS) --- */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {pastTournaments.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
              <Crown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">El Palmarés está vacío</h3>
              <p className="text-xs text-slate-400">
                Los torneos finalizados se guardarán aquí automáticamente con su campeón, podio y cuadro completo de resultados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastTournaments.map((t) => {
                const champ = t.championId ? playerMap.get(t.championId) : null;
                const runner = t.runnerUpId ? playerMap.get(t.runnerUpId) : null;
                const isExpanded = expandedTournamentId === t.id;

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 rounded-2xl overflow-hidden shadow-xl transition-all"
                  >
                    {/* Header Row */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {t.date}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              {LORCANA_FORMATS[t.format]?.label || t.format}
                            </span>
                            <span className="text-xs text-slate-500">
                              {t.playerIds.length} participantes
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white">{t.name}</h3>
                        </div>
                      </div>

                      {/* Winners Preview */}
                      <div className="flex items-center gap-4 self-start sm:self-auto flex-wrap">
                        {champ && (
                          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-amber-500/40 px-3.5 py-2 rounded-xl">
                            <span className="text-lg">👑</span>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-amber-400 block leading-tight">
                                CAMPEÓN
                              </span>
                              <span className="text-xs font-bold text-white">{champ.name}</span>
                            </div>
                          </div>
                        )}

                        {runner && (
                          <div className="flex items-center gap-2.5 bg-slate-950/50 border border-slate-800 px-3 py-2 rounded-xl">
                            <span className="text-sm">🥈</span>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                                SUBCAMPEÓN
                              </span>
                              <span className="text-xs font-medium text-slate-300">{runner.name}</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedTournamentId(isExpanded ? null : t.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <span>{isExpanded ? 'Ocultar Cuadro' : 'Ver Cuadro Completo'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Bracket View */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 animate-in fade-in duration-200">
                        <TournamentBracket
                          tournament={t}
                          players={players}
                          currentUser={currentUser}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: SCORING TOURNAMENT MATCH (ADMIN) --- */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setScoringMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Anotar Resultado de Torneo</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{scoringMatch.match.roundName} (Bo3)</p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                    {playerMap.get(scoringMatch.match.player1Id || '')?.name || 'Jugador 1'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={score1}
                    onChange={(e) => setScore1(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2 truncate">
                    {playerMap.get(scoringMatch.match.player2Id || '')?.name || 'Jugador 2'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={score2}
                    onChange={(e) => setScore2(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-xl text-amber-400 p-2 mx-auto outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas de la partida</label>
                <input
                  type="text"
                  placeholder="Ej. Final muy ajustada decidida en el turno 6"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScoringMatch(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingScore ? 'Avanzando ganador...' : 'Confirmar & Avanzar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
