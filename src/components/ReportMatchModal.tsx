'use client';

import React, { useState } from 'react';
import { InkType, Match, User } from '@/types';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import { X, Check, Swords, AlertCircle, Palette } from 'lucide-react';
import { ALL_INKS, LORCANA_INKS } from '@/lib/constants';

interface ReportMatchModalProps {
  match: Match;
  player1: User;
  player2: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportMatchModal({
  match,
  player1,
  player2,
  onClose,
  onSuccess,
}: ReportMatchModalProps) {
  const [score1, setScore1] = useState<number>(match.player1Score || 0);
  const [score2, setScore2] = useState<number>(match.player2Score || 0);
  const [notes, setNotes] = useState<string>(match.notes || '');

  // Deck Inks for each player
  const [p1Ink1, setP1Ink1] = useState<InkType>(
    match.player1Inks?.[0] || player1.primaryInk || 'Amber'
  );
  const [p1Ink2, setP1Ink2] = useState<InkType>(
    match.player1Inks?.[1] || player1.secondaryInk || 'Steel'
  );
  const [p2Ink1, setP2Ink1] = useState<InkType>(
    match.player2Inks?.[0] || player2?.primaryInk || 'Amethyst'
  );
  const [p2Ink2, setP2Ink2] = useState<InkType>(
    match.player2Inks?.[1] || player2?.secondaryInk || 'Ruby'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickPresets = [
    { label: `${player1.name} 2 - 0`, s1: 2, s2: 0 },
    { label: `${player1.name} 2 - 1`, s1: 2, s2: 1 },
    { label: `${player2?.name || 'P2'} 2 - 1`, s1: 1, s2: 2 },
    { label: `${player2?.name || 'P2'} 2 - 0`, s1: 0, s2: 2 },
    { label: 'Empate 1 - 1', s1: 1, s2: 1 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          player1Score: score1,
          player2Score: score2,
          notes,
          player1Inks: [p1Ink1, p1Ink2],
          player2Inks: player2 ? [p2Ink1, p2Ink2] : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el resultado');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Registrar Resultado Bo3</h3>
            <p className="text-xs text-slate-400">Jornada {match.roundNumber} - Al mejor de 3 partidas</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Players matchup view */}
          <div className="grid grid-cols-5 items-center gap-2 bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-800">
            {/* Player 1 */}
            <div className="col-span-2 text-center flex flex-col items-center min-w-0">
              <AvatarBadge avatarId={player1.avatar} name={player1.name} size="md" />
              <p className="font-semibold text-slate-200 mt-1.5 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[130px]">
                {player1.name}
              </p>
              <div className="mt-1">
                <DualInkBadge primary={p1Ink1} secondary={p1Ink2} size="sm" className="justify-center" />
              </div>
            </div>

            {/* VS */}
            <div className="col-span-1 text-center">
              <span className="text-xs font-black uppercase text-amber-500 tracking-widest px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                VS
              </span>
            </div>

            {/* Player 2 */}
            <div className="col-span-2 text-center flex flex-col items-center min-w-0">
              {player2 ? (
                <>
                  <AvatarBadge avatarId={player2.avatar} name={player2.name} size="md" />
                  <p className="font-semibold text-slate-200 mt-1.5 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[130px]">
                    {player2.name}
                  </p>
                  <div className="mt-1">
                    <DualInkBadge primary={p2Ink1} secondary={p2Ink2} size="sm" className="justify-center" />
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-xs sm:text-sm italic">BYE (Descanso)</div>
              )}
            </div>
          </div>

          {/* Quick presets for Bo3 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Resultados Rápidos Bo3
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setScore1(preset.s1);
                    setScore2(preset.s2);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    score1 === preset.s1 && score2 === preset.s2
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual score inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-center">
              <label className="block text-xs text-slate-400 mb-1">{player1.name}</label>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setScore1(Math.max(0, score1 - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="text-2xl font-black text-amber-400 font-mono w-8">{score1}</span>
                <button
                  type="button"
                  onClick={() => setScore1(Math.min(2, score1 + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-center">
              <label className="block text-xs text-slate-400 mb-1">{player2?.name || 'BYE'}</label>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setScore2(Math.max(0, score2 - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="text-2xl font-black text-amber-400 font-mono w-8">{score2}</span>
                <button
                  type="button"
                  onClick={() => setScore2(Math.min(2, score2 + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Deck Inks Selection for Meta Statistics */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Colores de Mazo Jugados
              </label>
              <span className="text-[10px] text-slate-400 ml-auto font-normal">
                (Alimenta el Meta Report)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Player 1 Deck Colors */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-300 block truncate">
                  Mazo de {player1.name}:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={p1Ink1}
                    onChange={(e) => setP1Ink1(e.target.value as InkType)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-amber-500/50"
                  >
                    {ALL_INKS.map((ink) => (
                      <option key={ink} value={ink}>
                        {LORCANA_INKS[ink].label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={p1Ink2}
                    onChange={(e) => setP1Ink2(e.target.value as InkType)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-amber-500/50"
                  >
                    {ALL_INKS.map((ink) => (
                      <option key={ink} value={ink}>
                        {LORCANA_INKS[ink].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Player 2 Deck Colors */}
              {player2 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300 block truncate">
                    Mazo de {player2.name}:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={p2Ink1}
                      onChange={(e) => setP2Ink1(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-amber-500/50"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>
                          {LORCANA_INKS[ink].label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={p2Ink2}
                      onChange={(e) => setP2Ink2(e.target.value as InkType)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-amber-500/50"
                    >
                      {ALL_INKS.map((ink) => (
                        <option key={ink} value={ink}>
                          {LORCANA_INKS[ink].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Comentarios / Lore de la partida
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Victoria épica en el turno 6 con A Whole New World"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Resultado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
