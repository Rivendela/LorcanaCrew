import React from 'react';
import { LORCANA_AVATARS } from '@/lib/constants';

interface AvatarBadgeProps {
  avatarId?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarBadge({ avatarId, name, size = 'md' }: AvatarBadgeProps) {
  const avatar = LORCANA_AVATARS.find((a) => a.id === avatarId) || {
    icon: '✨',
    name: name || 'Iluminador',
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-2xl',
    xl: 'w-16 h-16 text-3xl',
  }[size];

  return (
    <div
      className={`rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner select-none ${sizeClasses}`}
      title={`${name} (${avatar.name})`}
    >
      <span>{avatar.icon}</span>
    </div>
  );
}
