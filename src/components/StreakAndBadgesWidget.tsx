import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Trophy, Award, Star, Zap, Shield, Droplets, Dumbbell, 
  CheckCircle2, Lock, ChevronRight, Share2, Sparkles, Calendar,
  TrendingUp, Info, Clock, Camera
} from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';
import { useUser } from '../store/userStore';

interface StreakAndBadgesWidgetProps {
  onOpenShareModal?: (badgeTitle?: string) => void;
  onOpenStoriesModal?: (badgeTitle?: string) => void;
  onOpenCalendar?: () => void;
}

export interface AchievementBadge {
  id: string;
  name: string;
  category: 'streak' | 'workout' | 'hydration' | 'evolution' | 'mastery';
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  earnedAt?: string;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
}

export function StreakAndBadgesWidget({
  onOpenShareModal,
  onOpenStoriesModal,
  onOpenCalendar
}: StreakAndBadgesWidgetProps) {
  const { profile, plan, doCheckIn } = useUser();
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'streak' | 'workout' | 'hydration' | 'evolution' | 'mastery'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null);

  const streak = profile?.streak || 0;
  const points = profile?.points || 0;
  const level = profile?.level || Math.floor(points / 100) + 1;
  const currentLevelXp = points % 100;
  const xpForNextLevel = 100;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100));

  const checkInDates = profile?.checkInDates || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = checkInDates.includes(todayStr);

  const completedWorkouts = plan?.days?.filter(d => d.isCompleted).length || 0;
  const hydrationStreak = profile?.hydration?.streakDays || (profile?.hydration?.logs?.length ? 1 : 0);
  const weightEntriesCount = profile?.weightHistory?.length || (profile?.weight ? 1 : 0);
  const joinedChallengesCount = profile?.joinedChallenges?.length || 0;

  // Generate badges dynamically based on user state
  const badges: AchievementBadge[] = [
    // Streak Badges
    {
      id: 'streak_1',
      name: 'Primeira Faísca',
      category: 'streak',
      description: 'Realize seu primeiro check-in diário no FitAI.',
      icon: '⚡',
      xpReward: 50,
      unlocked: streak >= 1 || checkInDates.length >= 1,
      progress: Math.min(1, checkInDates.length > 0 ? 1 : 0),
      maxProgress: 1,
      rarity: 'Comum'
    },
    {
      id: 'streak_3',
      name: 'Em Chamas',
      category: 'streak',
      description: 'Mantenha 3 dias consecutivos de ofensiva ativa.',
      icon: '🔥',
      xpReward: 150,
      unlocked: streak >= 3,
      progress: Math.min(3, streak),
      maxProgress: 3,
      rarity: 'Comum'
    },
    {
      id: 'streak_7',
      name: 'Hábito de Ferro',
      category: 'streak',
      description: 'Complete 7 dias ininterruptos de treino e consistência.',
      icon: '🛡️',
      xpReward: 350,
      unlocked: streak >= 7,
      progress: Math.min(7, streak),
      maxProgress: 7,
      rarity: 'Raro'
    },
    {
      id: 'streak_14',
      name: 'Quinzena de Aço',
      category: 'streak',
      description: 'Atinja 14 dias de disciplina blindada.',
      icon: '⚔️',
      xpReward: 700,
      unlocked: streak >= 14,
      progress: Math.min(14, streak),
      maxProgress: 14,
      rarity: 'Épico'
    },
    {
      id: 'streak_30',
      name: 'Lenda da Disciplina',
      category: 'streak',
      description: 'Alcance 30 dias de consistência lendária.',
      icon: '👑',
      xpReward: 1500,
      unlocked: streak >= 30,
      progress: Math.min(30, streak),
      maxProgress: 30,
      rarity: 'Lendário'
    },
    {
      id: 'streak_60',
      name: 'Mestre da Constância',
      category: 'streak',
      description: 'Mantenha 60 dias de foco inabalável.',
      icon: '💎',
      xpReward: 3000,
      unlocked: streak >= 60,
      progress: Math.min(60, streak),
      maxProgress: 60,
      rarity: 'Lendário'
    },

    // Workout Milestones
    {
      id: 'workout_1',
      name: 'Primeiro Passo',
      category: 'workout',
      description: 'Conclua seu 1º treino planejado no protocolo.',
      icon: '🏋️',
      xpReward: 100,
      unlocked: completedWorkouts >= 1,
      progress: Math.min(1, completedWorkouts),
      maxProgress: 1,
      rarity: 'Comum'
    },
    {
      id: 'workout_5',
      name: 'Ritmo Forte',
      category: 'workout',
      description: 'Conclua 5 treinos completos com sucesso.',
      icon: '💪',
      xpReward: 250,
      unlocked: completedWorkouts >= 5,
      progress: Math.min(5, completedWorkouts),
      maxProgress: 5,
      rarity: 'Comum'
    },
    {
      id: 'workout_10',
      name: 'Titã da Academia',
      category: 'workout',
      description: 'Complete 10 sessões de treinamento registradas.',
      icon: '🏆',
      xpReward: 500,
      unlocked: completedWorkouts >= 10,
      progress: Math.min(10, completedWorkouts),
      maxProgress: 10,
      rarity: 'Raro'
    },
    {
      id: 'workout_25',
      name: 'Veterano dos Ferros',
      category: 'workout',
      description: 'Alcance o marco de 25 sessões concluídas.',
      icon: '🥊',
      xpReward: 1250,
      unlocked: completedWorkouts >= 25,
      progress: Math.min(25, completedWorkouts),
      maxProgress: 25,
      rarity: 'Épico'
    },
    {
      id: 'workout_50',
      name: 'Centurião Fitness',
      category: 'workout',
      description: 'Conquiste a incrível marca de 50 treinos finalizados.',
      icon: '🥇',
      xpReward: 2500,
      unlocked: completedWorkouts >= 50,
      progress: Math.min(50, completedWorkouts),
      maxProgress: 50,
      rarity: 'Lendário'
    },

    // Hydration Milestones
    {
      id: 'hydra_1',
      name: 'Gota de Ouro',
      category: 'hydration',
      description: 'Bata 100% da sua meta de hidratação diária.',
      icon: '💧',
      xpReward: 75,
      unlocked: (profile?.hydration?.logs || []).reduce((a, b) => a + b.amount, 0) >= (profile?.hydration?.goal || 2500),
      progress: Math.min(1, (profile?.hydration?.logs || []).reduce((a, b) => a + b.amount, 0) >= (profile?.hydration?.goal || 2500) ? 1 : 0),
      maxProgress: 1,
      rarity: 'Comum'
    },
    {
      id: 'hydra_3',
      name: 'Tsunami de Foco',
      category: 'hydration',
      description: 'Bata a meta de água por 3 dias seguidos.',
      icon: '🌊',
      xpReward: 200,
      unlocked: hydrationStreak >= 3,
      progress: Math.min(3, hydrationStreak),
      maxProgress: 3,
      rarity: 'Raro'
    },
    {
      id: 'hydra_7',
      name: 'Hidratação Blindada',
      category: 'hydration',
      description: 'Mantenha 7 dias consecutivos com a meta de água atingida.',
      icon: '🧊',
      xpReward: 500,
      unlocked: hydrationStreak >= 7,
      progress: Math.min(7, hydrationStreak),
      maxProgress: 7,
      rarity: 'Épico'
    },

    // Evolution & Body Milestones
    {
      id: 'evol_1',
      name: 'Ponto de Partida',
      category: 'evolution',
      description: 'Registre suas primeiras métricas corporais no diário de evolução.',
      icon: '🎯',
      xpReward: 75,
      unlocked: weightEntriesCount >= 1,
      progress: Math.min(1, weightEntriesCount),
      maxProgress: 1,
      rarity: 'Comum'
    },
    {
      id: 'evol_3',
      name: 'Diário de Ferro',
      category: 'evolution',
      description: 'Registre 3 atualizações de evolução física e peso.',
      icon: '⚖️',
      xpReward: 150,
      unlocked: weightEntriesCount >= 3,
      progress: Math.min(3, weightEntriesCount),
      maxProgress: 3,
      rarity: 'Raro'
    },
    {
      id: 'evol_5',
      name: 'Metamorfose',
      category: 'evolution',
      description: 'Acompanhe 5 atualizações completas de medidas e evolução.',
      icon: '📊',
      xpReward: 350,
      unlocked: weightEntriesCount >= 5,
      progress: Math.min(5, weightEntriesCount),
      maxProgress: 5,
      rarity: 'Épico'
    },

    // Mastery & Level Milestones
    {
      id: 'master_challenge',
      name: 'Desafiante Nato',
      category: 'mastery',
      description: 'Participe de pelo menos 1 desafio comunitário.',
      icon: '🚩',
      xpReward: 150,
      unlocked: joinedChallengesCount >= 1,
      progress: Math.min(1, joinedChallengesCount),
      maxProgress: 1,
      rarity: 'Comum'
    },
    {
      id: 'level_2',
      name: 'Rumo ao Topo',
      category: 'mastery',
      description: 'Alcance o Nível 2 de experiência e pontuação.',
      icon: '✨',
      xpReward: 150,
      unlocked: level >= 2,
      progress: Math.min(2, level),
      maxProgress: 2,
      rarity: 'Comum'
    },
    {
      id: 'level_5',
      name: 'Elite FitAI',
      category: 'mastery',
      description: 'Alcance o Nível 5 de consistência e pontuação.',
      icon: '⭐',
      xpReward: 1000,
      unlocked: level >= 5,
      progress: Math.min(5, level),
      maxProgress: 5,
      rarity: 'Épico'
    },
    {
      id: 'level_10',
      name: 'Soberano FitAI',
      category: 'mastery',
      description: 'Alcance o Nível 10 de maestria máxima no app.',
      icon: '👑',
      xpReward: 3000,
      unlocked: level >= 10,
      progress: Math.min(10, level),
      maxProgress: 10,
      rarity: 'Lendário'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const filteredBadges = badges.filter(b => {
    if (activeCategory !== 'all' && b.category !== activeCategory) {
      return false;
    }
    if (filterStatus === 'unlocked' && !b.unlocked) {
      return false;
    }
    if (filterStatus === 'locked' && b.unlocked) {
      return false;
    }
    return true;
  });

  // Calculate past 7 days checkin dots (Monday to Sunday of current week)
  const getWeeklyDays = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    // Let's get the Monday of the current week
    const monday = new Date(now);
    const dayDiff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    monday.setDate(now.getDate() + dayDiff);

    const weekDays = [];
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isPastOrToday = d <= now;
      const isChecked = checkInDates.includes(dStr);
      const isToday = dStr === todayStr;

      weekDays.push({
        label: dayLabels[i],
        dateStr: dStr,
        dayNum: d.getDate(),
        isChecked,
        isToday,
        isPastOrToday
      });
    }

    return weekDays;
  };

  const weekDays = getWeeklyDays();

  const handleCheckInClick = async () => {
    setIsCheckingIn(true);
    try {
      const res = await doCheckIn();
      setCheckinMessage('🔥 Check-in realizado! +50 XP e ofensiva atualizada!');
      setTimeout(() => setCheckinMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Streak & Gamification Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/40 border border-purple-500/20 p-5 sm:p-7 shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Streak Highlight */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Animated Flame Badge */}
            <div className="relative flex items-center justify-center">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 p-0.5 shadow-xl shadow-orange-500/20 animate-pulse">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex flex-col items-center justify-center p-2 text-center">
                  <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-orange-500 fill-orange-500 animate-bounce" />
                  <span className="text-xs font-black text-orange-400 uppercase tracking-tighter">Ofensiva</span>
                </div>
              </div>
              {streak > 0 && (
                <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-orange-500 text-black font-black text-[10px] tracking-wider shadow-md">
                  {streak} DIAS
                </span>
              )}
            </div>

            {/* Streak text info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  {streak === 0 ? 'Inicie sua Ofensiva' : `${streak} Dias Consecutivos`}
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                  Nível {level}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md">
                {streak === 0 
                  ? 'Faça seu check-in diário ou conclua um treino para começar seu histórico de disciplina!'
                  : 'Sua consistência está gerando bônus de XP e desbloqueando novas medalhas de honra!'}
              </p>

              {/* XP Progress Bar */}
              <div className="mt-3 max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    Progresso de XP
                  </span>
                  <span className="text-purple-400 font-mono">
                    {currentLevelXp} / {xpForNextLevel} XP (Nvl {level + 1})
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Tracker & Quick Check-in */}
          <div className="flex flex-col items-start lg:items-end space-y-4">
            {/* Weekly Days Row */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block text-left lg:text-right">
                Consistência da Semana
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {weekDays.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        d.isChecked
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-black shadow-md shadow-orange-500/20'
                          : d.isToday
                          ? 'bg-purple-600/30 border-2 border-purple-500 text-purple-300'
                          : d.isPastOrToday
                          ? 'bg-zinc-800/80 border border-zinc-700 text-zinc-500'
                          : 'bg-zinc-900 border border-zinc-800/50 text-zinc-600'
                      }`}
                    >
                      {d.isChecked ? (
                        <Flame className="w-4 h-4 text-black fill-black" />
                      ) : (
                        d.dayNum
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Daily Check-in & Share */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {!isCheckedInToday ? (
                <button
                  onClick={handleCheckInClick}
                  disabled={isCheckingIn}
                  className="flex-1 lg:flex-initial bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Flame className="w-4 h-4 fill-black" />
                  {isCheckingIn ? 'Registrando...' : 'Check-in de Hoje (+50 XP)'}
                </button>
              ) : (
                <div className="flex-1 lg:flex-initial bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Check-in de Hoje Concluído!
                </div>
              )}

              {onOpenCalendar && (
                <button
                  onClick={onOpenCalendar}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  title="Abrir Calendário de Treinos"
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Calendário
                </button>
              )}

              {onOpenStoriesModal && (
                <button
                  onClick={() => onOpenStoriesModal()}
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider py-2.5 px-3.5 rounded-xl shadow-md shadow-pink-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-white/10"
                  title="Compartilhar Conquistas nos Stories do Instagram"
                >
                  <Camera className="w-4 h-4 text-white" />
                  Stories
                </button>
              )}

              {onOpenShareModal && (
                <button
                  onClick={() => onOpenShareModal()}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider py-2.5 px-3.5 rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  title="Compartilhar Conquistas nas Redes Sociais"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
              )}
            </div>
          </div>
        </div>

        {checkinMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {checkinMessage}
          </motion.div>
        )}
      </div>

      {/* Badges & Achievements Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Conquistas & Medalhas Desbloqueáveis
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                {unlockedCount} / {badges.length}
              </span>
            </h4>
            <p className="text-xs text-zinc-400">Complete desafios diários para desbloquear insígnias e subir de nível</p>
          </div>

          {/* Category & Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'streak', label: '🔥 Ofensiva' },
              { id: 'workout', label: '🏋️ Treino' },
              { id: 'hydration', label: '💧 Água' },
              { id: 'evolution', label: '📈 Evolução' },
              { id: 'mastery', label: '👑 Maestria' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-xl border border-zinc-800">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${filterStatus === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('unlocked')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${filterStatus === 'unlocked' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Conquistadas
              </button>
              <button
                onClick={() => setFilterStatus('locked')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${filterStatus === 'locked' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                A Conquistar
              </button>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredBadges.map(badge => (
            <motion.button
              key={badge.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedBadge(badge)}
              className={`relative flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-purple-900/20 to-zinc-900 border-purple-500/40 shadow-lg shadow-purple-900/10 hover:border-purple-400'
                  : 'bg-zinc-900/50 border-zinc-800/80 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Badge Icon Circle */}
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 transition-all ${
                  badge.unlocked
                    ? 'bg-gradient-to-tr from-purple-600/30 to-pink-500/30 border border-purple-500/50 shadow-md shadow-purple-500/20'
                    : 'bg-zinc-800 text-zinc-500 grayscale border border-zinc-700'
                }`}
              >
                {badge.unlocked ? badge.icon : '🔒'}
              </div>

              {/* Badge Name */}
              <span className="text-xs font-black text-white line-clamp-1 mb-1">
                {badge.name}
              </span>

              {/* XP Pill */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                badge.unlocked 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                +{badge.xpReward} XP
              </span>

              {/* Progress bar if not unlocked */}
              {!badge.unlocked && (
                <div className="w-full mt-2">
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                    {badge.progress}/{badge.maxProgress}
                  </span>
                </div>
              )}

              {/* Unlocked Checkmark */}
              {badge.unlocked && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black">
                  ✓
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-950 border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative space-y-4"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800"
              >
                ✕
              </button>

              {/* Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-pink-500/30 border border-purple-500/50 flex items-center justify-center text-4xl mx-auto shadow-xl shadow-purple-600/20">
                {selectedBadge.icon}
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  selectedBadge.rarity === 'Lendário'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : selectedBadge.rarity === 'Épico'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}>
                  {selectedBadge.rarity}
                </span>
                <h3 className="text-xl font-black text-white mt-2 uppercase">
                  {selectedBadge.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              {/* Status & Reward */}
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-400">Recompensa:</span>
                <span className="text-amber-400 flex items-center gap-1 font-black">
                  <Star className="w-4 h-4 fill-amber-400" />
                  +{selectedBadge.xpReward} XP
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-400">Status:</span>
                <span className={selectedBadge.unlocked ? 'text-emerald-400' : 'text-zinc-500'}>
                  {selectedBadge.unlocked ? '✅ Desbloqueada' : `🔒 Em progresso (${selectedBadge.progress}/${selectedBadge.maxProgress})`}
                </span>
              </div>

              {/* Action */}
              {selectedBadge.unlocked && onOpenShareModal ? (
                <button
                  onClick={() => {
                    const badgeName = selectedBadge.name;
                    setSelectedBadge(null);
                    onOpenShareModal(badgeName);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar Esta Conquista
                </button>
              ) : (
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl"
                >
                  Fechar
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
