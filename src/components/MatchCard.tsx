'use client';

import React, { useState } from 'react';
import { Match, User } from '@/types';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import { ReportMatchModal } from './ReportMatchModal';
import { CheckCircle2, Clock, Edit3 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  player1: User;
  player2: User | null;
  currentUser: { id: string; role: 'admin' | 'player' } | null;
  onMatchUpdated?: () => void;
}

export function MatchCard({
  match,
  player1,
  player2,
  currentUser,
  onMatchUpdated,
}: MatchCardProps) {
  const [showModal, setShowModal] = useState(false);

  const isCompleted = match.status === 'completed';
  const isBye = !player2;

  const canEdit =
    currentUser &&
    (currentUser.role === 'admin' ||
      currentUser.id === player1.id ||
      (player2 && currentUser.id === player2.id));

  const p1Won = isCompleted && match.player1Score > match.player2Score;
  const p2Won = isCompleted && match.player2Score > match.player1Score;
  const isDraw = isCompleted && !isBye && match.player1Score === match.player2Score;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all ${
          isCompleted
            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            : 'bg-slate-900/40 border-amber-500/20 hover:border-amber-500/40 shadow-sm'
        }`}
      >
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/70 border-b border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold font-mono text-[11px]">
            Jornada {match.roundNumber}
          </span>
          <div className="flex items-center gap-1.5">
            {isBye ? (
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                <Clock className="w-3 h-3" /> Descanso (BYE)
              </span>
            ) : isCompleted ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Finalizado
              </span>
            ) : (
              <span className="text-amber-400/90 flex items-center gap-1 text-[11px] font-medium">
                <Clock className="w-3 h-3" /> Pendiente Bo3
              </span>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MOBILE VIEW (< sm): Stacked Battle Rows (Eliminates ALL overlaps!) */}
        {/* ------------------------------------------------------------------ */}
        <div className="sm:hidden p-3.5 space-y-2">
          {/* Player 1 Row */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              p1Won
                ? 'bg-amber-500/10 border-amber-500/40'
                : isCompleted
                ? 'bg-slate-950/50 border-slate-850'
                : 'bg-slate-950/40 border-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <AvatarBadge avatarId={player1.avatar} name={player1.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-sm truncate leading-tight ${
                      p1Won ? 'text-amber-300 font-black' : 'text-slate-200 font-semibold'
                    }`}
                  >
                    {player1.name}
                  </p>
                  {p1Won && <span className="text-xs shrink-0" title="Ganador">👑</span>}
                </div>
                <div className="mt-1">
                  <DualInkBadge
                    primary={player1.primaryInk}
                    secondary={player1.secondaryInk}
                    visibility={player1.inksVisibility}
                    isOwnerOrAdmin={currentUser?.id === player1.id || currentUser?.role === 'admin'}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="ml-3 shrink-0">
              {isCompleted ? (
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-base border shadow-sm ${
                    p1Won
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isDraw
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {match.player1Score}
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-600 px-2">-</span>
              )}
            </div>
          </div>

          {/* Player 2 Row */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              p2Won
                ? 'bg-amber-500/10 border-amber-500/40'
                : isCompleted
                ? 'bg-slate-950/50 border-slate-850'
                : 'bg-slate-950/40 border-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {player2 ? (
                <>
                  <AvatarBadge avatarId={player2.avatar} name={player2.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-sm truncate leading-tight ${
                          p2Won ? 'text-amber-300 font-black' : 'text-slate-200 font-semibold'
                        }`}
                      >
                        {player2.name}
                      </p>
                      {p2Won && <span className="text-xs shrink-0" title="Ganador">👑</span>}
                    </div>
                    <div className="mt-1">
                      <DualInkBadge
                        primary={player2.primaryInk}
                        secondary={player2.secondaryInk}
                        visibility={player2.inksVisibility}
                        isOwnerOrAdmin={currentUser?.id === player2.id || currentUser?.role === 'admin'}
                        size="sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-1 text-xs text-slate-500 italic">Sin rival (BYE)</div>
              )}
            </div>

            <div className="ml-3 shrink-0">
              {isCompleted && player2 ? (
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-base border shadow-sm ${
                    p2Won
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isDraw
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {match.player2Score}
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-600 px-2">-</span>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DESKTOP VIEW (>= sm): Head-to-Head 12 Columns Layout               */}
        {/* ------------------------------------------------------------------ */}
        <div className="hidden sm:grid p-4 grid-cols-12 items-center gap-3">
          {/* Player 1 */}
          <div className="col-span-5 flex items-center gap-2.5 min-w-0 overflow-hidden">
            <AvatarBadge avatarId={player1.avatar} name={player1.name} size="md" />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm truncate font-semibold leading-tight ${
                  p1Won ? 'text-amber-300 font-bold' : 'text-slate-200'
                }`}
                title={player1.name}
              >
                {player1.name}
              </p>
              <div className="mt-1">
                <DualInkBadge
                  primary={player1.primaryInk}
                  secondary={player1.secondaryInk}
                  visibility={player1.inksVisibility}
                  isOwnerOrAdmin={currentUser?.id === player1.id || currentUser?.role === 'admin'}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Score Box */}
          <div className="col-span-2 flex flex-col items-center justify-center shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1 font-mono font-black text-lg bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shadow-inner">
                <span className={p1Won ? 'text-amber-400' : 'text-slate-400'}>{match.player1Score}</span>
                <span className="text-slate-600">-</span>
                <span className={p2Won ? 'text-amber-400' : 'text-slate-400'}>{match.player2Score}</span>
              </div>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
                VS
              </span>
            )}
          </div>

          {/* Player 2 */}
          <div className="col-span-5 flex items-center justify-end gap-2.5 min-w-0 text-right overflow-hidden">
            {player2 ? (
              <>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate font-semibold leading-tight ${
                      p2Won ? 'text-amber-300 font-bold' : 'text-slate-200'
                    }`}
                    title={player2.name}
                  >
                    {player2.name}
                  </p>
                  <div className="mt-1">
                    <DualInkBadge
                      primary={player2.primaryInk}
                      secondary={player2.secondaryInk}
                      visibility={player2.inksVisibility}
                      isOwnerOrAdmin={currentUser?.id === player2.id || currentUser?.role === 'admin'}
                      size="sm"
                      className="justify-end"
                    />
                  </div>
                </div>
                <AvatarBadge avatarId={player2.avatar} name={player2.name} size="md" />
              </>
            ) : (
              <span className="text-xs text-slate-500 italic">Sin rival (BYE)</span>
            )}
          </div>
        </div>

        {/* Notes or Lore */}
        {match.notes && (
          <div className="px-4 pb-2.5 -mt-1 text-xs text-slate-400 italic flex items-center gap-1.5 break-words">
            <span className="text-amber-500/70 shrink-0">📜</span>
            <span className="line-clamp-2">{match.notes}</span>
          </div>
        )}

        {/* Action Button Footer */}
        {canEdit && !isBye && (
          <div className="px-3.5 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] truncate mr-2">
              {currentUser?.role === 'admin' ? 'Comisionado' : 'Tu partido semanal'}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors font-semibold text-xs shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Editar Resultado' : 'Anotar Bo3'}</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ReportMatchModal
          match={match}
          player1={player1}
          player2={player2}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (onMatchUpdated) onMatchUpdated();
          }}
        />
      )}
    </>
  );
}
