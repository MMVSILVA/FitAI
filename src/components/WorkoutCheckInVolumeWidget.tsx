import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Award, 
  ChevronRight, 
  Plus, 
  Minus, 
  Save, 
  Share2, 
  Camera, 
  Check, 
  BarChart3, 
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { Exercise, WorkoutDay } from '../types';

interface WorkoutCheckInVolumeWidgetProps {
  onOpenShareStories?: (badge?: { title: string; description: string; metric?: string; metricLabel?: string }) => void;
  onOpenShareModal?: (badge?: { title: string; description: string; metric?: string; metricLabel?: string }) => void;
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const WorkoutCheckInVolumeWidget: React.FC<WorkoutCheckInVolumeWidgetProps> = ({
  onOpenShareStories,
  onOpenShareModal,
  onNavigateTab,
  className = ''
}) => {
  const { 
    plan, 
    profile, 
    doCheckIn, 
    updateExerciseWeight, 
    toggleWorkoutDayCheck, 
    isViewingAs 
  } = useUser();

  // Find recommended or active day
  const defaultDayIndex = useMemo(() => {
    if (!plan?.days || plan.days.length === 0) return 0;
    const firstIncomplete = plan.days.findIndex(d => !d.isCompleted);
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  }, [plan?.days]);

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(defaultDayIndex);
  
  // Local state for completed exercises (keys: "dayIdx-exIdx")
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (plan?.days) {
      plan.days.forEach((day, dIdx) => {
        day.exercises.forEach((ex, eIdx) => {
          if (ex.done) {
            initial[`${dIdx}-${eIdx}`] = true;
          }
        });
      });
    }
    return initial;
  });

  // Local state for live edited weights for instant feedback
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [justCompletedWorkout, setJustCompletedWorkout] = useState(false);

  const activeDay: WorkoutDay | undefined = plan?.days?.[selectedDayIdx];

  // Helper to extract clean numeric reps
  const parseReps = (repsStr?: string | number): number => {
    if (!repsStr) return 10;
    if (typeof repsStr === 'number') return repsStr;
    const match = repsStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 10;
  };

  // Helper to extract clean numeric weight in kg
  const parseWeight = (weightStr?: string, key?: string): number => {
    if (key && customWeights[key] !== undefined) {
      return customWeights[key];
    }
    if (!weightStr) return 20; // default estimated working weight
    const num = parseFloat(weightStr.replace(',', '.').replace(/[^\d.]/g, ''));
    return isNaN(num) || num <= 0 ? 20 : num;
  };

  const handleToggleExercise = (dayIdx: number, exIdx: number) => {
    const key = `${dayIdx}-${exIdx}`;
    const nextState = !completedExercises[key];
    setCompletedExercises(prev => ({ ...prev, [key]: nextState }));
  };

  const handleWeightAdjust = (dayIdx: number, exIdx: number, currentWeight: number, delta: number) => {
    const key = `${dayIdx}-${exIdx}`;
    const newWeight = Math.max(0, Math.round((currentWeight + delta) * 10) / 10);
    setCustomWeights(prev => ({ ...prev, [key]: newWeight }));
    updateExerciseWeight(dayIdx, exIdx, `${newWeight}kg`);
  };

  const handleWeightInputChange = (dayIdx: number, exIdx: number, valueStr: string) => {
    const key = `${dayIdx}-${exIdx}`;
    const num = parseFloat(valueStr.replace(',', '.'));
    if (!isNaN(num)) {
      setCustomWeights(prev => ({ ...prev, [key]: num }));
      updateExerciseWeight(dayIdx, exIdx, `${num}kg`);
    }
  };

  // Calculate stats for current selected workout day
  const currentDayStats = useMemo(() => {
    if (!activeDay) return { totalExercises: 0, completedCount: 0, dayVolumeKg: 0, percentDone: 0 };
    
    let completedCount = 0;
    let dayVolumeKg = 0;

    activeDay.exercises.forEach((ex, eIdx) => {
      const key = `${selectedDayIdx}-${eIdx}`;
      const isDone = !!completedExercises[key];
      if (isDone) completedCount++;

      const sets = ex.sets || 3;
      const reps = parseReps(ex.reps);
      const weight = parseWeight(ex.weight, key);

      // Volume = sets * reps * weight
      const exerciseVolume = sets * reps * weight;
      if (isDone) {
        dayVolumeKg += exerciseVolume;
      }
    });

    const totalExercises = activeDay.exercises.length;
    const percentDone = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

    return { totalExercises, completedCount, dayVolumeKg, percentDone };
  }, [activeDay, completedExercises, customWeights, selectedDayIdx]);

  // Calculate weekly volume progression across all workout days in the plan
  const weeklyVolumeStats = useMemo(() => {
    if (!plan?.days || plan.days.length === 0) {
      return {
        totalWeeklyVolumeKg: 0,
        completedWeeklyVolumeKg: 0,
        estimatedGoalVolumeKg: 12000,
        dayVolumes: [] as { day: string; focus: string; volumeKg: number; isCompleted: boolean; isCurrent: boolean }[]
      };
    }

    let completedWeeklyVolumeKg = 0;
    let totalPotentialWeeklyVolumeKg = 0;

    const dayVolumes = plan.days.map((day, dIdx) => {
      let dayVolume = 0;
      day.exercises.forEach((ex, eIdx) => {
        const key = `${dIdx}-${eIdx}`;
        const isDone = !!completedExercises[key] || day.isCompleted;
        const sets = ex.sets || 3;
        const reps = parseReps(ex.reps);
        const weight = parseWeight(ex.weight, key);
        const exVol = sets * reps * weight;
        
        totalPotentialWeeklyVolumeKg += exVol;
        if (isDone) {
          dayVolume += exVol;
        }
      });

      completedWeeklyVolumeKg += dayVolume;

      return {
        day: day.day,
        focus: day.focus,
        volumeKg: dayVolume,
        isCompleted: day.isCompleted || (day.exercises.length > 0 && day.exercises.every((_, eIdx) => completedExercises[`${dIdx}-${eIdx}`])),
        isCurrent: dIdx === selectedDayIdx
      };
    });

    const estimatedGoalVolumeKg = Math.max(totalPotentialWeeklyVolumeKg, 8000);

    return {
      totalWeeklyVolumeKg: totalPotentialWeeklyVolumeKg,
      completedWeeklyVolumeKg,
      estimatedGoalVolumeKg,
      dayVolumes
    };
  }, [plan?.days, completedExercises, customWeights, selectedDayIdx]);

  const handleMarkAllExercises = (done: boolean) => {
    if (!activeDay) return;
    const nextMap = { ...completedExercises };
    activeDay.exercises.forEach((_, eIdx) => {
      nextMap[`${selectedDayIdx}-${eIdx}`] = done;
    });
    setCompletedExercises(nextMap);
  };

  const handleFinishDayAndCheckIn = async () => {
    if (!activeDay) return;
    setSavingFeedback(true);

    // Mark all remaining exercises as completed
    handleMarkAllExercises(true);

    // Mark day completed in store if not yet
    if (!activeDay.isCompleted) {
      toggleWorkoutDayCheck(selectedDayIdx);
    }

    // Trigger streak check-in
    try {
      doCheckIn();
    } catch {
      // Ignore if already checked in today
    }

    setJustCompletedWorkout(true);
    setSavingFeedback(false);

    setTimeout(() => {
      setJustCompletedWorkout(false);
    }, 4000);
  };

  if (!plan || !plan.days || plan.days.length === 0) {
    return null;
  }

  return (
    <div id="workout-checkin-volume-widget" className={`space-y-6 ${className}`}>
      {/* Header Container */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Dumbbell className="w-32 h-32 text-purple-600 dark:text-purple-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Check-in de Treino & Carga
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                <Flame className="w-3 h-3" /> Ofensiva {profile?.streak || 0}d
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
              Registro de Exercícios & Volume Semanal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Marque as séries realizadas, ajuste o peso e acompanhe a tonelagem total levantada na semana.
            </p>
          </div>

          {/* Quick Action Share & PDF */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenShareStories && (
              <button
                onClick={() => {
                  onOpenShareStories({
                    title: 'Check-in de Treino',
                    description: `Volume total de ${weeklyVolumeStats.completedWeeklyVolumeKg.toLocaleString('pt-BR')} kg levantados!`,
                    metric: `${weeklyVolumeStats.completedWeeklyVolumeKg.toLocaleString('pt-BR')} kg`,
                    metricLabel: 'Volume Semanal'
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-pink-600/25 flex items-center gap-2 active:scale-95 border border-white/10"
                title="Compartilhar nos Stories do Instagram"
              >
                <Camera className="w-4 h-4" />
                Stories
              </button>
            )}
            {onOpenShareModal && (
              <button
                onClick={() => {
                  onOpenShareModal({
                    title: 'Check-in de Treino',
                    description: `Volume acumulado de ${weeklyVolumeStats.completedWeeklyVolumeKg.toLocaleString('pt-BR')} kg`,
                    metric: `${weeklyVolumeStats.completedWeeklyVolumeKg.toLocaleString('pt-BR')} kg`,
                    metricLabel: 'Volume Semanal'
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            )}
          </div>
        </div>

        {/* Weekly Tonnage / Volume Overview Bar & Metric */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-600/5 dark:bg-purple-600/10 border border-purple-500/20 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                <span>Volume Levantado</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
                {weeklyVolumeStats.completedWeeklyVolumeKg.toLocaleString('pt-BR')} <span className="text-sm font-bold text-gray-500">kg</span>
              </p>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span>Progresso Semanal</span>
                <span>{Math.round((weeklyVolumeStats.completedWeeklyVolumeKg / Math.max(1, weeklyVolumeStats.estimatedGoalVolumeKg)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.round((weeklyVolumeStats.completedWeeklyVolumeKg / Math.max(1, weeklyVolumeStats.estimatedGoalVolumeKg)) * 100))}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">
                <span>Sessão Atual ({activeDay?.day})</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
                {currentDayStats.dayVolumeKg.toLocaleString('pt-BR')} <span className="text-sm font-bold text-gray-500">kg</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-3">
              {currentDayStats.completedCount} de {currentDayStats.totalExercises} exercícios concluídos hoje ({currentDayStats.percentDone}%).
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">
                <span>Status da Ficha</span>
                <Award className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
                {plan.days.filter(d => d.isCompleted).length} / {plan.days.length} <span className="text-xs font-bold text-gray-500">treinos semanais</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-3">
              {plan.days.every(d => d.isCompleted) 
                ? '🎉 Semana 100% concluída! Excelente consistência!' 
                : 'Mantenha o ritmo para fechar todas as sessões da semana.'}
            </p>
          </div>
        </div>

        {/* Weekly Day-by-Day Volume Breakdown Chart */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Volume de Carga por Dia da Semana
            </h4>
            <span className="text-[11px] font-bold text-gray-400">
              Total estimado: {weeklyVolumeStats.totalWeeklyVolumeKg.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weeklyVolumeStats.dayVolumes.map((item, idx) => {
              const maxVol = Math.max(...weeklyVolumeStats.dayVolumes.map(d => d.volumeKg), 1);
              const heightPercent = Math.max(15, Math.round((item.volumeKg / maxVol) * 100));

              return (
                <button
                  key={`day-vol-${idx}`}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] ${
                    item.isCurrent
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20 ring-2 ring-purple-500/20'
                      : item.isCompleted
                      ? 'bg-green-500/10 border-green-500/30 text-black dark:text-white'
                      : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${item.isCurrent ? 'text-purple-100' : 'text-gray-500'}`}>
                      {item.day}
                    </span>
                    {item.isCompleted && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${item.isCurrent ? 'text-white' : 'text-green-500'}`} />
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <p className={`text-xs font-black truncate ${item.isCurrent ? 'text-white' : 'text-black dark:text-white'}`}>
                      {item.volumeKg > 0 ? `${item.volumeKg.toLocaleString('pt-BR')} kg` : '0 kg'}
                    </p>
                    <p className={`text-[9px] truncate font-medium ${item.isCurrent ? 'text-purple-200' : 'text-gray-400'}`}>
                      {item.focus}
                    </p>
                  </div>

                  {/* Tiny bar indicator */}
                  <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.isCurrent ? 'bg-white' : item.isCompleted ? 'bg-green-500' : 'bg-purple-500'}`}
                      style={{ width: `${item.volumeKg > 0 ? heightPercent : 0}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Workout Day Checklist & Live Check-in Container */}
      {activeDay && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  {activeDay.day}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-xs font-bold text-gray-500">
                  {activeDay.exercises.length} Exercícios
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
                {activeDay.focus}
              </h3>
            </div>

            {/* Quick Bulk Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAllExercises(true)}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-purple-600/10 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => handleMarkAllExercises(false)}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-red-500/10 text-gray-700 dark:text-gray-300 hover:text-red-500 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Desmarcar
              </button>
            </div>
          </div>

          {/* List of Exercises with Completion Checkboxes and Weight Adjusters */}
          <div className="space-y-3">
            {activeDay.exercises.map((exercise, eIdx) => {
              const key = `${selectedDayIdx}-${eIdx}`;
              const isChecked = !!completedExercises[key];
              const workingWeight = parseWeight(exercise.weight, key);
              const sets = exercise.sets || 3;
              const reps = parseReps(exercise.reps);
              const exerciseVolume = sets * reps * workingWeight;

              return (
                <motion.div 
                  key={`checkin-ex-${key}`}
                  layout
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isChecked
                      ? 'bg-purple-600/5 dark:bg-purple-950/20 border-purple-500/40 shadow-sm'
                      : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Checkbox + Exercise info */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleExercise(selectedDayIdx, eIdx)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                          isChecked
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                            : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-400 hover:border-purple-500'
                        }`}
                        title={isChecked ? 'Desmarcar exercício' : 'Marcar exercício como concluído'}
                      >
                        {isChecked ? <Check className="w-5 h-5 stroke-[3]" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base font-black tracking-tight truncate ${
                            isChecked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-black dark:text-white'
                          }`}>
                            {exercise.name}
                          </h4>
                          {exercise.equipment && (
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 uppercase">
                              {exercise.equipment}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <span className="font-bold text-black dark:text-white">{sets} séries</span>
                          <span>•</span>
                          <span>{exercise.reps} reps</span>
                          <span>•</span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            Descanso {exercise.rest || '60s'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Load Adjuster & Volume Calculation */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-white/5">
                      {/* Weight Controller */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 px-2 py-1 rounded-xl shadow-inner">
                        <button
                          type="button"
                          onClick={() => handleWeightAdjust(selectedDayIdx, eIdx, workingWeight, -2.5)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all active:scale-95"
                          title="Diminuir 2.5 kg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="flex items-center px-1">
                          <input 
                            type="text"
                            value={workingWeight}
                            onChange={(e) => handleWeightInputChange(selectedDayIdx, eIdx, e.target.value)}
                            className="w-12 text-center bg-transparent text-sm font-black text-black dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-bold text-gray-400">kg</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleWeightAdjust(selectedDayIdx, eIdx, workingWeight, +2.5)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all active:scale-95"
                          title="Aumentar 2.5 kg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Exercise Volume Output */}
                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-black text-black dark:text-white">
                          {exerciseVolume.toLocaleString('pt-BR')} kg
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                          Vol. Total
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Action: Finalize Workout & Check-In */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Volume acumulado nesta sessão: <strong className="text-black dark:text-white">{currentDayStats.dayVolumeKg.toLocaleString('pt-BR')} kg</strong></span>
            </div>

            <button
              type="button"
              onClick={handleFinishDayAndCheckIn}
              disabled={savingFeedback || isViewingAs}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2.5 active:scale-95 ${
                justCompletedWorkout
                  ? 'bg-green-500 text-white shadow-green-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {justCompletedWorkout ? 'Treino & Check-in Salvo! 🔥' : 'Concluir Treino & Fazer Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
