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
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border select-none whitespace-nowrap bg-slate-950/80 shadow-sm ${sizeClasses} ${className}`}
      style={{
        borderColor: `${info.color}45`,
        backgroundColor: `${info.color}10`,
      }}
      title={`${info.label} (${ink}): ${info.description}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          backgroundColor: info.color,
          boxShadow: `0 0 5px ${info.color}`,
        }}
      />
      {showLabel && <span style={{ color: info.color }}>{info.label}</span>}
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
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/70 border border-slate-800 text-slate-400 select-none shrink-0 ${className}`}
        title="Este jugador mantiene sus colores en secreto"
      >
        <Lock className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
        <span className="text-[10px] text-slate-300">Oculto</span>
      </span>
    );
  }

  const info1 = primary ? LORCANA_INKS[primary] : null;
  const info2 = secondary && secondary !== primary ? LORCANA_INKS[secondary] : null;

  // Single ink
  if (!info2 && info1) {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border text-[10px] sm:text-[11px] font-semibold tracking-tight shadow-sm"
          style={{ borderColor: `${info1.color}45`, backgroundColor: `${info1.color}12` }}
          title={`${info1.label}: ${info1.description}`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: info1.color, boxShadow: `0 0 5px ${info1.color}` }}
          />
          <span style={{ color: info1.color }}>{info1.label}</span>
          {visibility === 'private' && isOwnerOrAdmin && (
            <span title="Solo tú y el admin podéis ver esto">
              <Lock className="w-2.5 h-2.5 text-amber-400/80 ml-0.5 shrink-0" />
            </span>
          )}
        </span>
      </div>
    );
  }

  if (!info1 && info2) {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border text-[10px] sm:text-[11px] font-semibold tracking-tight shadow-sm"
          style={{ borderColor: `${info2.color}45`, backgroundColor: `${info2.color}12` }}
          title={`${info2.label}: ${info2.description}`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: info2.color, boxShadow: `0 0 5px ${info2.color}` }}
          />
          <span style={{ color: info2.color }}>{info2.label}</span>
        </span>
      </div>
    );
  }

  if (!info1 || !info2) return null;

  // Dual inks: sleek unified pill with overlapping glowing gems and colored labels
  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors max-w-full"
        title={`${info1.label} & ${info2.label}`}
      >
        {/* Two glowing ink crystals overlapping */}
        <span className="flex items-center -space-x-1 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-950 shrink-0"
            style={{
              backgroundColor: info1.color,
              boxShadow: `0 0 6px ${info1.color}90`,
            }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-950 shrink-0"
            style={{
              backgroundColor: info2.color,
              boxShadow: `0 0 6px ${info2.color}90`,
            }}
          />
        </span>

        {/* Compact typography with respective ink colors */}
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight flex items-center gap-1 truncate">
          <span style={{ color: info1.color }}>{info1.label}</span>
          <span className="text-slate-600 font-bold text-[9px]">/</span>
          <span style={{ color: info2.color }}>{info2.label}</span>
        </span>

        {visibility === 'private' && isOwnerOrAdmin && (
          <span title="Solo tú y el admin podéis ver esto">
            <Lock className="w-2.5 h-2.5 text-amber-400/80 ml-0.5 shrink-0" />
          </span>
        )}
      </span>
    </div>
  );
}
