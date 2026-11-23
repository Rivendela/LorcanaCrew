import React from 'react';
import { InkType } from '@/types';
import { LORCANA_INKS } from '@/lib/constants';
import { Lock } from 'lucide-react';

interface InkBadgeProps {
  ink: InkType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InkBadge({ ink, showLabel = true, size = 'sm', className = '' }: InkBadgeProps) {
  const info = LORCANA_INKS[ink] || LORCANA_INKS.Amber;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border bg-gradient-to-r shrink-0 select-none whitespace-nowrap ${info.bgGradient} ${info.borderColor} ${info.textColor} ${sizeClasses} ${className}`}
      title={`${info.label} (${ink}): ${info.description}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.accentColor} shadow-sm animate-pulse`} />
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
  className = '',
}: {
  primary?: InkType;
  secondary?: InkType;
  visibility?: 'public' | 'private';
  isOwnerOrAdmin?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!primary && !secondary) return null;

  // If set to private and viewed by others, keep it secret!
  if (visibility === 'private' && !isOwnerOrAdmin) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-400 select-none shrink-0 ${className}`}
        title="Este jugador mantiene sus colores en secreto"
      >
        <Lock className="w-3 h-3 text-amber-400/90 shrink-0" />
        <span className="text-[11px] font-medium text-slate-300">Oculto</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap max-w-full ${className}`}>
      {primary && <InkBadge ink={primary} size={size} />}
      {secondary && secondary !== primary && <InkBadge ink={secondary} size={size} />}
      {visibility === 'private' && isOwnerOrAdmin && (
        <span className="text-[10px] text-amber-400/80 font-mono shrink-0" title="Solo tú y el admin podéis ver esto">
          (Privado)
        </span>
      )}
    </div>
  );
}
