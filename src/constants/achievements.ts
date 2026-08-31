export type AchievementCategory = 'all' | 'workout' | 'diet' | 'streak' | 'hydration' | 'evolution' | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xpReward: number;
  targetValue: number;
  unit: string;
  badgeGradient: string;
  badgeBorder: string;
  glowColor: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
  badgeColor: string;
  perk: string;
}

export const LEVELS_CONFIG: LevelInfo[] = [
  {
    level: 1,
    title: 'Iniciante Determinado',
    minXp: 0,
    maxXp: 200,
    icon: 'Zap',
    badgeColor: 'from-zinc-500 to-zinc-700',
    perk: 'Acesso completo ao planejador de treinos e dieta com IA.'
  },
  {
    level: 2,
    title: 'Praticante Focado',
    minXp: 200,
    maxXp: 500,
    icon: 'Shield',
    badgeColor: 'from-blue-500 to-cyan-600',
    perk: 'Desbloqueio de relatórios avançados de evolução semanal.'
  },
  {
    level: 3,
    title: 'Atleta Dedicado',
    minXp: 500,
    maxXp: 1000,
    icon: 'Award',
    badgeColor: 'from-emerald-500 to-teal-600',
    perk: 'Emblema de Atleta no perfil e acesso a novos desafios.'
  },
  {
    level: 4,
    title: 'Guerreiro do Ferro',
    minXp: 1000,
    maxXp: 1800,
    icon: 'Flame',
    badgeColor: 'from-orange-500 to-amber-600',
    perk: 'Multiplicador de XP 1.1x em check-ins diários.'
  },
  {
    level: 5,
    title: 'Mestre da Consistência',
    minXp: 1800,
    maxXp: 3000,
    icon: 'Target',
    badgeColor: 'from-purple-500 to-indigo-600',
    perk: 'Moldura dourada exclusiva para fotos no Stories.'
  },
  {
    level: 6,
    title: 'Titã da Performance',
    minXp: 3000,
    maxXp: 5000,
    icon: 'TrendingUp',
    badgeColor: 'from-pink-500 to-rose-600',
    perk: 'Multiplicador de XP 1.25x e tema exclusivo Titã Dark.'
  },
  {
    level: 7,
    title: 'Elite Absoluta',
    minXp: 5000,
    maxXp: 8000,
    icon: 'Star',
    badgeColor: 'from-amber-400 to-yellow-600',
    perk: 'Destaque no ranking geral de alunos FitAI.'
  },
  {
    level: 8,
    title: 'Lenda FitAI',
    minXp: 8000,
    maxXp: 12000,
    icon: 'Trophy',
    badgeColor: 'from-violet-500 to-fuchsia-600',
    perk: 'Selo oficial de Lenda e exportação ilimitada de relatórios.'
  },
  {
    level: 9,
    title: 'Semideus Fitness',
    minXp: 12000,
    maxXp: 18000,
    icon: 'Crown',
    badgeColor: 'from-cyan-400 to-blue-700',
    perk: 'Multiplicador de XP 1.5x e insígnia mítica de perfil.'
  },
  {
    level: 10,
    title: 'Imortal do Olimpo',
    minXp: 18000,
    maxXp: 99999,
    icon: 'Sparkles',
    badgeColor: 'from-yellow-300 via-amber-500 to-red-600',
    perk: 'Patente máxima e reconhecimento vitalício no Hall da Fama.'
  }
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // Treinos & Exercícios
  {
    id: 'first_workout',
    title: 'Primeiro Passo',
    description: 'Registre e conclua seu 1º treino no aplicativo.',
    iconName: 'Dumbbell',
    category: 'workout',
    tier: 'bronze',
    xpReward: 50,
    targetValue: 1,
    unit: 'treino',
    badgeGradient: 'from-amber-700 to-yellow-900',
    badgeBorder: 'border-amber-600/40',
    glowColor: 'rgba(217, 119, 6, 0.2)'
  },
  {
    id: 'workout_5',
    title: 'Ritmo Constante',
    description: 'Conclua 5 sessões de treino com dedicação.',
    iconName: 'Activity',
    category: 'workout',
    tier: 'bronze',
    xpReward: 150,
    targetValue: 5,
    unit: 'treinos',
    badgeGradient: 'from-amber-600 to-yellow-800',
    badgeBorder: 'border-amber-500/50',
    glowColor: 'rgba(245, 158, 11, 0.25)'
  },
  {
    id: 'workout_15',
    title: 'Atleta em Construção',
    description: 'Atinja a marca de 15 treinos concluídos.',
    iconName: 'Shield',
    category: 'workout',
    tier: 'silver',
    xpReward: 300,
    targetValue: 15,
    unit: 'treinos',
    badgeGradient: 'from-slate-400 to-zinc-600',
    badgeBorder: 'border-slate-300/50',
    glowColor: 'rgba(148, 163, 184, 0.3)'
  },
  {
    id: 'workout_30',
    title: 'Guerreiro Incansável',
    description: 'Complete 30 treinos registrados no FitAI.',
    iconName: 'Flame',
    category: 'workout',
    tier: 'gold',
    xpReward: 600,
    targetValue: 30,
    unit: 'treinos',
    badgeGradient: 'from-yellow-400 to-amber-600',
    badgeBorder: 'border-yellow-300/60',
    glowColor: 'rgba(234, 179, 8, 0.35)'
  },
  {
    id: 'workout_60',
    title: 'Centurião do Aço',
    description: 'Atinja 60 treinos concluídos com maestria.',
    iconName: 'Trophy',
    category: 'workout',
    tier: 'diamond',
    xpReward: 1500,
    targetValue: 60,
    unit: 'treinos',
    badgeGradient: 'from-cyan-400 to-blue-600',
    badgeBorder: 'border-cyan-300/70',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },

  // Dieta & Nutrição
  {
    id: 'diet_first',
    title: 'Foco no Prato',
    description: 'Registre sua 1ª adesão ou refeição do plano alimentar.',
    iconName: 'Utensils',
    category: 'diet',
    tier: 'bronze',
    xpReward: 50,
    targetValue: 1,
    unit: 'registro',
    badgeGradient: 'from-emerald-700 to-green-900',
    badgeBorder: 'border-emerald-600/40',
    glowColor: 'rgba(16, 185, 129, 0.2)'
  },
  {
    id: 'diet_streak_3',
    title: 'Dieta Blindada',
    description: 'Mantenha 3 registros de adesão à dieta alimentar.',
    iconName: 'Target',
    category: 'diet',
    tier: 'bronze',
    xpReward: 150,
    targetValue: 3,
    unit: 'dias',
    badgeGradient: 'from-emerald-600 to-teal-800',
    badgeBorder: 'border-emerald-500/50',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  },
  {
    id: 'diet_streak_7',
    title: 'Mestre dos Macros',
    description: 'Atinja 7 dias de consistência alimentar na sua dieta.',
    iconName: 'Award',
    category: 'diet',
    tier: 'silver',
    xpReward: 350,
    targetValue: 7,
    unit: 'dias',
    badgeGradient: 'from-teal-400 to-emerald-600',
    badgeBorder: 'border-teal-300/50',
    glowColor: 'rgba(20, 184, 166, 0.3)'
  },
  {
    id: 'diet_streak_21',
    title: 'Hábito Inabalável',
    description: 'Acumule 21 registros de adesão à dieta calculada.',
    iconName: 'Sparkles',
    category: 'diet',
    tier: 'gold',
    xpReward: 800,
    targetValue: 21,
    unit: 'dias',
    badgeGradient: 'from-green-400 to-emerald-600',
    badgeBorder: 'border-green-300/60',
    glowColor: 'rgba(34, 197, 94, 0.35)'
  },

  // Streaks & Consistência
  {
    id: 'streak_3',
    title: 'Faísca Inicial',
    description: 'Mantenha 3 dias seguidos de ofensiva ativa.',
    iconName: 'Zap',
    category: 'streak',
    tier: 'bronze',
    xpReward: 100,
    targetValue: 3,
    unit: 'dias',
    badgeGradient: 'from-orange-600 to-red-800',
    badgeBorder: 'border-orange-500/50',
    glowColor: 'rgba(249, 115, 22, 0.25)'
  },
  {
    id: 'streak_7',
    title: 'Semana de Fogo',
    description: 'Atinja 7 dias consecutivos sem quebrar o streak.',
    iconName: 'Flame',
    category: 'streak',
    tier: 'silver',
    xpReward: 300,
    targetValue: 7,
    unit: 'dias',
    badgeGradient: 'from-orange-500 to-amber-600',
    badgeBorder: 'border-orange-400/60',
    glowColor: 'rgba(249, 115, 22, 0.35)'
  },
  {
    id: 'streak_14',
    title: 'Quinzena Imparável',
    description: '14 dias ininterruptos de consistência total.',
    iconName: 'Star',
    category: 'streak',
    tier: 'gold',
    xpReward: 600,
    targetValue: 14,
    unit: 'dias',
    badgeGradient: 'from-amber-400 to-orange-600',
    badgeBorder: 'border-yellow-400/60',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'streak_30',
    title: 'Mês Lendário',
    description: '30 dias de ofensiva ininterrupta com o FitAI.',
    iconName: 'Crown',
    category: 'streak',
    tier: 'diamond',
    xpReward: 1500,
    targetValue: 30,
    unit: 'dias',
    badgeGradient: 'from-purple-500 to-pink-600',
    badgeBorder: 'border-purple-300/70',
    glowColor: 'rgba(168, 85, 247, 0.4)'
  },
  {
    id: 'streak_100',
    title: 'Imortal da Consistência',
    description: '100 dias consecutivos sem falhar nenhum dia.',
    iconName: 'Sparkles',
    category: 'streak',
    tier: 'legendary',
    xpReward: 5000,
    targetValue: 100,
    unit: 'dias',
    badgeGradient: 'from-yellow-300 via-pink-500 to-purple-700',
    badgeBorder: 'border-yellow-200',
    glowColor: 'rgba(234, 179, 8, 0.6)'
  },

  // Hidratação
  {
    id: 'water_first',
    title: 'Gota Sagrada',
    description: 'Bata sua meta de ingestão de água pela 1ª vez.',
    iconName: 'Droplets',
    category: 'hydration',
    tier: 'bronze',
    xpReward: 50,
    targetValue: 1,
    unit: 'dia',
    badgeGradient: 'from-blue-700 to-cyan-900',
    badgeBorder: 'border-blue-500/40',
    glowColor: 'rgba(59, 130, 246, 0.2)'
  },
  {
    id: 'water_streak_7',
    title: 'Oásis Diário',
    description: 'Bata a meta diária de água por 7 dias seguidos.',
    iconName: 'Droplet',
    category: 'hydration',
    tier: 'silver',
    xpReward: 250,
    targetValue: 7,
    unit: 'dias',
    badgeGradient: 'from-blue-500 to-cyan-600',
    badgeBorder: 'border-blue-400/50',
    glowColor: 'rgba(59, 130, 246, 0.3)'
  },
  {
    id: 'water_streak_30',
    title: 'Rei da Hidratação',
    description: '30 dias consecutivos com hidratação perfeita.',
    iconName: 'Crown',
    category: 'hydration',
    tier: 'gold',
    xpReward: 800,
    targetValue: 30,
    unit: 'dias',
    badgeGradient: 'from-cyan-400 to-blue-700',
    badgeBorder: 'border-cyan-300/60',
    glowColor: 'rgba(6, 182, 212, 0.35)'
  },

  // Evolução Corporal & Peso
  {
    id: 'weight_log_first',
    title: 'Ponto de Partida',
    description: 'Registre seu peso corporal pela primeira vez.',
    iconName: 'TrendingUp',
    category: 'evolution',
    tier: 'bronze',
    xpReward: 50,
    targetValue: 1,
    unit: 'pesagem',
    badgeGradient: 'from-indigo-700 to-purple-900',
    badgeBorder: 'border-indigo-500/40',
    glowColor: 'rgba(99, 102, 241, 0.2)'
  },
  {
    id: 'weight_log_4',
    title: 'Evolução Monitorada',
    description: 'Acumule 4 registros de peso no gráfico histórico.',
    iconName: 'Activity',
    category: 'evolution',
    tier: 'silver',
    xpReward: 200,
    targetValue: 4,
    unit: 'pesagens',
    badgeGradient: 'from-indigo-500 to-purple-600',
    badgeBorder: 'border-indigo-400/50',
    glowColor: 'rgba(99, 102, 241, 0.3)'
  },
  {
    id: 'target_weight_reached',
    title: 'Meta Conquistada',
    description: 'Alcance a meta de peso corporal estipulada.',
    iconName: 'Trophy',
    category: 'evolution',
    tier: 'gold',
    xpReward: 1000,
    targetValue: 1,
    unit: 'meta',
    badgeGradient: 'from-yellow-400 to-amber-600',
    badgeBorder: 'border-yellow-300/60',
    glowColor: 'rgba(234, 179, 8, 0.4)'
  },

  // Desafios & Biblioteca
  {
    id: 'challenge_joined',
    title: 'Espírito Competitivo',
    description: 'Participe do seu 1º desafio com a comunidade.',
    iconName: 'Target',
    category: 'special',
    tier: 'bronze',
    xpReward: 100,
    targetValue: 1,
    unit: 'desafio',
    badgeGradient: 'from-pink-600 to-rose-800',
    badgeBorder: 'border-pink-500/50',
    glowColor: 'rgba(236, 72, 153, 0.25)'
  },
  {
    id: 'favorite_3_exercises',
    title: 'Estudioso do Movimento',
    description: 'Adicione 3 exercícios aos seus favoritos.',
    iconName: 'Star',
    category: 'special',
    tier: 'bronze',
    xpReward: 75,
    targetValue: 3,
    unit: 'favoritos',
    badgeGradient: 'from-violet-600 to-purple-800',
    badgeBorder: 'border-violet-500/50',
    glowColor: 'rgba(139, 92, 246, 0.25)'
  }
];

export function calculateUserLevel(totalXp: number): { currentLevel: LevelInfo; nextLevel: LevelInfo | null; progressPercent: number; xpInCurrentLevel: number; xpForNextLevel: number } {
  const safeXp = Math.max(0, totalXp || 0);
  
  let currentLevel = LEVELS_CONFIG[0];
  for (const lvl of LEVELS_CONFIG) {
    if (safeXp >= lvl.minXp) {
      currentLevel = lvl;
    } else {
      break;
    }
  }

  const nextLevel = LEVELS_CONFIG.find(l => l.level === currentLevel.level + 1) || null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      xpInCurrentLevel: safeXp - currentLevel.minXp,
      xpForNextLevel: 0
    };
  }

  const range = currentLevel.maxXp - currentLevel.minXp;
  const currentInRange = safeXp - currentLevel.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    xpInCurrentLevel: currentInRange,
    xpForNextLevel: range
  };
}
