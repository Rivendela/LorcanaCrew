import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Trophy,
  Swords,
  Calendar,
  Palette,
  Lock,
  Sparkles,
  CheckCircle2,
  Award,
  Users,
  Flame,
  ArrowRight,
  HelpCircle,
  BarChart3,
  Percent,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ComoSeUsaPage() {
  const glossary = [
    {
      code: 'PTS',
      label: 'Puntos Totales',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Puntuación acumulada en la liga. Victoria en serie Bo3 = 3 pts, Empate = 1 pt, Derrota = 0 pts. Se suman al cerrarse la jornada.',
    },
    {
      code: 'PJ',
      label: 'Partidos Jugados',
      color: 'text-slate-300 bg-slate-800 border-slate-700',
      desc: 'Total de series al Mejor de 3 (Bo3) disputadas en jornadas completadas.',
    },
    {
      code: 'PG',
      label: 'Partidos Ganados',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Series Bo3 ganadas por el jugador (resultado 2-0 o 2-1).',
    },
    {
      code: 'PE',
      label: 'Partidos Empatados',
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      desc: 'Series Bo3 empatadas (resultado 1-1 por límite de tiempo o acuerdo mutuo).',
    },
    {
      code: 'PP',
      label: 'Partidos Perdidos',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      desc: 'Series Bo3 perdidas por el jugador (resultado 0-2 o 1-2).',
    },
    {
      code: 'GF',
      label: 'Games a Favor',
      color: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
      desc: 'Partidas individuales ganadas dentro de las series Bo3 (los 2 o 1 games anotados).',
    },
    {
      code: 'GC',
      label: 'Games en Contra',
      color: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
      desc: 'Partidas individuales perdidas dentro de las series Bo3.',
    },
    {
      code: '+/-',
      label: 'Diferencial de Games',
      color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Games a Favor menos Games en Contra (GF - GC). Es el criterio principal de desempate tras los puntos.',
    },
    {
      code: '% PARTIDAS',
      label: 'Porcentaje de Efectividad',
      color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
      desc: 'Porcentaje de victorias sobre el total de games disputados: GF / (GF + GC) * 100.',
    },
    {
      code: 'RACHA',
      label: 'Forma Reciente',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Historial de las últimas jornadas disputadas: V = Victoria, E = Empate, D = Derrota.',
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guía Oficial del Iluminador</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">CCREW Lorcana</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            ¿Cómo se usa la plataforma CCREW?
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Bienvenido al centro de mando de la <strong>Liga y Torneos de Disney Lorcana</strong> de Caldereta Crew. Aquí tienes una explicación detallada de cada sección, las siglas de la clasificación y las normas de competición.
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-200 transition-all"
            >
              <span>Ir a la Clasificación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/torneos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Torneos & Copas</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* --- 1. GLOSARIO DE LA CLASIFICACIÓN (EXPLICACIÓN DE CABECERAS) --- */}
        <section className="bg-slate-900/70 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                Glosario & Estadísticas
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Significado de la Tabla de Clasificación
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            En la pantalla principal verás una tabla con diferentes abreviaturas deportivas adaptadas al formato Best-of-3 de Lorcana. En ordenador puedes colocar el cursor sobre cualquier cabecera para ver su descripción:
          </p>

          {/* Glossary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {glossary.map((item) => (
              <div
                key={item.code}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 hover:border-amber-500/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${item.color}`}
                  >
                    {item.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 truncate">
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Criterios de Desempate Oficiales:</strong> En caso de igualdad a puntos al final de la temporada, la posición se desempata por:
              <br />
              <span className="text-amber-300 font-semibold">1º Mayor Diferencial de Games (+/-)</span> &gt;{' '}
              <span className="text-amber-300 font-semibold">2º Enfrentamiento Directo (Cara a Cara)</span> &gt;{' '}
              <span className="text-amber-300 font-semibold">3º Games a Favor (GF)</span>.
            </p>
          </div>
        </section>

        {/* --- 2. LIGA REGULAR SEMANAL --- */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 block">
                Competición Regular
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">La Liga Semanal Bo3</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <span>⚔️ Partidos al Mejor de 3 (Bo3)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed text-xs">
                Cada jornada semanal enfrenta a los jugadores en series Bo3. El ganador de la serie anota <strong>2-0</strong> o <strong>2-1</strong>. En caso de llegar al tiempo límite con 1-1 o pactar tablas, se admite el empate (<strong>1-1</strong>).
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <span>🛡️ Cierre de Jornada & Puntos Justos</span>
              </h3>
              <p className="text-slate-400 leading-relaxed text-xs">
                Para garantizar máxima transparencia, <strong>los puntos de la tabla general se computan cuando se cierra oficialmente la jornada</strong>. Así se evita sumar victorias de descansos (BYEs) futuros antes de que ocurran.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Reglas clave de las Jornadas</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              <li><strong>Solo jornadas pasadas y actual:</strong> Los jugadores pueden ver el histórico de jornadas completadas y la jornada en curso. Las jornadas futuras están reservadas para planificación.</li>
              <li><strong>Avanzar de jornada:</strong> No se puede avanzar a la siguiente ronda hasta que hayan terminado todos los partidos pendientes de la jornada en curso.</li>
              <li><strong>Descansos (BYE):</strong> Si el número de jugadores es impar, quien tenga descanso recibe una victoria 2-0 automáticamente al cerrar la jornada.</li>
              <li><strong>Nuevas incorporaciones:</strong> Se pueden añadir jugadores a mitad de temporada sin reiniciar nada; el sistema regenera solo los cruces a futuro manteniendo el pasado 100% guardado.</li>
            </ul>
          </div>
        </section>

        {/* --- 3. TORNEOS CCREW (BRACKET & SUIZO) --- */}
        <section className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-purple-400">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <Swords className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/80 block">
                Copas Independientes
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Torneos CCREW (2 Formatos)</h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300">
            Los torneos son competiciones independientes de la liga regular, con su propio <strong>Ranking de Copas</strong> y <strong>Palmarés histórico</strong>. Se disputan en 2 modalidades:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <span>⚔️ 1. Eliminación Directa (Playoffs / Bracket)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Cuadro clásico de eliminatorias (cuartos, semifinales y final). El ganador de cada Bo3 avanza a la siguiente ronda; el perdedor queda apeado. El ganador de la Gran Final es coronado Campeón 👑.
              </p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                <span>🛡️ 2. Sistema Suizo (Swiss Tournament)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                El formato rey de los TCGs: <strong>¡nadie queda eliminado!</strong> Se juegan varias rondas donde los ganadores juegan contra ganadores y los que tienen derrotas contra rivales con similar récord. El primer clasificado por puntos y desempate Buchholz gana el torneo.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Puntos del Ranking de Torneos:
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <span>🏆 Campeón: <strong className="text-amber-400">+5 pts</strong></span>
              <span>🥈 Subcampeón: <strong className="text-slate-200">+2 pts</strong></span>
              <span>⚔️ Victoria en Bo3: <strong className="text-emerald-400">+3 pts</strong></span>
            </div>
          </div>
        </section>

        {/* --- 4. META DE TINTAS & REGISTRO DE MAZOS --- */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <Palette className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 block">
                Estadísticas TCG
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Meta de Tintas & Registro Real de Mazos</h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              En la pestaña <strong>Meta de Tintas</strong> se analiza qué colores de Lorcana (Ámbar, Amatista, Esmeralda, Rubí, Zafiro y Acero) tienen mayor winrate y presencia en el Crew.
            </p>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <strong className="text-white block font-bold">🎯 ¿Cómo sabe el sistema qué colores jugó cada uno?</strong>
              <p className="text-slate-400 leading-relaxed">
                Al anotar cualquier resultado (liga o torneos), se pueden elegir los <strong>2 colores de baraja con los que jugó cada participante</strong>. Vienen sugeridos con los de su perfil, pero si cambiaste de mazo para esa jornada, puedes indicar los colores reales y el Meta Report computará la victoria o derrota con total fidelidad.
              </p>
            </div>
          </div>
        </section>

        {/* --- 5. PERFIL DE ILUMINADOR & PRIVACIDAD --- */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <Users className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80 block">
                Personalización
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Perfil de Iluminador & Tintas Secretas</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>👤 Avatares Oficiales de Lorcana</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                En <strong>Mi Perfil</strong> puedes elegir tu avatar temático oficial (Rapunzel, Mickey, Elsa, Maui, Stitch, Maléfica, Hades, Cenicienta...), añadir tu carta favorita y compartir tu biografía o estilo de juego.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Oculto (Tintas Privadas)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                ¿Quieres guardar sorpresa sobre tu baraja para el fin de semana? En tu perfil puedes activar <strong>Tintas en Secreto (Privado)</strong>. El resto de jugadores verán solo un candado 🔒 y únicamente tú podrás ver tus colores antes de jugar.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Call to Action */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/30 text-center space-y-3 shadow-2xl">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-lg sm:text-xl font-bold text-white">¿Listo para saltar a la mesa?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Revisa tus emparejamientos de esta semana, baraja tus 60 cartas y ¡mucha suerte en tus partidas Bo3!
        </p>
        <div className="pt-2">
          <Link
            href="/jornadas"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20"
          >
            <span>Ver Partidos de la Jornada</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
