import { InkInfo, InkType } from '@/types';

export const LORCANA_INKS: Record<InkType, InkInfo> = {
  Amber: {
    name: 'Amber',
    label: 'Ámbar',
    color: '#F59E0B',
    bgGradient: 'from-amber-600/30 to-amber-950/40',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    accentColor: 'bg-amber-500',
    description: 'Comunidad, curación, cantantes y apoyo tenaz.',
  },
  Amethyst: {
    name: 'Amethyst',
    label: 'Amatista',
    color: '#A855F7',
    bgGradient: 'from-purple-600/30 to-purple-950/40',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    accentColor: 'bg-purple-500',
    description: 'Magia mística, robo de cartas y personajes escurridizos.',
  },
  Emerald: {
    name: 'Emerald',
    label: 'Esmeralda',
    color: '#10B981',
    bgGradient: 'from-emerald-600/30 to-emerald-950/40',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    accentColor: 'bg-emerald-500',
    description: 'Disrupción, agilidad, tempo y juego psicológico.',
  },
  Ruby: {
    name: 'Ruby',
    label: 'Rubí',
    color: '#EF4444',
    bgGradient: 'from-rose-600/30 to-rose-950/40',
    borderColor: 'border-rose-500/50',
    textColor: 'text-rose-400',
    accentColor: 'bg-rose-500',
    description: 'Poder desafiante, combate directo y control agresivo.',
  },
  Sapphire: {
    name: 'Sapphire',
    label: 'Zafiro',
    color: '#3B82F6',
    bgGradient: 'from-blue-600/30 to-blue-950/40',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    accentColor: 'bg-blue-500',
    description: 'Generación acelerada de tinta, objetos y estrategia cerebral.',
  },
  Steel: {
    name: 'Steel',
    label: 'Acero',
    color: '#94A3B8',
    bgGradient: 'from-slate-500/30 to-slate-900/40',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    accentColor: 'bg-slate-400',
    description: 'Armadura pesada, gran resistencia y daño devastador.',
  },
};

export const ALL_INKS: InkType[] = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

export const LORCANA_FORMATS = {
  porcana: {
    id: 'porcana' as const,
    name: 'Porcana',
    label: 'Porcana',
    badgeClass: 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/40',
    description: 'Edición especial Caldereta Crew',
  },
  core: {
    id: 'core' as const,
    name: 'Core Constructed',
    label: 'Core',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Formato oficial de 60 cartas y hasta 2 tintas',
  },
  infiniti: {
    id: 'infiniti' as const,
    name: 'Infiniti',
    label: 'Infiniti',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Formato libre y partidas casuales',
  },
};

export const LORCANA_AVATARS = [
  { id: 'mickey', name: 'Mickey Hechicero', ink: 'Amethyst', icon: '🔧' },
  { id: 'maleficent', name: 'Maléfica Dragón', ink: 'Ruby', icon: '🐉' },
  { id: 'stitch', name: 'Stitch Estrella de Rock', ink: 'Amber', icon: '🎸' },
  { id: 'tinkerbell', name: 'Campanilla Hada Gigante', ink: 'Steel', icon: '🧚' },
  { id: 'hades', name: 'Hades Dios del Inframundo', ink: 'Sapphire', icon: '🔥' },
  { id: 'kuzco', name: 'Kuzco Llama Temperamental', ink: 'Emerald', icon: '🦙' },
  { id: 'elsa', name: 'Elsa Espíritu del Invierno', ink: 'Amethyst', icon: '❄️' },
  { id: 'ursula', name: 'Úrsula Engañosa', ink: 'Emerald', icon: '🐙' },
  { id: 'beast', name: 'Bestia Incansable', ink: 'Steel', icon: '🦁' },
  { id: 'ariel', name: 'Ariel Coleccionista', ink: 'Amber', icon: '🧜‍♀️' },
  { id: 'maui', name: 'Maui Semidiós', ink: 'Ruby', icon: '🦈' },
  { id: 'belle', name: 'Bella Extraña pero Hermosa', ink: 'Sapphire', icon: '📚' },
  { id: 'jafar', name: 'Jafar Sultán Ilusionista', ink: 'Amethyst', icon: '🐍' },
  { id: 'robin_hood', name: 'Robin Hood Campeón', ink: 'Steel', icon: '🏹' },
  { id: 'genie', name: 'Genio Poderoso', ink: 'Emerald', icon: '🧞' },
  { id: 'cinderella', name: 'Cenicienta Guerrera', ink: 'Amber', icon: '✨' },
  { id: 'rapunzel', name: 'Rapunzel Curandera', ink: 'Amber', icon: '☀️' },
];

export const JWT_SECRET = process.env.JWT_SECRET || 'lorcana-league-secret-key-super-secure-token-2026';
export const AUTH_COOKIE_NAME = 'lorcana_session_token';

// Initial Group Gate PIN
export const GATE_PIN = '8585';
export const PIN_COOKIE_NAME = 'lorcana_gate_pin';
