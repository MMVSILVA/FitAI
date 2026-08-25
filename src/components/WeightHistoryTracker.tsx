import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Calendar, 
  Trash2, 
  Target, 
  Scale, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { WeightEntry } from '../types';

interface WeightHistoryTrackerProps {
  targetUserId?: string;
  className?: string;
}

export const WeightHistoryTracker: React.FC<WeightHistoryTrackerProps> = ({ targetUserId, className = '' }) => {
  const { user, profile, setProfile, theme } = useUser();
  const effectiveUserId = targetUserId || user?.uid;
  const isOwner = !targetUserId || targetUserId === user?.uid;

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  
  // Form states
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(profile?.targetWeight?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to weight history
  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Check if profile already has weightHistory array
    let profileHistory: WeightEntry[] = [];
    if (profile?.uid === effectiveUserId && profile.weightHistory && Array.isArray(profile.weightHistory)) {
      profileHistory = [...profile.weightHistory];
    }

    // 2. Real-time listener on collection 'weight_history'
    const q = query(
      collection(db, 'weight_history'),
      where('userId', '==', effectiveUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const colEntries: WeightEntry[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date,
          weight: Number(data.weight),
          bodyFat: data.bodyFat ? Number(data.bodyFat) : undefined,
          leanMass: data.leanMass ? Number(data.leanMass) : undefined,
          notes: data.notes || ''
        };
      });

      // Merge collection entries and profile array entries (avoid duplicates by date+weight)
      const mergedMap = new Map<string, WeightEntry>();

      // Seed with initial profile weight if empty
      if (colEntries.length === 0 && profileHistory.length === 0 && profile?.weight) {
        const initialDate = profile.createdAt ? profile.createdAt.split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        mergedMap.set(`initial-${initialDate}`, {
          id: 'initial-entry',
          date: initialDate,
          weight: profile.weight,
          notes: 'Peso inicial cadastrado'
        });
      }

      profileHistory.forEach(e => {
        const key = `${e.date}_${e.weight}`;
        mergedMap.set(key, e);
      });

      colEntries.forEach(e => {
        const key = `${e.date}_${e.weight}`;
        mergedMap.set(key, e);
      });

      const combined = Array.from(mergedMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setEntries(combined);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching weight history:", err);
      // Fallback to profile entries
      if (profileHistory.length > 0) {
        setEntries(profileHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } else if (profile?.weight) {
        setEntries([{
          id: 'initial',
          date: new Date().toISOString().split('T')[0],
          weight: profile.weight,
          notes: 'Peso atual'
        }]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveUserId, profile?.weightHistory, profile?.weight]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered data by selected time range
  const filteredEntries = useMemo(() => {
    if (entries.length === 0) return [];
    const now = new Date();

    let cutoffDate = new Date(0); // ALL
    if (timeRange === '1M') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '3M') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '6M') {
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '1Y') {
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const filtered = entries.filter(e => new Date(e.date) >= cutoffDate);
    return filtered.length > 0 ? filtered : entries;
  }, [entries, timeRange]);

  // Formatted data for Recharts
  const chartData = useMemo(() => {
    return filteredEntries.map(e => {
      const d = new Date(e.date);
      // Format as DD/MM
      const dateLabel = isNaN(d.getTime()) 
        ? e.date 
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: e.id,
        rawDate: e.date,
        displayDate: dateLabel,
        peso: Number(e.weight.toFixed(1)),
        gordura: e.bodyFat ? Number(e.bodyFat.toFixed(1)) : undefined,
        massaMagra: e.bodyFat ? Number((e.weight * (1 - e.bodyFat / 100)).toFixed(1)) : undefined,
        notes: e.notes
      };
    });
  }, [filteredEntries]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    if (entries.length === 0) {
      const current = profile?.weight || 0;
      return {
        current,
        initial: current,
        diff: 0,
        min: current,
        max: current,
        target: profile?.targetWeight || null,
        targetProgress: 0
      };
    }

    const initial = entries[0].weight;
    const current = entries[entries.length - 1].weight;
    const diff = Number((current - initial).toFixed(1));

    const weights = entries.map(e => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const target = profile?.targetWeight || null;

    let targetProgress = 0;
    if (target && initial !== target) {
      const totalNeeded = target - initial;
      const done = current - initial;
      targetProgress = Math.min(100, Math.max(0, Math.round((done / totalNeeded) * 100)));
    }

    return {
      current,
      initial,
      diff,
      min,
      max,
      target,
      targetProgress
    };
  }, [entries, profile]);

  // Y-Axis Domain calculation
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [50, 100];
    const values = chartData.map(d => d.peso);
    if (metrics.target) values.push(metrics.target);
    const min = Math.floor(Math.min(...values) - 2);
    const max = Math.ceil(Math.max(...values) + 2);
    return [Math.max(0, min), max];
  }, [chartData, metrics.target]);

  // Handle Add Weight Entry
  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId || !newWeight) return;

    const parsedWeight = parseFloat(newWeight.replace(',', '.'));
    if (isNaN(parsedWeight) || parsedWeight <= 20 || parsedWeight >= 350) {
      alert("Por favor, insira um peso válido entre 20kg e 350kg.");
      return;
    }

    const parsedBodyFat = newBodyFat ? parseFloat(newBodyFat.replace(',', '.')) : undefined;

    setIsSubmitting(true);
    try {
      const newEntry: WeightEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        date: newDate,
        weight: parsedWeight,
        bodyFat: parsedBodyFat,
        notes: newNotes.trim()
      };

      // 1. Add to Firestore collection
      await addDoc(collection(db, 'weight_history'), {
        userId: effectiveUserId,
        ...newEntry,
        createdAt: new Date().toISOString()
      });

      // 2. Update user profile's current weight and weightHistory
      if (isOwner && user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          weight: parsedWeight,
          weightHistory: arrayUnion(newEntry)
        });
        setProfile({ weight: parsedWeight });
      }

      setNewWeight('');
      setNewBodyFat('');
      setNewNotes('');
      setShowAddModal(false);
      showToast('Registro de peso salvo com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar peso:", err);
      // Local optimistic update
      const fallbackEntry: WeightEntry = {
        id: `local_${Date.now()}`,
        date: newDate,
        weight: parsedWeight,
        bodyFat: parsedBodyFat,
        notes: newNotes.trim()
      };
      setEntries(prev => [...prev, fallbackEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setShowAddModal(false);
      showToast('Registro de peso salvo!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (entry: WeightEntry) => {
    if (!window.confirm(`Deseja excluir o registro de ${entry.weight}kg em ${entry.date}?`)) return;

    try {
      // If it's a collection doc id
      if (entry.id && !entry.id.startsWith('local_') && !entry.id.startsWith('initial')) {
        await deleteDoc(doc(db, 'weight_history', entry.id));
      }

      // Update user doc array if present
      if (isOwner && user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          weightHistory: arrayRemove(entry)
        });
      }

      setEntries(prev => prev.filter(e => e.id !== entry.id && !(e.date === entry.date && e.weight === entry.weight)));
      showToast('Registro removido.');
    } catch (err) {
      console.error("Erro ao remover registro:", err);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      showToast('Registro removido localmente.');
    }
  };

  // Handle Update Target Weight
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId) return;
    const parsedTarget = targetWeightInput ? parseFloat(targetWeightInput.replace(',', '.')) : null;

    setIsSubmitting(true);
    try {
      if (isOwner && user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          targetWeight: parsedTarget
        });
        setProfile({ targetWeight: parsedTarget || undefined });
      }
      setShowTargetModal(false);
      showToast('Meta de peso atualizada com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
      showToast('Erro ao atualizar meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === 'dark' || theme === 'system';

  return (
    <div id="weight-history-tracker-container" className={`bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Evolução do Peso Corporal
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Acompanhamento contínuo de peso, massa magra e metas de composição
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-target-weight"
            onClick={() => setShowTargetModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-all"
          >
            <Target className="w-3.5 h-3.5 text-purple-500" />
            {metrics.target ? `Meta: ${metrics.target}kg` : 'Definir Meta'}
          </button>

          {isOwner && (
            <button
              type="button"
              id="btn-add-weight-entry"
              onClick={() => {
                setNewDate(new Date().toISOString().split('T')[0]);
                setShowAddModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Registrar Peso
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Peso Atual
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-black dark:text-white">
              {metrics.current.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-gray-500">kg</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Variação Total
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`text-2xl font-black ${
              metrics.diff < 0 
                ? 'text-emerald-500' 
                : metrics.diff > 0 
                  ? 'text-purple-500' 
                  : 'text-gray-500'
            }`}>
              {metrics.diff > 0 ? `+${metrics.diff}` : metrics.diff}
            </span>
            <span className="text-xs font-bold text-gray-500">kg</span>
            {metrics.diff !== 0 && (
              metrics.diff < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-purple-500" />
              )
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Menor / Maior
          </p>
          <div className="flex items-baseline gap-1 text-sm font-bold text-gray-700 dark:text-gray-300">
            <span>{metrics.min.toFixed(1)}kg</span>
            <span className="text-gray-400">/</span>
            <span>{metrics.max.toFixed(1)}kg</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            {metrics.target ? 'Progresso da Meta' : 'Registros Totais'}
          </p>
          {metrics.target ? (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                  {metrics.target} kg
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {metrics.targetProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.targetProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-2xl font-black text-black dark:text-white">
              {entries.length}
            </span>
          )}
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Time range buttons */}
        <div className="flex items-center bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl border border-gray-200 dark:border-white/5">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                timeRange === r 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {r === '1M' ? '1 Mês' : r === '3M' ? '3 Meses' : r === '6M' ? '6 Meses' : r === '1Y' ? '1 Ano' : 'Tudo'}
            </button>
          ))}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl border border-gray-200 dark:border-white/5 text-[11px]">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${chartType === 'area' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500'}`}
            >
              Área
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${chartType === 'line' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500'}`}
            >
              Linha
            </button>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-1 transition-all"
          >
            {showTable ? 'Ocultar Histórico' : 'Ver Histórico'}
            {showTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="h-[320px] w-full relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <Scale className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum registro de peso no período selecionado.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs text-purple-500 font-bold hover:underline"
            >
              Adicionar primeiro registro
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#27272a' : '#f4f4f5'} 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="displayDate" 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  domain={yDomain}
                  dx={-5}
                  unit="kg"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-white/15 p-3 rounded-2xl shadow-2xl text-white text-xs space-y-1">
                          <p className="font-bold text-gray-400">{data.rawDate}</p>
                          <p className="text-base font-black text-purple-400">
                            {data.peso} kg
                          </p>
                          {data.gordura && (
                            <p className="text-[11px] text-gray-300">
                              Gordura: <strong className="text-white">{data.gordura}%</strong>
                            </p>
                          )}
                          {data.massaMagra && (
                            <p className="text-[11px] text-emerald-400">
                              Massa Magra est.: {data.massaMagra} kg
                            </p>
                          )}
                          {data.notes && (
                            <p className="text-[10px] text-gray-400 italic pt-1 border-t border-white/10">
                              "{data.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                />
                {metrics.target && (
                  <ReferenceLine 
                    y={metrics.target} 
                    stroke="#ec4899" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      value: `Meta ${metrics.target}kg`, 
                      fill: '#ec4899', 
                      fontSize: 10,
                      position: 'insideTopRight'
                    }} 
                  />
                )}
                <Area 
                  name="Peso (kg)"
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightGradient)"
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#27272a' : '#f4f4f5'} 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="displayDate" 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  domain={yDomain}
                  dx={-5}
                  unit="kg"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-white/15 p-3 rounded-2xl shadow-2xl text-white text-xs space-y-1">
                          <p className="font-bold text-gray-400">{data.rawDate}</p>
                          <p className="text-base font-black text-purple-400">
                            {data.peso} kg
                          </p>
                          {data.notes && (
                            <p className="text-[10px] text-gray-400 italic pt-1 border-t border-white/10">
                              "{data.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 1.5 }}
                />
                {metrics.target && (
                  <ReferenceLine 
                    y={metrics.target} 
                    stroke="#ec4899" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      value: `Meta ${metrics.target}kg`, 
                      fill: '#ec4899', 
                      fontSize: 10,
                      position: 'insideTopRight'
                    }} 
                  />
                )}
                <Line 
                  name="Peso (kg)"
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Collapsible History Table */}
      <AnimatePresence>
        {showTable && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Histórico Completo ({entries.length} registros)
              </h4>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 font-bold sticky top-0">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Peso</th>
                    <th className="p-3 hidden sm:table-cell">% Gordura</th>
                    <th className="p-3 hidden md:table-cell">Notas</th>
                    {isOwner && <th className="p-3 text-right">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {[...entries].reverse().map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                        {entry.date}
                      </td>
                      <td className="p-3 font-bold text-black dark:text-white">
                        {entry.weight} kg
                      </td>
                      <td className="p-3 text-gray-500 hidden sm:table-cell">
                        {entry.bodyFat ? `${entry.bodyFat}%` : '--'}
                      </td>
                      <td className="p-3 text-gray-400 italic hidden md:table-cell truncate max-w-xs">
                        {entry.notes || '--'}
                      </td>
                      {isOwner && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Excluir registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Registrar Novo Peso */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-500" /> Registrar Peso Corporal
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWeight} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Peso (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="350"
                    required
                    placeholder="Ex: 78.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-lg font-bold text-black dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Data da Pesagem *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  % Gordura Corporal (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="70"
                    placeholder="Ex: 15.2"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Notas / Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Em jejum matinal, pós treino de perna..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 font-bold p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Definir Meta de Peso */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" /> Definir Meta de Peso
              </h3>
              <button 
                onClick={() => setShowTargetModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sua meta de peso será exibida como linha guia no gráfico para ajudar a acompanhar seu progresso e déficit/superávit calórico.
            </p>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Peso Alvo (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder="Ex: 75.0"
                    value={targetWeightInput}
                    onChange={(e) => setTargetWeightInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-lg font-bold text-black dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    kg
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 font-bold p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
