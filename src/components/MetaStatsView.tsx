'use client';

import React, { useState } from 'react';
import { DeckMetaStats, InkType, Match, TournamentMatch, User } from '@/types';
import { calculateDeckMetaStats, calculateMetaStats } from '@/lib/league-engine';
import { LORCANA_INKS } from '@/lib/constants';
import { DualInkBadge } from './InkBadge';
import { AvatarBadge } from './AvatarBadge';
import {
  BarChart2,
  ShieldCheck,
  Flame,
  Sparkles,
  Layers,
  Trophy,
  Swords,
  Crown,
  Users,
} from 'lucide-react';

interface MetaStatsViewProps {
  matches: Match[];
  players: User[];
  tournamentMatches?: TournamentMatch[];
}

export function MetaStatsView({ matches, players, tournamentMatches = [] }: MetaStatsViewProps) {
  const [metaTab, setMetaTab] = useState<'decks' | 'inks'>('decks');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'league' | 'tournaments'>('all');

  const inkStats = calculateMetaStats(matches, players, tournamentMatches);
  const sortedInkStats = [...inkStats].sort((a, b) => b.winRate - a.winRate);

  const rawDeckStats = calculateDeckMetaStats(matches, players, tournamentMatches);

  // Filter and sort deck stats according to the selected scope
  const filteredDecks = rawDeckStats
    .filter((d) => {
      if (scopeFilter === 'league') return d.leagueMatches > 0;
      if (scopeFilter === 'tournaments') return d.tournamentMatches > 0;
      return d.totalMatches > 0;
    })
    .map((d) => {
      let matchesPlayed = d.totalMatches;
      let matchesWon = d.totalWins;
      let matchesLost = d.totalLosses;

      if (scopeFilter === 'league') {
        matchesPlayed = d.leagueMatches;
        matchesWon = d.leagueWins;
        matchesLost = d.leagueLosses;
      } else if (scopeFilter === 'tournaments') {
        matchesPlayed = d.tournamentMatches;
        matchesWon = d.tournamentWins;
        matchesLost = d.tournamentLosses;
      }

      const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

      return {
        ...d,
        displayMatches: matchesPlayed,
        displayWon: matchesWon,
        displayLost: matchesLost,
        displayWinRate: winRate,
      };
    })
    .sort((a, b) => {
      if (b.displayMatches !== a.displayMatches) return b.displayMatches - a.displayMatches;
      return b.displayWinRate - a.displayWinRate;
    });

  const completedLeagueMatches = matches.filter((m) => m.status === 'completed' && m.player2Id).length;
  const completedTournamentMatches = tournamentMatches.filter(
    (m) => m.status === 'completed' && m.player1Id && m.player2Id
  ).length;

  const mostPlayedDeck = filteredDecks[0];
  const highestWinRateDeck = [...filteredDecks]
    .filter((d) => d.displayMatches >= 2)
    .sort((a, b) => b.displayWinRate - a.displayWinRate)[0] || filteredDecks[0];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Most dominant deck or ink */}
        <div className="bg-slate-900/60 border border-amber-500/30 p-5 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Mazo Más Popular</p>
              <h4 className="text-sm sm:text-base font-bold text-white truncate">
                {mostPlayedDeck ? mostPlayedDeck.name : 'Sin datos'}
              </h4>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{mostPlayedDeck?.displayMatches || 0} partidas jugadas</span>
            <span className="text-amber-400 font-bold">{mostPlayedDeck?.displayWinRate || 0}% WR</span>
          </div>
        </div>

        {/* Total League Matches */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Partidas de Liga Bo3</p>
              <h4 className="text-lg font-bold text-white">{completedLeagueMatches}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">
            {matches.filter((m) => m.status === 'pending').length} encuentros pendientes
          </p>
        </div>

        {/* Total Tournament Matches */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl border border-purple-500/30">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Partidas en Torneos</p>
              <h4 className="text-lg font-bold text-white">{completedTournamentMatches}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">Suizo & Cuadro Eliminatorio</p>
        </div>

        {/* Registered players */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Iluminadores</p>
              <h4 className="text-lg font-bold text-white">{players.length} Jugadores</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">Comunidad CCREW</p>
        </div>
      </div>

      {/* Main Content Tabs: Decks vs Individual Inks */}
      <div className="space-y-4">
        {/* Navigation Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setMetaTab('decks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                metaTab === 'decks'
                  ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Decks y Arquetipos ({rawDeckStats.length})</span>
            </button>

            <button
              onClick={() => setMetaTab('inks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                metaTab === 'inks'
                  ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Tintas Individuales (6)</span>
            </button>
          </div>

          {/* Scope Filter for Decks */}
          {metaTab === 'decks' && (
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">
                Origen:
              </span>
              <button
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Liga + Torneos
              </button>
              <button
                onClick={() => setScopeFilter('league')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  scopeFilter === 'league'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Liga
              </button>
              <button
                onClick={() => setScopeFilter('tournaments')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  scopeFilter === 'tournaments'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Torneos
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: DECKS & ARCHETYPES (COMBINATIONS OF INKS)              */}
        {/* ------------------------------------------------------------- */}
        {metaTab === 'decks' && (
          <div className="space-y-4">
            {filteredDecks.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-400">No hay partidas registradas en el filtro seleccionado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDecks.map((deck) => {
                  const p1Info = LORCANA_INKS[deck.primaryInk];
                  const p2Info = deck.secondaryInk ? LORCANA_INKS[deck.secondaryInk] : null;

                  return (
                    <div
                      key={deck.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-xl transition-all space-y-3"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <DualInkBadge
                            primary={deck.primaryInk}
                            secondary={deck.secondaryInk}
                            visibility="public"
                            size="md"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{deck.name}</h4>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {deck.metaShare}% presencia en el metajuego
                            </p>
                          </div>
                        </div>

                        {/* Win Rate Pill */}
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-xs font-mono font-black border shadow-sm ${
                              deck.displayWinRate >= 60
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : deck.displayWinRate >= 45
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {deck.displayWinRate}% WR
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(6, deck.displayWinRate)}%`,
                            backgroundColor: p1Info?.color || '#F59E0B',
                            boxShadow: `0 0 8px ${p1Info?.color || '#F59E0B'}80`,
                          }}
                        />
                      </div>

                      {/* Stats & Source Breakdown (Liga vs Torneos) */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" /> Liga:
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {deck.leagueWins}V - {deck.leagueLosses}D
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Swords className="w-3 h-3 text-purple-400" /> Torneos:
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {deck.tournamentWins}V - {deck.tournamentLosses}D
                          </span>
                        </div>
                      </div>

                      {/* Pilots (Iluminadores que juegan este deck) */}
                      {deck.pilots.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">Iluminadores:</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {deck.pilots.slice(0, 4).map((p) => (
                              <span
                                key={p.id}
                                title={`${p.name}: ${p.wins}V - ${p.matches - p.wins}D`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300"
                              >
                                <AvatarBadge avatarId={p.avatar} name={p.name} size="sm" />
                                <span className="truncate max-w-[80px]">{p.name}</span>
                              </span>
                            ))}
                            {deck.pilots.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{deck.pilots.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: INDIVIDUAL INK STATS (6 LORCANA INKS)                  */}
        {/* ------------------------------------------------------------- */}
        {metaTab === 'inks' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Rendimiento por Tintas de Lorcana</h3>
              </div>
              <span className="text-xs text-slate-400">Ordenado por % de victoria</span>
            </div>

            <div className="space-y-5">
              {sortedInkStats.map((item) => {
                const info = LORCANA_INKS[item.ink];
                return (
                  <div key={item.ink} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${info.accentColor}`} />
                        <span className="font-semibold text-slate-200">
                          {info.label} <span className="text-xs text-slate-500">({item.ink})</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">
                          {item.won}W / {item.played - item.won}L ({item.played} jugadas)
                        </span>
                        <span className="font-bold text-amber-400 w-12 text-right">
                          {item.winRate}%
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${info.bgGradient} ${info.accentColor} transition-all duration-500`}
                        style={{ width: `${Math.max(5, item.winRate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
