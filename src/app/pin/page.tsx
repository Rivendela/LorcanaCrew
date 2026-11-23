'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Delete, ShieldAlert } from 'lucide-react';

export default function PinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const verifyPin = async (inputPin: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto');
      }

      // Success, go to main page
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'PIN incorrecto');
      setPin('');
      setLoading(false);
    }
  };

  // Allow physical keyboard typing as well
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
        {/* Top Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mb-4 shadow-lg shadow-amber-500/20">
          <Lock className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">CCREW</h1>
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest -mt-1">Caldereta Crew</p>
        <p className="text-xs text-slate-400 mt-2 max-w-[240px] mx-auto">
          Introduce el PIN de 4 dígitos para acceder a la liga
        </p>

        {/* PIN Indicators (4 circles) */}
        <div className="flex items-center justify-center gap-4 my-8">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-500/50 scale-125'
                    : 'bg-slate-950 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-bounce">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-950/70 hover:bg-amber-500/20 active:scale-95 border border-slate-800 hover:border-amber-500/40 text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center disabled:opacity-40"
            >
              {num}
            </button>
          ))}

          {/* Clear button */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-950/40 hover:bg-slate-800 text-xs font-semibold text-slate-400 border border-slate-800/80 transition-all flex items-center justify-center disabled:opacity-30"
          >
            Borrar
          </button>

          {/* 0 */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-950/70 hover:bg-amber-500/20 active:scale-95 border border-slate-800 hover:border-amber-500/40 text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center disabled:opacity-40"
          >
            0
          </button>

          {/* Backspace button */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-950/40 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition-all flex items-center justify-center disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6">
          CCREW • Caldereta Crew • Liga de Lorcana
        </p>
      </div>
    </div>
  );
}
