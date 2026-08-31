import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Award, Flame, Zap, Shield, Star, Crown, Sparkles, 
  Target, TrendingUp, Droplets, Droplet, Utensils, Dumbbell, Activity, 
  CheckCircle2, Lock, Share2
} from 'lucide-react';
import { EvaluatedAchievement } from '../services/gamificationService';

interface AchievementCardProps {
  achievement: EvaluatedAchievement;
  onShare?: (badge: { title: string; description: string; xp: number }) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onShare
}) => {
  const getIcon = (iconName: string) => {
    const props = { className: "w-5 h-5" };
    switch (iconName) {
      case 'Dumbbell': return <Dumbbell {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'Utensils': return <Utensils {...props} />;
      case 'Target': return <Target {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Droplets': return <Droplets {...props} />;
      case 'Droplet': return <Droplet {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      default: return <Award {...props} />;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'Bronze';
      case 'silver': return 'Prata';
      case 'gold': return 'Ouro';
      case 'diamond': return 'Diamante';
      case 'legendary': return 'Lendário';
      default: return tier;
    }
  };

  const getTierBadgeStyle迷 = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-900/30 text-amber-500 border-amber-600/30';
      case 'silver': return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'diamond': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'legendary': return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between overflow-hidden group ${
        achievement.isUnlocked
          ? `bg-white dark:bg-zinc-900 ${achievement.badgeBorder} shadow-lg shadow-black/5 dark:shadow-black/40`
          : 'bg-gray-50/60 dark:bg-zinc-900/40 border-gray-200 dark:border-white/5 opacity-80'
      }`}
    >
      {/* Background ambient glow if unlocked */}
      {achievement.isUnlocked && (
        <div 
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity group-hover:opacity-60"
          style={{ background: achievement.glowColor }}
        />
      )}

      {/* Card Header: Icon + Tier + Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${
              achievement.isUnlocked
                ? `bg-gradient-to-tr ${achievement.badgeGradient}`
                : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
            }`}>
              {getIcon(achievement.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTierBadgeStyle迷(achievement.tier)}`}>
                  {getTierLabel(achievement.tier)}
                </span>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  +{achievement.xpReward} XP
                </span>
              </div>
              <h4 className="font-black text-base text-black dark:text-white mt-1 leading-snug">
                {achievement.title}
              </h4>
            </div>
          </div>

          {achievement.isUnlocked ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0" title="Conquista Desbloqueada">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/10 flex items-center justify-center text-gray-400 shrink-0" title="Bloqueada">
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed min-h-[32px]">
          {achievement.description}
        </p>
      </div>

      {/* Footer: Progress bar + Share button */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-bold text-gray-500 dark:text-gray-400">
            Progresso
          </span>
          <span className="font-black text-black dark:text-white">
            {achievement.currentProgress} / {achievement.targetValue} {achievement.unit} ({achievement.progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${achievement.progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${
              achievement.isUnlocked
                ? `bg-gradient-to-r ${achievement.badgeGradient}`
                : 'bg-blue-500'
            }`}
          />
        </div>

        {/* Action button if unlocked */}
        {achievement.isUnlocked && onShare && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onShare({
                title: achievement.title,
                description: achievement.description,
                xp: achievement.xpReward
              })}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <Share2 className="w-3 h-3" />
              Compartilhar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
