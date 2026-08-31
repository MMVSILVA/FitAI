import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trophy, Zap, Shield, Award, Flame, Target, TrendingUp, Star, Crown, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { LEVELS_CONFIG, LevelInfo } from '../constants/achievements';

interface LevelBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentXp: number;
}

export const LevelBadgeModal: React.FC<LevelBadgeModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  currentXp
}) => {
  if (!isOpen) return null;

  const getLevelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Star': return <Star className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-100 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5" />
                Sistema de Patentes e Níveis
              </div>
              <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">
                Trilha da Consistência FitAI
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ganhe XP treinando, seguindo a dieta e mantendo a constância para desbloquear novas patentes e vantagens.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Status Box */}
          <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-transparent border border-yellow-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Sua Patente Atual</p>
                <h4 className="text-lg font-black text-black dark:text-white">
                  Nível {currentLevel} • {LEVELS_CONFIG.find(l => l.level === currentLevel)?.title || 'Atleta'}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-medium">XP Total Acumulado</span>
              <p className="text-xl font-black text-yellow-600 dark:text-yellow-400">{currentXp} <span className="text-xs font-bold text-gray-400">XP</span></p>
            </div>
          </div>

          {/* Level Progression Road */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {LEVELS_CONFIG.map((lvl) => {
              const isCurrent = lvl.level === currentLevel;
              const isUnlocked = currentXp >= lvl.minXp;
              const isNext = lvl.level === currentLevel + 1;

              return (
                <div
                  key={lvl.level}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-yellow-500/10 border-yellow-500/40 shadow-lg shadow-yellow-500/5'
                      : isUnlocked
                      ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 opacity-90'
                      : isNext
                      ? 'bg-blue-500/5 border-blue-500/30'
                      : 'bg-transparent border-gray-100 dark:border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black shadow-md ${
                      isUnlocked 
                        ? `bg-gradient-to-tr ${lvl.badgeColor}` 
                        : 'bg-gray-300 dark:bg-zinc-800 text-gray-400'
                    }`}>
                      {getLevelIcon(lvl.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                          isCurrent 
                            ? 'bg-yellow-500 text-black' 
                            : isUnlocked 
                            ? 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300' 
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}>
                          Lvl {lvl.level}
                        </span>
                        <h4 className="font-bold text-sm text-black dark:text-white">
                          {lvl.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                        {lvl.perk}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                      {lvl.minXp} XP
                    </span>
                    <div className="mt-1">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                          Atual
                        </span>
                      ) : isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Conquistado
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400">
                          Faltam {Math.max(0, lvl.minXp - currentXp)} XP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
