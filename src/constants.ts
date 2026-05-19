import { Challenge } from './types';

export const APP_VERSION = '1.0.5';
export const BUILD_DATE = '2026-05-07';

export const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: '70k Pontos em 7 Dias',
    description: 'Alcance 70.000 pontos em uma única semana de treinamento intenso.',
    icon: '🏆',
    duration: '7 dias',
    points: 2000,
    difficulty: 'difícil',
    color: 'rose'
  },
  {
    id: 'streak_7',
    title: 'Guerreiro da Semana',
    description: 'Complete 7 dias seguidos de treino sem falhar.',
    icon: '🔥',
    duration: '7 dias',
    points: 500,
    difficulty: 'médio',
    color: 'orange'
  },
  {
    id: 'early_bird',
    title: 'Madrugador Elite',
    description: 'Treine antes das 8h da manhã por 5 dias.',
    icon: '🌅',
    duration: '5 dias',
    points: 300,
    difficulty: 'fácil',
    color: 'yellow'
  },
  {
    id: 'hydration_king',
    title: 'Rei da Hidratação',
    description: 'Beba 3L de água todos os dias por 14 dias.',
    icon: '💧',
    duration: '14 dias',
    points: 400,
    difficulty: 'fácil',
    color: 'blue'
  },
  {
    id: 'heavy_lifter',
    title: 'Peso de Elite',
    description: 'Aumente sua carga em 10% em 3 exercícios base.',
    icon: '🏋️',
    duration: '30 dias',
    points: 1000,
    difficulty: 'difícil',
    color: 'purple'
  }
];

/**
 * STRIPE CONFIGURATION REQUIREMENTS:
 * 
 * To fix "Link not found" errors, you MUST configure these in the Settings -> Environment Variables menu:
 * 
 * 1. VITE_STRIPE_LINK_PRO: Link for PRO plan
 * 2. VITE_STRIPE_LINK_PREMIUM: Link for PREMIUM plan
 * 3. VITE_STRIPE_LINK_PROFISSIONAL: Link for PROFISSIONAL plan
 */
