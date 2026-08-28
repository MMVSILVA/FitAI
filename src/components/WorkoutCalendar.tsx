import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, 
  Clock, Dumbbell, Flame, Droplets, Trophy, Info, X, Edit3, 
  Sparkles, Check, ArrowRight
} from 'lucide-react';
import { UserProfile, WorkoutPlan, WorkoutDay } from '../types';
import { useUser } from '../store/userStore';

interface WorkoutCalendarProps {
  onSelectDayIndex?: (dayIdx: number) => void;
  onOpenShareModal?: () => void;
}

export function WorkoutCalendar({
  onSelectDayIndex,
  onOpenShareModal
}: WorkoutCalendarProps) {
  const { profile, plan, toggleWorkoutDayCheck } = useUser();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Map workout days to day-of-week
  // By default, day 0 -> Monday (1), day 1 -> Tuesday (2), day 2 -> Wednesday (3), etc.
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Padding for days before the first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isPadding: true, dayNum: 0, dateStr: '', fullDate: null });
    }

    const checkInDates = profile?.checkInDates || [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= totalDays; day++) {
      const fullDate = new Date(year, month, day);
      const dateStr = fullDate.toISOString().split('T')[0];
      const dayOfWeek = fullDate.getDay(); // 0 = Sun, 1 = Mon...
      
      const isPast = fullDate < new Date(todayStr + 'T00:00:00');
      const isToday = dateStr === todayStr;
      const isFuture = fullDate > new Date(todayStr + 'T23:59:59');

      // Check-in or completed workout recorded on this date
      const isCheckedIn = checkInDates.includes(dateStr);

      // Scheduled workout calculation based on plan days
      // If plan has days, map Monday(1) to index 0, Tuesday(2) to index 1, etc.
      let scheduledDayIdx: number | null = null;
      let scheduledDayData: WorkoutDay | null = null;

      if (plan?.days && plan.days.length > 0) {
        // Map Monday (1) to 0, Tuesday (2) to 1, ..., Friday (5) to 4
        if (dayOfWeek >= 1 && dayOfWeek <= plan.days.length) {
          scheduledDayIdx = dayOfWeek - 1;
          scheduledDayData = plan.days[scheduledDayIdx];
        }
      }

      // Is completed if it was checked in or marked in plan
      const isCompleted = isCheckedIn || (scheduledDayData?.isCompleted && (isPast || isToday));

      days.push({
        isPadding: false,
        dayNum: day,
        dateStr,
        fullDate,
        dayOfWeek,
        isPast,
        isToday,
        isFuture,
        isCheckedIn,
        scheduledDayIdx,
        scheduledDayData,
        isCompleted
      });
    }

    return days;
  }, [currentDate, profile?.checkInDates, plan?.days]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    const activeDays = daysInMonth.filter(d => !d.isPadding && d.isCompleted).length;
    const totalScheduled = daysInMonth.filter(d => !d.isPadding && d.scheduledDayData && (d.isPast || d.isToday)).length;
    const rate = totalScheduled > 0 ? Math.min(100, Math.round((activeDays / totalScheduled) * 100)) : 100;

    return {
      completedCount: activeDays,
      scheduledCount: totalScheduled,
      adherenceRate: rate
    };
  }, [daysInMonth]);

  // Selected date info
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return daysInMonth.find(d => !d.isPadding && d.dateStr === dateStr) || null;
  }, [selectedDate, daysInMonth]);

  const handleDateClick = (dayObj: any) => {
    if (dayObj.isPadding) return;
    setSelectedDate(dayObj.fullDate);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Card Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Calendário de Treinos & Frequência
              </h3>
              <p className="text-xs text-zinc-400">Histórico de sessões executadas e treinos agendados</p>
            </div>
          </div>

          {/* Month controls & Today button */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all"
            >
              Hoje
            </button>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-black uppercase text-white tracking-wider">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Month Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Treinos Realizados
            </span>
            <div className="text-xl font-black text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {monthlyStats.completedCount} dias
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Taxa de Adesão
            </span>
            <div className="text-xl font-black text-purple-400 flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-purple-400" />
              {monthlyStats.adherenceRate}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Ofensiva Ativa
            </span>
            <div className="text-xl font-black text-amber-400 flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              {profile?.streak || 0} dias
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Divisão no Plano
            </span>
            <div className="text-xl font-black text-cyan-400 flex items-center gap-1.5">
              <Dumbbell className="w-5 h-5 text-cyan-400" />
              {plan?.days?.length || 5}x semana
            </div>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Treino Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
            <span>Treino Agendado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span>Dia de Descanso</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
              <div key={idx} className="py-1 text-[11px] font-black uppercase tracking-wider text-zinc-500">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysInMonth.map((dayObj, idx) => {
              if (dayObj.isPadding) {
                return (
                  <div key={`cal-pad-${idx}`} className="h-16 sm:h-22 rounded-2xl bg-zinc-900/10 border border-transparent" />
                );
              }

              const isSelected = selectedDate && dayObj.dateStr === selectedDate.toISOString().split('T')[0];

              return (
                <motion.button
                  key={`cal-day-${dayObj.dateStr || idx}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDateClick(dayObj)}
                  className={`h-16 sm:h-22 rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between text-left transition-all relative border ${
                    isSelected
                      ? 'ring-2 ring-purple-500 bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/30'
                      : dayObj.isToday
                      ? 'border-purple-500/80 bg-purple-900/20'
                      : dayObj.isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                      : dayObj.scheduledDayData
                      ? 'bg-zinc-900/70 border-zinc-800 hover:border-purple-500/40'
                      : 'bg-zinc-900/30 border-zinc-800/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Top Day Number & Badges */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-black ${
                      dayObj.isToday 
                        ? 'text-purple-400' 
                        : dayObj.isCompleted 
                        ? 'text-emerald-400' 
                        : 'text-zinc-300'
                    }`}>
                      {dayObj.dayNum}
                    </span>

                    {dayObj.isToday && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-500 text-white uppercase tracking-tighter">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Bottom Day Status Indicator */}
                  <div className="w-full truncate">
                    {dayObj.isCompleted ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 truncate">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {dayObj.scheduledDayData?.focus || 'Concluído'}
                        </span>
                      </div>
                    ) : dayObj.scheduledDayData ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300 truncate">
                        <Dumbbell className="w-3 h-3 shrink-0 text-purple-400" />
                        <span className="hidden sm:inline truncate">
                          {dayObj.scheduledDayData.focus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-zinc-600 font-medium hidden sm:inline">
                        Descanso
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Inspector Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedDayInfo && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                    Detalhes do Dia
                  </span>
                  <h3 className="text-lg font-black text-white capitalize">
                    {selectedDayInfo.fullDate?.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workout details if scheduled */}
              {selectedDayInfo.scheduledDayData ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    selectedDayInfo.isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-purple-950/30 border-purple-500/40 text-purple-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedDayInfo.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {selectedDayInfo.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase text-white">
                          {selectedDayInfo.scheduledDayData.day} • {selectedDayInfo.scheduledDayData.focus}
                        </h4>
                        <span className="text-xs font-medium">
                          {selectedDayInfo.isCompleted ? 'Sessão concluída com sucesso!' : 'Treino programado para esta rotina'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Exercícios do Treino ({selectedDayInfo.scheduledDayData.exercises?.length || 0})
                    </h5>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedDayInfo.scheduledDayData.exercises?.map((ex, exIdx) => (
                        <div 
                          key={exIdx} 
                          className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{ex.name}</span>
                            <span className="text-zinc-400 text-[11px]">
                              {ex.sets || 3} séries × {ex.reps} reps {ex.weight ? `• ${ex.weight}` : ''}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                            {ex.rest || '60s'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User workout notes/reports if any */}
                  {selectedDayInfo.scheduledDayData.workoutReports && selectedDayInfo.scheduledDayData.workoutReports.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                      <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        Relatórios Registrados
                      </span>
                      {selectedDayInfo.scheduledDayData.workoutReports.map(rep => (
                        <p key={rep.id} className="text-xs text-zinc-300 italic border-l-2 border-purple-500 pl-2">
                          "{rep.text}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-white text-sm uppercase">Dia de Descanso / Livre</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Nenhum treino prescrito para este dia. Aproveite para recuperação muscular e manter a hidratação!
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-zinc-800">
                {selectedDayInfo.scheduledDayIdx !== null && onSelectDayIndex && (
                  <button
                    onClick={() => {
                      setIsDetailOpen(false);
                      onSelectDayIndex(selectedDayInfo.scheduledDayIdx!);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                    Ver Ficha deste Treino
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {selectedDayInfo.scheduledDayIdx !== null && (
                  <button
                    onClick={async () => {
                      await toggleWorkoutDayCheck(selectedDayInfo.scheduledDayIdx!);
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {selectedDayInfo.isCompleted ? 'Desmarcar' : 'Concluir'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
