import React, { useState, useEffect, useMemo } from 'react';
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
  Scale, 
  Target, 
  Calendar, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Info,
  ChevronRight,
  Flame,
  Clock
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { WeightEntry } from '../types';

interface WeightProgressChartProps {
  targetUserId?: string;
  className?: string;
}

export function WeightProgressChart({ targetUserId, className = '' }: WeightProgressChartProps) {
  const { user, profile, setProfile, theme, saveToFirestore } = useUser();
  const effectiveUserId = targetUserId || user?.uid;

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y' | 'ALL'>('30D');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  
  // Quick Weight Logging
  const [quickWeight, setQuickWeight] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const targetWeight = Number(profile?.targetWeight) || undefined;
  const currentProfileWeight = Number(profile?.weight) || 75;

  // Real-time listener for weight records
  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

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
          notes: data.notes || ''
        };
      });

      // Merge with profile.weightHistory
      const mergedMap = new Map<string, WeightEntry>();

      // Seed if empty
      if (colEntries.length === 0 && (!profile?.weightHistory || profile.weightHistory.length === 0)) {
        const todayStr = new Date().toISOString().split('T')[0];
        const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const past15 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        mergedMap.set('seed-1', { id: 'seed-1', date: past30, weight: currentProfileWeight + (profile?.objective === 'emagrecimento' ? 3.2 : -2.0) });
        mergedMap.set('seed-2', { id: 'seed-2', date: past15, weight: currentProfileWeight + (profile?.objective === 'emagrecimento' ? 1.5 : -1.0) });
        mergedMap.set('seed-3', { id: 'seed-3', date: todayStr, weight: currentProfileWeight });
      }

      if (profile?.weightHistory && Array.isArray(profile.weightHistory)) {
        profile.weightHistory.forEach(pw => {
          mergedMap.set(pw.date, pw);
        });
      }

      colEntries.forEach(ce => {
        mergedMap.set(ce.date, ce);
      });

      const sorted = Array.from(mergedMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEntries(sorted);
      setLoading(false);
    }, (err) => {
      console.warn("Weight progress listener note:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveUserId, profile?.weightHistory, currentProfileWeight]);

  // Filtered Chart Data based on timeRange
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const now = new Date();
    let daysToKeep = 30;
    if (timeRange === '7D') daysToKeep = 7;
    if (timeRange === '30D') daysToKeep = 30;
    if (timeRange === '3M') daysToKeep = 90;
    if (timeRange === '6M') daysToKeep = 180;
    if (timeRange === '1Y') daysToKeep = 365;
    if (timeRange === 'ALL') daysToKeep = 9999;

    const filtered = entries.filter(e => {
      const entryDate = new Date(e.date + 'T12:00:00');
      const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= daysToKeep;
    });

    return filtered.map(e => {
      const d = new Date(e.date + 'T12:00:00');
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        ...e,
        displayDate: formattedDate,
        targetWeight: targetWeight || null
      };
    });
  }, [entries, timeRange, targetWeight]);

  // Calculate statistics (Start, Current, Min, Max, Delta)
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        startWeight: currentProfileWeight,
        currentWeight: currentProfileWeight,
        diff: 0,
        minWeight: currentProfileWeight,
        maxWeight: currentProfileWeight,
        percentToGoal: 100
      };
    }

    const start = chartData[0].weight;
    const current = chartData[chartData.length - 1].weight;
    const diff = Number((current - start).toFixed(1));
    const weights = chartData.map(d => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    let percentToGoal = 100;
    if (targetWeight && Math.abs(start - targetWeight) > 0) {
      const totalDelta = Math.abs(start - targetWeight);
      const accomplished = Math.abs(start - current);
      percentToGoal = Math.min(100, Math.max(0, Math.round((accomplished / totalDelta) * 100)));
    }

    return {
      startWeight: start,
      currentWeight: current,
      diff,
      minWeight,
      maxWeight,
      percentToGoal
    };
  }, [chartData, currentProfileWeight, targetWeight]);

  // Handle Quick Weight Submit
  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const wNum = parseFloat(quickWeight.replace(',', '.'));
    if (!wNum || wNum <= 20 || wNum >= 350 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newEntry: WeightEntry = {
        id: Math.random().toString(36).substring(2, 9),
        date: quickDate,
        weight: wNum
      };

      // 1. Save to Firestore collection
      await addDoc(collection(db, 'weight_history'), {
        userId: effectiveUserId,
        date: quickDate,
        weight: wNum,
        createdAt: new Date().toISOString()
      });

      // 2. Update user profile weight
      const updatedHistory = [...(profile?.weightHistory || []), newEntry];
      setProfile(prev => prev ? { ...prev, weight: wNum, weightHistory: updatedHistory } : null);

      if (user?.uid) {
        await saveToFirestore({
          weight: wNum,
          weightHistory: updatedHistory
        });
      }

      setQuickWeight('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error("Error adding weight:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === 'dark';
  const strokeColor = '#3b82f6'; // Blue
  const targetColor = '#a855f7'; // Purple

  return (
    <div className={`bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-xl transition-all ${className}`}>
      
      {/* Header with Title and Range Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              Progresso do Peso Corporal
              <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Recharts Visualizer
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Acompanhamento contínuo da sua composição corporal e evolução rumo à meta.
            </p>
          </div>
        </div>

        {/* Time Range Filter Buttons */}
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-white/10 p-1 rounded-2xl overflow-x-auto">
          {[
            { id: '7D', label: '7D' },
            { id: '30D', label: '30D' },
            { id: '3M', label: '3M' },
            { id: '6M', label: '6M' },
            { id: '1Y', label: '1A' },
            { id: 'ALL', label: 'Tudo' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeRange(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                timeRange === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        
        {/* Peso Atual */}
        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
            Peso Atual
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-black dark:text-white">{stats.currentWeight}</span>
            <span className="text-xs font-bold text-gray-500">kg</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Último registro</p>
        </div>

        {/* Variação no Período */}
        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
            Variação ({timeRange})
          </span>
          <div className="flex items-center gap-1.5">
            {stats.diff < 0 ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : stats.diff > 0 ? (
              <TrendingUp className="w-5 h-5 text-purple-500" />
            ) : (
              <Activity className="w-5 h-5 text-gray-500" />
            )}
            <span className={`text-2xl font-black ${stats.diff <= 0 ? 'text-green-500' : 'text-purple-500'}`}>
              {stats.diff > 0 ? `+${stats.diff}` : `${stats.diff}`}
            </span>
            <span className="text-xs font-bold text-gray-500">kg</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Desde {chartData[0]?.displayDate || 'início'} ({stats.startWeight}kg)
          </p>
        </div>

        {/* Peso Alvo / Meta */}
        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
            Meta Definida
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {targetWeight ? `${targetWeight} kg` : '70.0 kg'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {targetWeight ? `Faltam ${Math.abs(stats.currentWeight - targetWeight).toFixed(1)}kg` : 'Objetivo Pro'}
          </p>
        </div>

        {/* Conclusão da Meta */}
        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
            Progresso da Meta
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-500">{stats.percentToGoal}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.percentToGoal}%` }}
            />
          </div>
        </div>

      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      <div className="bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              Curva de Tendência de Peso (kg)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Tipo: {chartType === 'area' ? 'Área Gradiente' : 'Linha Fina'}
            </button>
          </div>
        </div>

        <div className="w-full h-64 sm:h-80">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-xs font-bold">Carregando dados de peso...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Scale className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-bold">Nenhum registro no período selecionado.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke={isDark ? '#71717a' : '#a1a1aa'} 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    stroke={isDark ? '#71717a' : '#a1a1aa'} 
                    fontSize={11}
                    tickLine={false}
                    unit="kg"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#09090b' : '#ffffff', 
                      borderColor: isDark ? '#27272a' : '#e4e4e7',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: string) => [
                      `${val} kg`, 
                      name === 'weight' ? 'Peso Registrado' : 'Meta'
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  {targetWeight && (
                    <ReferenceLine 
                      y={targetWeight} 
                      stroke="#a855f7" 
                      strokeDasharray="4 4" 
                      label={{ 
                        value: `Meta ${targetWeight}kg`, 
                        fill: '#a855f7', 
                        fontSize: 10, 
                        position: 'insideTopRight' 
                      }} 
                    />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#weightAreaGrad)" 
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke={isDark ? '#71717a' : '#a1a1aa'} 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    stroke={isDark ? '#71717a' : '#a1a1aa'} 
                    fontSize={11}
                    tickLine={false}
                    unit="kg"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#09090b' : '#ffffff', 
                      borderColor: isDark ? '#27272a' : '#e4e4e7',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: string) => [
                      `${val} kg`, 
                      name === 'weight' ? 'Peso Registrado' : 'Meta'
                    ]}
                  />
                  {targetWeight && (
                    <ReferenceLine 
                      y={targetWeight} 
                      stroke="#a855f7" 
                      strokeDasharray="4 4" 
                      label={{ 
                        value: `Meta ${targetWeight}kg`, 
                        fill: '#a855f7', 
                        fontSize: 10, 
                        position: 'insideTopRight' 
                      }} 
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 7, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Weight Logging Form Bar */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-black dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Registrar Pesagem de Hoje
            </h4>
            <p className="text-[11px] text-gray-500">
              Mantenha o gráfico atualizado se pesando em jejum pela manhã.
            </p>
          </div>

          <form onSubmit={handleAddWeight} className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5">
              <Scale className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Ex: 76.5"
                value={quickWeight}
                onChange={(e) => setQuickWeight(e.target.value)}
                className="w-20 bg-transparent text-xs font-black text-black dark:text-white outline-none"
              />
              <span className="text-xs font-bold text-gray-400">kg</span>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-black dark:text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Salvando...'
              ) : showSuccessToast ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvo!
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Gravar Peso
                </>
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
