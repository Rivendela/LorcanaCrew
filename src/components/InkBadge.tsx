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

export function InkBadge({ ink, size = 'sm', className = '' }: InkBadgeProps) {
  const info = LORCANA_INKS[ink] || LORCANA_INKS.Amber;
  const dotSize = size === 'lg' ? 'w-3 h-3' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center rounded-full border select-none whitespace-nowrap bg-slate-950/80 shadow-sm px-1.5 py-0.5 ${className}`}
      style={{
        borderColor: `${info.color}45`,
        backgroundColor: `${info.color}10`,
      }}
      title={`${info.label} (${ink}): ${info.description}`}
    >
      <span
        className={`${dotSize} rounded-full shrink-0`}
        style={{
          backgroundColor: info.color,
          boxShadow: `0 0 6px ${info.color}90`,
        }}
      />
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
  showLabel?: boolean;
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

  // Single ink: only the glowing crystal
  if (!info2 && info1) {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors"
          style={{ borderColor: `${info1.color}40`, backgroundColor: `${info1.color}10` }}
          title={`${info1.label}: ${info1.description}`}
        >
          <span
            className={`${dotSize} rounded-full shrink-0`}
            style={{ backgroundColor: info1.color, boxShadow: `0 0 6px ${info1.color}90` }}
          />
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
          className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors"
          style={{ borderColor: `${info2.color}40`, backgroundColor: `${info2.color}10` }}
          title={`${info2.label}: ${info2.description}`}
        >
          <span
            className={`${dotSize} rounded-full shrink-0`}
            style={{ backgroundColor: info2.color, boxShadow: `0 0 6px ${info2.color}90` }}
          />
        </span>
      </div>
    );
  }

  if (!info1 || !info2) return null;

  // Dual inks: sleek unified pill with overlapping glowing gems ONLY
  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <span
        className="inline-flex items-center rounded-full bg-slate-950/90 border border-slate-800/90 shadow-sm hover:border-slate-700 transition-colors px-1.5 py-0.5"
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

        {visibility === 'private' && isOwnerOrAdmin && (
          <span title="Solo tú y el admin podéis ver esto">
            <Lock className="w-2.5 h-2.5 text-amber-400/80 ml-0.5 shrink-0" />
          </span>
        )}
      </span>
    </div>
  );
}
