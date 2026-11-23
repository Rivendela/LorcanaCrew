'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ALL_INKS, LORCANA_AVATARS, LORCANA_INKS } from '@/lib/constants';
import { InkType } from '@/types';
import { Sparkles, AlertCircle, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { DualInkBadge, InkBadge } from '@/components/InkBadge';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('mickey');
  const [primaryInk, setPrimaryInk] = useState<InkType>('Ruby');
  const [secondaryInk, setSecondaryInk] = useState<InkType>('Amethyst');

  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ name: string; username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest clean username from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!usernameEdited) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(clean);
    }
  };

  // Toggle ink selection easily
  const handleInkClick = (ink: InkType) => {
    if (primaryInk === ink) return;
    if (secondaryInk === ink) {
      setSecondaryInk(primaryInk);
      setPrimaryInk(ink);
      return;
    }
    // Set secondary as old primary, and this as new primary
    setSecondaryInk(primaryInk);
    setPrimaryInk(ink);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          avatar,
          primaryInk,
          secondaryInk,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      setRegisteredUser({ name: name.trim(), username: username.trim().toLowerCase() });

      // Immediate clean redirect to homepage with full session reload
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error de registro');
      setLoading(false);
    }
  };

  // Success view
  if (registeredUser) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-fade-in backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white">¡Bienvenido a CCREW!</h2>
          <p className="text-sm font-semibold text-emerald-300">
            {registeredUser.name} (@{registeredUser.username})
          </p>
          <p className="text-xs text-slate-400">
            Tu cuenta de Iluminador ha sido creada y tu sesión ya está iniciada. Redirigiendo a tu panel...
          </p>

          <div className="pt-2">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md"
            >
              <span>Entrar Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-16 px-4">
      <div className="bg-slate-900/85 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Únete a CCREW
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crea tu ficha de Iluminador para disputar las partidas de la liga
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Card Preview */}
        <div className="mb-8 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarBadge avatarId={avatar} name={name || 'Iluminador'} size="lg" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
                Tu Ficha en la Liga
              </span>
              <h3 className="font-extrabold text-white text-base truncate">
                {name || 'Tu Nombre'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                @{username || 'tuusuario'}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <DualInkBadge primary={primaryInk} secondary={secondaryInk} size="sm" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: User info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Tus Datos de Acceso
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre o Apodo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Juanma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuario (para entrar) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameEdited(true);
                  }}
                  placeholder="Ej. juanma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Elige una contraseña personal"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Interactive Lorcana Inks Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Elige tus 2 Colores de Tinta
              </h4>
              <span className="text-xs text-amber-400 font-semibold">
                {primaryInk} + {secondaryInk}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Toca para seleccionar tus 2 tintas principales (la primera será tu primaria, la segunda secundaria).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_INKS.map((ink) => {
                const isPrimary = primaryInk === ink;
                const isSecondary = secondaryInk === ink;
                const isSelected = isPrimary || isSecondary;
                const info = LORCANA_INKS[ink];

                return (
                  <button
                    key={ink}
                    type="button"
                    onClick={() => handleInkClick(ink)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${info.bgGradient} ${info.borderColor} scale-[1.02] shadow-md`
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${info.accentColor}`} />
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{info.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ink}</span>
                      </div>
                    </div>

                    {isPrimary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                        1ª
                      </span>
                    )}
                    {isSecondary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                        2ª
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Avatar Selector */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Elige tu Avatar
            </h4>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-slate-950/50 p-2.5 rounded-2xl border border-slate-800">
              {LORCANA_AVATARS.map((av) => {
                const isSelected = avatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.id)}
                    title={av.name}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border text-2xl transition-all ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 scale-110 shadow-md shadow-amber-500/20'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:bg-slate-900'
                    }`}
                  >
                    <span>{av.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !name.trim() || !username.trim() || !password}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creando tu ficha...' : 'Completar Registro y Entrar'}</span>
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Ya tienes cuenta creada?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
