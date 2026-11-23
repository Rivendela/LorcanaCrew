import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Trophy,
  Swords,
  Calendar,
  Shield,
  Palette,
  Lock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Award,
  Users,
  Flame,
  ArrowRight,
  Database,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ComoSeUsaPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/20 p-6 sm:p-10 shadow-2xl">
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
            Bienvenido al centro de mando de la <strong>Liga y Torneos de Disney Lorcana</strong> de Caldereta Crew. Aquí tienes una explicación rápida y clara de cómo funciona cada sección, las normas de competición y cómo registrar tus partidas.
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

      {/* Guide Cards Grid */}
      <div className="space-y-8">
        {/* 1. Liga Regular */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 block">Sección 1</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">La Liga Regular Semanal</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <span>⚔️ Partidos al Mejor de 3 (Bo3)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed text-xs">
                Cada jornada semanal enfrenta a dos jugadores en formato Bo3. El ganador de la serie se anota <strong>2-0</strong> o <strong>2-1</strong>. En caso de no terminar a tiempo o pactar tablas, se permite el empate (<strong>1-1</strong>).
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <span>🏆 Puntuación de Liga</span>
              </h3>
              <p className="text-slate-400 leading-relaxed text-xs">
                • <strong>Victoria:</strong> +3 puntos.<br />
                • <strong>Empate:</strong> +1 punto.<br />
                • <strong>Derrota:</strong> 0 puntos.<br />
                • <strong>Desempates:</strong> Puntos &gt; Diferencial (+/-) de partidas Bo3 &gt; Enfrentamiento directo.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <strong className="font-bold flex items-center gap-1.5 text-amber-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              ¿Cuándo se suman los puntos a la tabla de clasificación?
            </strong>
            <p className="text-slate-300 leading-relaxed">
              Para garantizar total justicia y transparencia, <strong>los puntos de la tabla general solo se computan cuando el Comisionado cierra oficialmente la jornada</strong>. Así evitamos sumar victorias de descansos (BYEs) futuros antes de que ocurran. Los resultados anotados en la semana se muestran de inmediato en la tarjeta del partido, y se consolidan en la tabla al finalizar la semana.
            </p>
            <div className="pt-2 border-t border-amber-500/20 text-slate-300 space-y-1">
              <p>• <strong>Visibilidad de Jornadas:</strong> Los jugadores solo ven las jornadas pasadas y la jornada actualmente en juego. Las jornadas futuras quedan reservadas para la planificación del Comisionado.</p>
              <p>• <strong>Paso de Jornada Estricto:</strong> El sistema impide avanzar a la siguiente jornada si aún quedan partidos pendientes por jugar en la jornada actual.</p>
              <p>• <strong>Rol del Comisionado:</strong> El administrador supervisa y gestiona la liga, nunca compite como jugador en clasificaciones ni torneos.</p>
            </div>
          </div>
        </section>

        {/* 2. Torneos (2 Modalidades) */}
        <section className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-purple-400">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <Swords className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/80 block">Sección 2</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Torneos Especiales CCREW (2 Formatos)</h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300">
            Los torneos son eventos independientes de la liga semanal. Cuentan con su propio <strong>Ranking de Copas</strong> y un <strong>Palmarés histórico</strong>. Se pueden disputar en dos modalidades:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <span>⚔️ 1. Eliminación Directa (Playoffs / Bracket)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                El formato clásico de copas: árbol de cruces (cuartos, semifinales y final). El que gana su cruce Bo3 avanza automáticamente a la siguiente ronda; el que pierde queda eliminado. El vencedor de la Gran Final es coronado Campeón 👑.
              </p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                <span>🛡️ 2. Sistema Suizo (Swiss Tournament)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                El formato rey de los TCGs competitivos: <strong>¡nadie queda eliminado tras la primera partida!</strong> Se juegan varias rondas (ej. 3 o 4) donde los ganadores juegan contra ganadores y los que tienen derrotas contra rivales con similar récord. Al terminar las rondas, el primer clasificado por puntos y desempate Buchholz es el Campeón.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
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

        {/* 3. Meta de Tintas & Registro */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <Palette className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 block">Sección 3</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Meta de Tintas & Registro Real de Mazos</h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              En la pestaña <strong>Meta de Tintas</strong> se analiza el porcentaje de victorias de cada color de Lorcana (Ámbar, Amatista, Esmeralda, Rubí, Zafiro y Acero).
            </p>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <strong className="text-white block font-bold">🎯 ¿Cómo sabe el sistema qué mazo jugó cada uno?</strong>
              <p className="text-slate-400 leading-relaxed">
                Al anotar cualquier resultado (tanto en partidos de liga como en torneos), la ventana te permite seleccionar los <strong>2 colores de mazo con los que jugó cada participante</strong>. Vienen preseleccionados con los colores habituales de su perfil, pero si cambiaste de mazo para esa partida, puedes elegir los colores exactos y el informe del meta computará la victoria y derrota con total precisión.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Perfil y Privacidad */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <Users className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80 block">Sección 4</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Perfil de Iluminador & Tintas Secretas</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>👤 Personalización</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                En <strong>Mi Perfil</strong> puedes elegir tu avatar oficial de Disney Lorcana (Mickey, Elsa, Stitch, Maléfica, Hades, etc.), añadir tu carta favorita y escribir tu biografía o estilo de juego.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Oculto (Tintas Privadas)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                ¿Quieres mantener en secreto qué mazo vas a jugar este fin de semana? En tu perfil activa <strong>Tintas en Secreto (Privado)</strong>. El resto de jugadores verán una insignia de <em>Oculto 🔒</em> y solo tú y el comisionado podréis ver tus colores.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Comisionado */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-sky-400">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400/80 block">Sección 5</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Panel de Comisionado (Admin)</h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Los administradores cuentan con la pestaña <strong>Comisionado</strong> para orquestar la liga:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-1">
              <strong className="text-amber-300 block font-bold">1. Control Semanal</strong>
              <p className="text-slate-400">
                Lanzar jornadas oficiales, corregir marcadores y cerrar jornadas con backup automático.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-1">
              <strong className="text-amber-300 block font-bold">2. Gestión de Jugadores</strong>
              <p className="text-slate-400">
                Crear nuevos miembros, editar alias/tintas, resetear contraseñas o eliminar jugadores.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-1">
              <strong className="text-amber-300 block font-bold">3. Torneos & Resets</strong>
              <p className="text-slate-400">
                Crear copas por Eliminación o Suizo, y reiniciar temporadas manteniendo los perfiles.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">¿Listo para competir?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Revisa tus emparejamientos de esta semana, prepara tu tinta y ¡mucha suerte en tus partidas Bo3!
        </p>
        <div className="pt-2">
          <Link
            href="/jornadas"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20"
          >
            <span>Ver Partidos de la Semana</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
