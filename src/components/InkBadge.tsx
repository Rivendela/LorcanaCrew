import React from 'react';
import { InkType } from '@/types';
import { LORCANA_INKS } from '@/lib/constants';
import { Lock } from 'lucide-react';

interface InkBadgeProps {
  ink: InkType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InkBadge({ ink, showLabel = true, size = 'sm' }: InkBadgeProps) {
  const info = LORCANA_INKS[ink] || LORCANA_INKS.Amber;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border bg-gradient-to-r ${info.bgGradient} ${info.borderColor} ${info.textColor} ${sizeClasses}`}
      title={`${info.label} (${ink}): ${info.description}`}
    >
      <span className={`w-2 h-2 rounded-full ${info.accentColor} shadow-sm animate-pulse`} />
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}

export function DualInkBadge({
  primary,
  secondary,
  visibility = 'public',
  isOwnerOrAdmin = false,
  size = 'sm',
}: {
  primary?: InkType;
  secondary?: InkType;
  visibility?: 'public' | 'private';
  isOwnerOrAdmin?: boolean;
  size?: 'sm' | 'md';
}) {
  if (!primary && !secondary) return null;

  // If set to private and viewed by others, keep it secret!
  if (visibility === 'private' && !isOwnerOrAdmin) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-400 select-none"
        title="Este jugador mantiene sus colores en secreto"
      >
        <Lock className="w-3 h-3 text-amber-400/90" />
        <span className="text-[11px] font-medium text-slate-300">Oculto</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {primary && <InkBadge ink={primary} size={size} />}
      {secondary && secondary !== primary && <InkBadge ink={secondary} size={size} />}
      {visibility === 'private' && isOwnerOrAdmin && (
        <span className="text-[10px] text-amber-400/80 font-mono" title="Solo tú y el admin podéis ver esto">
          (Privado)
        </span>
      )}
    </div>
  );
}
