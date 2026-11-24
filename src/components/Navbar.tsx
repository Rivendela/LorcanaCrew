'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Users,
  BarChart3,
  Shield,
  LogIn,
  LogOut,
  Sparkles,
  Swords,
  BookOpen,
} from 'lucide-react';
import { AvatarBadge } from './AvatarBadge';
import { DualInkBadge } from './InkBadge';
import { InkType } from '@/types';

interface UserState {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'player';
  avatar?: string;
  primaryInk?: InkType;
  secondaryInk?: InkType;
  inksVisibility?: 'public' | 'private';
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.refresh();
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Clasificación', shortLabel: 'Liga', icon: Trophy },
    { href: '/jornadas', label: 'Jornadas', shortLabel: 'Jornadas', icon: Calendar },
    { href: '/jugadores', label: 'Jugadores', shortLabel: 'Jugadores', icon: Users },
    { href: '/meta', label: 'Meta Report', shortLabel: 'Meta', icon: BarChart3 },
    { href: '/torneos', label: 'Torneos', shortLabel: 'Torneos', icon: Swords },
    { href: '/como-se-usa', label: '¿Cómo se usa?', shortLabel: 'Guía', icon: BookOpen },
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Comisionado', shortLabel: 'Admin', icon: Shield, isAdmin: true }]
      : []),
  ];

  if (pathname === '/pin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-slate-950/90 backdrop-blur-xl shadow-xl shadow-black/40">
      {/* Top subtle golden illumination line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-rose-500 p-0.5 shadow-md shadow-amber-500/10 group-hover:shadow-amber-500/30 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                CCREW
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-400/70 block -mt-1 font-mono">
                Caldereta Crew
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop >= md): Uniform Segmented Pill Bar */}
          <nav className="hidden md:flex items-center p-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-inner backdrop-blur-md gap-0.5 lg:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 h-9 rounded-xl text-xs lg:text-[13px] transition-all whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/15 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/15 font-bold'
                      : item.isAdmin
                      ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                        : item.isAdmin
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-amber-300'
                    }`}
                  />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.shortLabel}</span>
                  {item.isAdmin && (
                    <span className="hidden xl:inline-block text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1 py-0.2 rounded font-mono font-bold uppercase ml-0.5">
                      ADM
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Chip / Auth Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-slate-800/80 animate-pulse border border-slate-700" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/perfil"
                  title="Mi Perfil: Ver y editar tus datos, avatar y mazos"
                  className={`group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl border transition-all shadow-sm ${
                    pathname === '/perfil'
                      ? 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/10'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <AvatarBadge avatarId={user.avatar} name={user.name} size="sm" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                  </div>
                  <div className="text-left hidden sm:block min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 leading-tight truncate max-w-[120px] transition-colors">
                        {user.name}
                      </p>
                      {user.role === 'admin' && (
                        <span className="text-[9px] bg-amber-500/25 text-amber-400 border border-amber-500/40 px-1 rounded font-mono font-bold shrink-0">
                          ADM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {user.primaryInk ? (
                        <DualInkBadge
                          primary={user.primaryInk}
                          secondary={user.secondaryInk}
                          visibility={user.inksVisibility}
                          isOwnerOrAdmin={true}
                          size="sm"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">@{user.username}</span>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="w-9 h-9 rounded-xl bg-slate-900/70 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20"
                >
                  <span>Unirme</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Scroll Navigation Bar (< md) */}
        <div className="md:hidden flex items-center justify-start py-2 border-t border-slate-800/80 overflow-x-auto gap-1.5 scrollbar-none px-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all text-xs font-semibold whitespace-nowrap border ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : item.isAdmin
                    ? 'text-amber-400/90 bg-amber-500/10 border-amber-500/25'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/70 border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
