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
  showLabel = false,
  size = 'sm',
  className = '',
}: {
  primary?: InkType;
  secondary?: InkType;
  visibility?: 'public' | 'private';
  isOwnerOrAdmin?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!primary && !secondary) return null;

  // If set to private and viewed by others, keep it secret!
  if (visibility === 'private' && !isOwnerOrAdmin) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/70 border border-slate-800 text-slate-400 select-none shrink-0 ${className}`}
        title="Colores ocultos por el jugador"
      >
        <Lock className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
      </span>
    );
  }

  const info1 = primary ? LORCANA_INKS[primary] : null;
  const info2 = secondary && secondary !== primary ? LORCANA_INKS[secondary] : null;
  const dotSize = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  // Single ink
  if (!info2 && info1) {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors"
          style={{ borderColor: `${info1.color}40`, backgroundColor: `${info1.color}10` }}
          title={`${info1.label}: ${info1.description}`}
        >
          <span
            className={`${dotSize} rounded-full shrink-0`}
            style={{ backgroundColor: info1.color, boxShadow: `0 0 6px ${info1.color}90` }}
          />
          {showLabel && <span className="text-[10px] font-semibold" style={{ color: info1.color }}>{info1.label}</span>}
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
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors"
          style={{ borderColor: `${info2.color}40`, backgroundColor: `${info2.color}10` }}
          title={`${info2.label}: ${info2.description}`}
        >
          <span
            className={`${dotSize} rounded-full shrink-0`}
            style={{ backgroundColor: info2.color, boxShadow: `0 0 6px ${info2.color}90` }}
          />
          {showLabel && <span className="text-[10px] font-semibold" style={{ color: info2.color }}>{info2.label}</span>}
        </span>
      </div>
    );
  }

  if (!info1 || !info2) return null;

  // Dual inks: sleek unified pill with overlapping glowing gems
  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <span
        className={`inline-flex items-center rounded-full bg-slate-950/90 border border-slate-800/90 shadow-sm hover:border-slate-700 transition-colors ${
          showLabel ? 'gap-1.5 px-2.5 py-0.5' : 'gap-1 px-1.5 py-0.5'
        }`}
        title={`${info1.label} & ${info2.label}`}
      >
        {/* Two glowing ink crystals overlapping */}
        <span className="flex items-center -space-x-1 shrink-0">
          <span
            className={`${dotSize} rounded-full ring-1 ring-slate-950 shrink-0`}
            style={{
              backgroundColor: info1.color,
              boxShadow: `0 0 6px ${info1.color}90`,
            }}
          />
          <span
            className={`${dotSize} rounded-full ring-1 ring-slate-950 shrink-0`}
            style={{
              backgroundColor: info2.color,
              boxShadow: `0 0 6px ${info2.color}90`,
            }}
          />
        </span>

        {showLabel && (
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight flex items-center gap-1 truncate">
            <span style={{ color: info1.color }}>{info1.label}</span>
            <span className="text-slate-600 font-bold text-[9px]">/</span>
            <span style={{ color: info2.color }}>{info2.label}</span>
          </span>
        )}

        {visibility === 'private' && isOwnerOrAdmin && (
          <span title="Solo tú y el admin podéis ver esto">
            <Lock className="w-2.5 h-2.5 text-amber-400/80 ml-0.5 shrink-0" />
          </span>
        )}
      </span>
    </div>
  );
}
