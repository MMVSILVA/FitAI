import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Zap, Award, Star, Shield, ChevronRight, 
  Utensils, Dumbbell, Droplets, TrendingUp, CheckCircle2, 
  Filter, Sparkles, AlertCircle
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { evaluateUserGamification } from '../services/gamificationService';
import { AchievementCategory } from '../constants/achievements';
import { AchievementCard } from './AchievementCard';
import { LevelBadgeModal } from './LevelBadgeModal';

interface GamificationSectionProps {
  onOpenShareModal?: (badge?: { title: string; description: string }) => void;
  onOpenStoriesModal?: (badge?: { title: string; description: string }) => void;
}

export const GamificationSection: React.FC<GamificationSectionProps> = ({
  onOpenShareModal,
  onOpenStoriesModal
}) => {
  const { profile, claimDailyMission } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [claimingType, setClaimingType] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const gamification = evaluateUserGamification(profile);
  const { levelInfo, achievements, unlockedCount, totalCount, overallPercent, totalXp } = gamification;

  const filteredAchievements = achievements.filter(ach => {
    const matchesCategory = selectedCategory === 'all' || ach.category === selectedCategory;
    const matchesUnlocked = !filterUnlockedOnly || ach.isUnlocked;
    return matchesCategory && matchesUnlocked;
  });

  const categories: { id: AchievementCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'Todas', icon: Trophy },
    { id: 'workout', label: 'Treinos', icon: Dumbbell },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'streak', label: 'Ofensiva', icon: Flame },
    { id: 'hydration', label: 'Hidratação', icon: Droplets },
    { id: 'evolution', label: 'Evolução', icon: TrendingUp }
  ];

  const handleClaimMission = async (type: 'workout' | 'diet' | 'water' | 'weight') => {
    setClaimingType(type);
    try {
      const result = await claimDailyMission(type);
      setFeedbackToast({ message: result.message, type: 'success' });
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (e) {
      setFeedbackToast({ message: 'Erro ao registrar missão.', type: 'info' });
      setTimeout(() => setFeedbackToast(null), 3000);
    } finally {
      setClaimingType(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isWorkoutDoneToday = profile?.checkInDates?.includes(today);
  const isDietDoneToday = profile?.adherenceLogs?.some(a => a.date === today);
  const isWaterDoneToday = profile?.hydration?.date === today && (profile.hydration.currentMl >= (profile.hydration.targetMl || 2500));
  const isWeightDoneToday = profile?.weightHistory?.some(w => w.date === today);

  const streakDays = profile?.streak || 0;
  const streakMultiplier = streakDays >= 30 ? '1.5x' : streakDays >= 14 ? '1.3x' : streakDays >= 7 ? '1.2x' : streakDays >= 3 ? '1.1x' : '1.0x';

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-black/90 dark:bg-white text-white dark:text-black px-5 py-3 rounded-2xl shadow-2xl border border-yellow-500/40 flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="w-5 h-5 text-yellow-400 dark:text-yellow-600 shrink-0" />
            <p className="text-xs font-bold">{feedbackToast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Gamification Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Level Progression Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-yellow-500/20">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${levelInfo.currentLevel.badgeColor} flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 shrink-0`}>
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
                    Nível {levelInfo.currentLevel.level}
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {totalXp} XP Total
                  </span>
                </div>
                <h3 className="text-2xl font-black text-black dark:text-white mt-1">
                  {levelInfo.currentLevel.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setShowLevelModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"
            >
              Ver Patentes
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-gray-400">
                Progresso para o {levelInfo.nextLevel ? `Nível ${levelInfo.nextLevel.level} (${levelInfo.nextLevel.title})` : 'Nível Máximo'}
              </span>
              <span className="font-black text-yellow-600 dark:text-yellow-400">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpForNextLevel || levelInfo.xpInCurrentLevel} XP ({levelInfo.progressPercent}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden p-0.5 border border-yellow-500/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 shadow-sm shadow-yellow-500/50"
              />
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {levelInfo.nextLevel ? (
                <>Faltam <span className="font-bold text-black dark:text-white">{Math.max(0, levelInfo.xpForNextLevel - levelInfo.xpInCurrentLevel)} XP</span> para subir de nível e desbloquear novas vantagens.</>
              ) : (
                'Parabéns! Você alcançou a patente máxima de Imortal do Olimpo!'
              )}
            </p>
          </div>
        </div>

        {/* Streak & Consistency Card */}
        <div className="bg-gradient-to-br from-orange-500/15 via-red-500/10 to-transparent border border-orange-500/30 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                Ofensiva de Consistência
              </p>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-500 border border-orange-500/30">
                Bônus {streakMultiplier}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <h4 className="text-4xl font-black text-black dark:text-white">
                {streakDays}
              </h4>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                {streakDays === 1 ? 'Dia Seguido' : 'Dias Seguidos'} 🔥
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {streakDays > 0 
                ? 'Mantenha sua disciplina diária nos treinos e alimentação para multiplicar seus pontos.' 
                : 'Faça seu check-in hoje para iniciar sua sequência de consistência!'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-orange-500/20 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-500">Conquistas Desbloqueadas</span>
            <span className="font-black text-orange-600 dark:text-orange-400">
              {unlockedCount} de {totalCount} ({overallPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Missões Diárias de Consistência (Quick Action Hub) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <Zap className="w-4 h-4" />
              Missões Diárias de Consistência
            </div>
            <h3 className="text-xl font-black text-black dark:text-white">
              Ganhe XP Hoje e Suba de Nível
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Renovam diariamente às 00:00
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mission 1: Workout */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            isWorkoutDoneToday 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +100 XP
                </span>
              </div>
              <h5 className="font-bold text-sm text-black dark:text-white">Treino do Dia</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Conclua uma sessão de treino.</p>
            </div>

            <button
              onClick={() => handleClaimMission('workout')}
              disabled={claimingType === 'workout'}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isWorkoutDoneToday
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
              }`}
            >
              {isWorkoutDoneToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Concluído
                </>
              ) : claimingType === 'workout' ? (
                'Gravando...'
              ) : (
                'Fazer Check-in'
              )}
            </button>
          </div>

          {/* Mission 2: Diet */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            isDietDoneToday 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +60 XP
                </span>
              </div>
              <h5 className="font-bold text-sm text-black dark:text-white">Foco na Dieta</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Siga suas refeições planejadas.</p>
            </div>

            <button
              onClick={() => handleClaimMission('diet')}
              disabled={claimingType === 'diet'}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isDietDoneToday
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              {isDietDoneToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Registrado
                </>
              ) : claimingType === 'diet' ? (
                'Gravando...'
              ) : (
                'Registrar Dieta'
              )}
            </button>
          </div>

          {/* Mission 3: Water */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            isWaterDoneToday 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +40 XP
                </span>
              </div>
              <h5 className="font-bold text-sm text-black dark:text-white">Meta de Água</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bata sua meta de hidratação.</p>
            </div>

            <button
              onClick={() => handleClaimMission('water')}
              disabled={claimingType === 'water'}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isWaterDoneToday
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95'
              }`}
            >
              {isWaterDoneToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Meta Atingida
                </>
              ) : claimingType === 'water' ? (
                'Gravando...'
              ) : (
                'Bater Meta'
              )}
            </button>
          </div>

          {/* Mission 4: Weight */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            isWeightDoneToday 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +75 XP
                </span>
              </div>
              <h5 className="font-bold text-sm text-black dark:text-white">Acompanhar Peso</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registre seu peso corporal.</p>
            </div>

            <button
              onClick={() => handleClaimMission('weight')}
              disabled={claimingType === 'weight'}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isWeightDoneToday
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 active:scale-95'
              }`}
            >
              {isWeightDoneToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pesagem Salva
                </>
              ) : claimingType === 'weight' ? (
                'Gravando...'
              ) : (
                'Registrar Peso'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Galeria de Conquistas (Achievements Gallery) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-1">
              <Award className="w-4 h-4" />
              Galeria de Conquistas
            </div>
            <h3 className="text-2xl font-black text-black dark:text-white">
              Insígnias & Medalhas de Dedicação
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Desbloqueie marcos para comprovar sua consistência e compartilhar nas suas redes sociais.
            </p>
          </div>

          {/* Toggle Unlocked Only */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setFilterUnlockedOnly(!filterUnlockedOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterUnlockedOnly
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {filterUnlockedOnly ? '★ Apenas Desbloqueadas' : 'Ver Todas'}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onShare={(badge) => {
                  if (onOpenStoriesModal) {
                    onOpenStoriesModal({
                      title: badge.title,
                      description: `Desbloqueei a conquista "${badge.title}" (+${badge.xp} XP) no FitAI!`
                    });
                  } else if (onOpenShareModal) {
                    onOpenShareModal({
                      title: badge.title,
                      description: `Desbloqueei a conquista "${badge.title}" no FitAI!`
                    });
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-8">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">Nenhuma conquista encontrada neste filtro</h4>
            <p className="text-xs text-gray-400 mt-1">Experimente alternar os filtros para ver outras categorias.</p>
          </div>
        )}
      </div>

      {/* Level Info Modal */}
      <LevelBadgeModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentLevel={levelInfo.currentLevel.level}
        currentXp={totalXp}
      />
    </div>
  );
};
