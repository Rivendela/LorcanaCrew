'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Calendar, Users, BarChart3, Shield, LogIn, LogOut, Sparkles, User, Swords, BookOpen } from 'lucide-react';
import { AvatarBadge } from './AvatarBadge';

interface UserState {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'player';
  avatar?: string;
  primaryInk?: string;
  secondaryInk?: string;
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
    { href: '/', label: 'Clasificación', shortLabel: 'Clasificación', icon: Trophy },
    { href: '/jornadas', label: 'Jornadas & Bo3', shortLabel: 'Jornadas', icon: Calendar },
    { href: '/jugadores', label: 'Jugadores', shortLabel: 'Jugadores', icon: Users },
    { href: '/meta', label: 'Meta de Tintas', shortLabel: 'Meta Tintas', icon: BarChart3 },
    { href: '/torneos', label: 'Torneos', shortLabel: 'Torneos', icon: Swords },
    { href: '/como-se-usa', label: 'Cómo se usa', shortLabel: 'Guía', icon: BookOpen },
    ...(user ? [{ href: '/perfil', label: 'Mi Perfil', shortLabel: 'Mi Perfil', icon: User }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Comisionado', shortLabel: 'Admin', icon: Shield }] : []),
  ];

  if (pathname === '/pin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 block -mt-1">
                Caldereta Crew
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop >= md) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile / Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/perfil"
                  title="Ver y editar mi perfil"
                  className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group shadow-sm"
                >
                  <AvatarBadge avatarId={user.avatar} name={user.name} size="sm" />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 leading-tight flex items-center gap-1.5 transition-colors">
                      {user.name}
                      {user.role === 'admin' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">@{user.username}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-sm shadow-amber-500/20"
                >
                  <span>Unirme</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Scroll Navigation Bar (< md) */}
        <div className="md:hidden flex items-center justify-start py-2.5 border-t border-slate-800/80 text-xs overflow-x-auto gap-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all text-xs font-semibold whitespace-nowrap border ${isActive
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border-slate-800/80'
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
