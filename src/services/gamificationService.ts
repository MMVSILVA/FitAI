import { UserProfile } from '../types';
import { ACHIEVEMENTS_LIST, Achievement, calculateUserLevel, LevelInfo } from '../constants/achievements';

export interface EvaluatedAchievement extends Achievement {
  currentProgress: number;
  isUnlocked: boolean;
  progressPercent: number;
  unlockedAt?: string;
}

export interface GamificationSummary {
  levelInfo: ReturnType<typeof calculateUserLevel>;
  achievements: EvaluatedAchievement[];
  unlockedCount: number;
  totalCount: number;
  overallPercent: number;
  nextMilestone: EvaluatedAchievement | null;
  newlyUnlocked: EvaluatedAchievement[];
  totalXp: number;
}

export function evaluateUserGamification(profile: UserProfile | null): GamificationSummary {
  if (!profile) {
    const defaultLevel = calculateUserLevel(0);
    const evaluated = ACHIEVEMENTS_LIST.map(ach => ({
      ...ach,
      currentProgress: 0,
      isUnlocked: false,
      progressPercent: 0
    }));

    return {
      levelInfo: defaultLevel,
      achievements: evaluated,
      unlockedCount: 0,
      totalCount: evaluated.length,
      overallPercent: 0,
      nextMilestone: evaluated[0] || null,
      newlyUnlocked: [],
      totalXp: 0
    };
  }

  const rawPoints = profile.points || 0;
  const streakDays = profile.streak || 0;
  const checkInsCount = profile.checkInDates?.length || 0;
  const adherenceLogsCount = profile.adherenceLogs?.length || 0;
  const workoutSessionsCount = profile.workoutSessions?.length || checkInsCount;
  const favoritesCount = profile.favorites?.length || 0;
  const joinedChallengesCount = profile.joinedChallenges?.length || 0;
  const weightHistoryCount = profile.weightHistory?.length || (profile.weight ? 1 : 0);
  const hydrationStreak = profile.hydration?.streakDays || (profile.hydration && profile.hydration.currentMl >= profile.hydration.targetMl ? 1 : 0);
  
  const currentWeight = profile.weight || 0;
  const targetWeight = profile.targetWeight || 0;
  const reachedTargetWeight = targetWeight > 0 && Math.abs(currentWeight - targetWeight) <= 0.5;

  const previouslyUnlockedIds = new Set(profile.unlockedAchievements || []);
  const newlyUnlocked: EvaluatedAchievement[] = [];

  const evaluated: EvaluatedAchievement[] = ACHIEVEMENTS_LIST.map(ach => {
    let currentProgress = 0;

    switch (ach.id) {
      case 'first_workout':
      case 'workout_5':
      case 'workout_15':
      case 'workout_30':
      case 'workout_60':
        currentProgress = Math.max(workoutSessionsCount, checkInsCount);
        break;

      case 'diet_first':
      case 'diet_streak_3':
      case 'diet_streak_7':
      case 'diet_streak_21':
        currentProgress = adherenceLogsCount;
        break;

      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
      case 'streak_100':
        currentProgress = streakDays;
        break;

      case 'water_first':
      case 'water_streak_7':
      case 'water_streak_30':
        currentProgress = hydrationStreak;
        break;

      case 'weight_log_first':
      case 'weight_log_4':
        currentProgress = weightHistoryCount;
        break;

      case 'target_weight_reached':
        currentProgress = reachedTargetWeight ? 1 : 0;
        break;

      case 'challenge_joined':
        currentProgress = joinedChallengesCount;
        break;

      case 'favorite_3_exercises':
        currentProgress = favoritesCount;
        break;

      default:
        currentProgress = 0;
    }

    const isUnlocked = previouslyUnlockedIds.has(ach.id) || currentProgress >= ach.targetValue;
    const progressPercent = Math.min(100, Math.round((Math.min(currentProgress, ach.targetValue) / ach.targetValue) * 100));

    const item: EvaluatedAchievement = {
      ...ach,
      currentProgress: Math.min(currentProgress, ach.targetValue),
      isUnlocked,
      progressPercent
    };

    if (isUnlocked && !previouslyUnlockedIds.has(ach.id)) {
      newlyUnlocked.push(item);
    }

    return item;
  });

  const unlockedCount = evaluated.filter(a => a.isUnlocked).length;
  const totalCount = evaluated.length;
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Find the next closest milestone to unlock
  const lockedSorted = evaluated
    .filter(a => !a.isUnlocked)
    .sort((a, b) => b.progressPercent - a.progressPercent);

  const nextMilestone = lockedSorted[0] || null;
  const levelInfo = calculateUserLevel(rawPoints);

  return {
    levelInfo,
    achievements: evaluated,
    unlockedCount,
    totalCount,
    overallPercent,
    nextMilestone,
    newlyUnlocked,
    totalXp: rawPoints
  };
}
