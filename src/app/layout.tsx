import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CCREW | Caldereta Crew - Liga Lorcana',
  description: 'Web oficial de la Liga de Disney Lorcana para Caldereta Crew (CCREW). Formatos Porcana, Core e Infiniti.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/60 backdrop-blur py-6 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-300">
            CCREW • Caldereta Crew • Liga de Lorcana
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos: Porcana • Core • Infiniti • Puntuación Bo3 Semanal
          </p>
          <div className="mt-2.5">
            <a
              href="/como-se-usa"
              className="text-xs text-amber-400/90 hover:text-amber-300 font-medium underline underline-offset-4 transition-colors"
            >
              📖 ¿Cómo se usa? Consulta la Guía Oficial del Iluminador
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
