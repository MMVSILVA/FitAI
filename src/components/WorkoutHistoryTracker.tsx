import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Dumbbell, 
  Clock, 
  Flame, 
  Trophy, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  Share2, 
  X, 
  Check, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

export interface WorkoutHistorySession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  focus?: string;
  durationMinutes: number;
  exercisesCompleted?: number;
  totalVolumeKg?: number;
  exercises?: {
    name: string;
    sets?: number;
    reps?: string;
    weightKg?: number;
  }[];
  notes?: string;
  intensity?: 'leve' | 'moderado' | 'intenso';
}

interface WorkoutHistoryTrackerProps {
  targetUserId?: string;
  onOpenShareModal?: (badge?: string) => void;
  className?: string;
}

export function WorkoutHistoryTracker({
  targetUserId,
  onOpenShareModal,
  className = ''
}: WorkoutHistoryTrackerProps) {
  const { user, profile, plan, saveWorkoutSession } = useUser();
  const effectiveUserId = targetUserId || user?.uid;

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [sessions, setSessions] = useState<WorkoutHistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<WorkoutHistorySession | null>(null);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState('50');
  const [newVolume, setNewVolume] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newIntensity, setNewIntensity] = useState<'leve' | 'moderado' | 'intenso'>('intenso');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener for workout sessions
  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'workout_sessions'),
      where('userId', '==', effectiveUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: WorkoutHistorySession[] = snapshot.docs.map(d => {
        const data = d.data();
        const rawDate = data.completedAt ? data.completedAt.split('T')[0] : (data.date || new Date().toISOString().split('T')[0]);
        const dur = data.durationSeconds ? Math.round(data.durationSeconds / 60) : (Number(data.durationMinutes) || 45);
        return {
          id: d.id,
          date: rawDate,
          title: data.exerciseName || data.title || 'Sessão de Treino',
          focus: data.focus || data.muscleGroup || '',
          durationMinutes: dur,
          exercisesCompleted: data.exercisesCompleted || (data.laps ? data.laps.length : (data.exercises ? data.exercises.length : 6)),
          totalVolumeKg: Number(data.totalVolumeKg) || undefined,
          exercises: data.exercises || [],
          notes: data.notes || '',
          intensity: data.intensity || 'intenso'
        };
      });

      // Merge with profile.workoutSessions and checkInDates if not in collection
      const mergedMap = new Map<string, WorkoutHistorySession>();
      items.forEach(item => mergedMap.set(item.id, item));

      if (profile?.workoutSessions && Array.isArray(profile.workoutSessions)) {
        profile.workoutSessions.forEach(ws => {
          const rawDate = ws.completedAt ? ws.completedAt.split('T')[0] : new Date().toISOString().split('T')[0];
          const dur = ws.durationSeconds ? Math.round(ws.durationSeconds / 60) : 45;
          const id = ws.id || `profile-${rawDate}-${ws.exerciseName}`;
          if (!mergedMap.has(id)) {
            mergedMap.set(id, {
              id,
              date: rawDate,
              title: ws.exerciseName || 'Treino Concluído',
              durationMinutes: dur,
              exercisesCompleted: ws.laps ? ws.laps.length : 5,
              notes: ws.notes || '',
              intensity: 'intenso'
            });
          }
        });
      }

      // CheckInDates fallback
      if (profile?.checkInDates && Array.isArray(profile.checkInDates)) {
        profile.checkInDates.forEach((chkDate, idx) => {
          const id = `checkin-${chkDate}`;
          if (!Array.from(mergedMap.values()).some(s => s.date === chkDate)) {
            mergedMap.set(id, {
              id,
              date: chkDate,
              title: `Treino Concluído #${profile.checkInDates!.length - idx}`,
              durationMinutes: 50,
              exercisesCompleted: 6,
              totalVolumeKg: 4500,
              notes: 'Check-in diário de treino confirmado.',
              intensity: 'intenso'
            });
          }
        });
      }

      const sorted = Array.from(mergedMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSessions(sorted);
      setLoading(false);
    }, (err) => {
      console.warn("Workout sessions fetch fallback:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveUserId, profile?.workoutSessions, profile?.checkInDates]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter(s => {
      // Search filter
      const matchSearch = searchTerm === '' || 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.focus && s.focus.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // Period filter
      if (filterPeriod === 'all') return true;
      const sessDate = new Date(s.date);
      const diffDays = (now.getTime() - sessDate.getTime()) / (1000 * 3600 * 24);
      if (filterPeriod === '7d') return diffDays <= 7;
      if (filterPeriod === '30d') return diffDays <= 30;
      if (filterPeriod === '90d') return diffDays <= 90;
      return true;
    });
  }, [sessions, searchTerm, filterPeriod]);

  // Summary Metrics
  const totalWorkouts = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalVolumeSum = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      list.push({ isPadding: true, dayNum: 0, dateStr: '' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sessionsOnDate = sessions.filter(s => s.date === dateStr);
      list.push({
        isPadding: false,
        dayNum: d,
        dateStr,
        sessions: sessionsOnDate,
        hasWorkout: sessionsOnDate.length > 0
      });
    }
    return list;
  }, [year, month, firstDayOfWeek, daysInMonth, sessions]);

  // Handle Add Manual Session
  const handleAddManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dur = Number(newDuration) || 50;
      const vol = Number(newVolume) || undefined;

      const newSessData = {
        userId: effectiveUserId,
        title: newTitle.trim(),
        exerciseName: newTitle.trim(),
        date: newDate,
        completedAt: `${newDate}T12:00:00.000Z`,
        durationMinutes: dur,
        durationSeconds: dur * 60,
        totalVolumeKg: vol,
        notes: newNotes.trim(),
        intensity: newIntensity,
        isManual: true
      };

      await addDoc(collection(db, 'workout_sessions'), newSessData);

      // Reset form
      setNewTitle('');
      setNewNotes('');
      setNewVolume('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding manual workout:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este registro de treino do histórico?')) return;
    try {
      await deleteDoc(doc(db, 'workout_sessions', id));
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSessionForModal?.id === id) {
        setSelectedSessionForModal(null);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  return (
    <div className={`bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-xl transition-all ${className}`}>
      
      {/* Header with Stats and View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              Histórico de Treinos
              <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/30">
                {totalWorkouts} Concluídos
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Acompanhe sua consistência, cronograma de sessões e progressão das cargas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="bg-gray-200 dark:bg-white/10 p-1 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-md'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-md'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendário
            </button>
          </div>

          {/* Add Manual Workout Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Treino</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
            <span>Treinos Realizados</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-black text-black dark:text-white">{totalWorkouts}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Sessões registradas</p>
        </div>

        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
            <span>Tempo em Treino</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-black dark:text-white">{totalHours}h</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{totalMinutes} minutos dedicados</p>
        </div>

        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
            <span>Ofensiva Atual</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-500">{profile?.streak || totalWorkouts} Dias</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Foco ininterrupto</p>
        </div>

        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
            <span>Volume Estimado</span>
            <Dumbbell className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalVolumeSum > 0 ? `${(totalVolumeSum / 1000).toFixed(1)}t` : `${(totalWorkouts * 4.2).toFixed(1)}t`}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Toneladas levantadas</p>
        </div>
      </div>

      {/* TIMELINE LIST VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          
          {/* Search & Period Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-black/40 p-3 rounded-2xl border border-gray-200 dark:border-white/10">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar treino por foco ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-zinc-900 border border-transparent focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-black dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: '7d', label: '7 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: '90d', label: '3 Meses' },
                { id: 'all', label: 'Todos' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterPeriod(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterPeriod === p.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions Chronological List */}
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Carregando histórico de treinos...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-12 px-4 rounded-3xl bg-white dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 text-center">
              <Dumbbell className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-50" />
              <h4 className="text-base font-bold text-black dark:text-white mb-1">Nenhum treino encontrado</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Realize um check-in de treino na Dashboard ou registre manualmente uma sessão passada.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Registrar Primeiro Treino
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const formattedDate = new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedSessionForModal(session)}
                    className="bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-black text-black dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {session.title}
                            </h4>
                            {session.focus && (
                              <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {session.focus}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{formattedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {session.durationMinutes} min
                          </span>
                          {session.totalVolumeKg && (
                            <span className="flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg">
                              <Dumbbell className="w-3.5 h-3.5" />
                              {session.totalVolumeKg} kg vol
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                          title="Excluir treino do histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notes preview if available */}
                    {session.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{session.notes}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-black/50 p-4 rounded-2xl border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h4 className="text-base font-black text-black dark:text-white capitalize">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h4>

            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-black text-gray-400 uppercase">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                if (cell.isPadding) {
                  return <div key={`pad-${idx}`} className="h-16 sm:h-20 rounded-xl opacity-0" />;
                }

                const isSelected = selectedDate === cell.dateStr;
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={cell.dateStr ? `history-cell-${cell.dateStr}` : `history-cell-idx-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      if (cell.sessions && cell.sessions.length > 0) {
                        setSelectedSessionForModal(cell.sessions[0]);
                      }
                    }}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                      cell.hasWorkout
                        ? 'bg-purple-600/10 border-purple-500/40 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 shadow-sm'
                        : isToday
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-gray-300 text-gray-700 dark:text-gray-400'
                    } ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black">{cell.dayNum}</span>
                      {cell.hasWorkout && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </div>

                    {cell.hasWorkout && (
                      <div className="w-full">
                        <p className="text-[9px] font-black truncate hidden sm:block">
                          {cell.sessions[0]?.title}
                        </p>
                        <span className="text-[8px] bg-purple-600 text-white font-black px-1.5 py-0.2 rounded-md sm:hidden">
                          ✓
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL: Detailed Workout Session View */}
      <AnimatePresence>
        {selectedSessionForModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setSelectedSessionForModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
                    {selectedSessionForModal.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedSessionForModal.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Duração</span>
                  <p className="text-lg font-black text-black dark:text-white">
                    {selectedSessionForModal.durationMinutes} minutos
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Volume Total</span>
                  <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                    {selectedSessionForModal.totalVolumeKg ? `${selectedSessionForModal.totalVolumeKg} kg` : '4.500 kg'}
                  </p>
                </div>
              </div>

              {selectedSessionForModal.notes && (
                <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300">
                  <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Notas do Treino:</p>
                  <p>{selectedSessionForModal.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                {onOpenShareModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShareModal('treino_concluido');
                      setSelectedSessionForModal(null);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar Conquista
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSessionForModal(null)}
                  className="px-6 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Add Manual Workout Session */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black dark:text-white">
                    Registrar Treino Retroativo
                  </h3>
                  <p className="text-xs text-gray-500">
                    Adicione ao seu histórico um treino realizado fora do app.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddManualSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Título / Foco do Treino</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Treino A - Peito e Tríceps"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Data Realizada</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Duração (Minutos)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Volume Estimado (kg)</label>
                    <input
                      type="number"
                      placeholder="Ex: 4500"
                      value={newVolume}
                      onChange={(e) => setNewVolume(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Intensidade</label>
                    <select
                      value={newIntensity}
                      onChange={(e) => setNewIntensity(e.target.value as any)}
                      className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500"
                    >
                      <option value="leve">Leve</option>
                      <option value="moderado">Moderado</option>
                      <option value="intenso">Intenso</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Observações / Relato (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Como foi o treino? Bateu recorde de carga?"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Salvando...' : 'Gravar no Histórico'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
