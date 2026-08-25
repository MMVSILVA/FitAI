import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Flame, 
  Scale, 
  Calendar, 
  Sparkles, 
  Info,
  CheckCircle2,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { WeightEntry, DailyCheckinEntry } from '../types';

interface Trends30DaysChartProps {
  targetUserId?: string;
  className?: string;
}

interface CombinedTrendData {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  weight?: number;
  calories?: number;
  sleepHours?: number;
  energyLevel?: number;
}

export const Trends30DaysChart: React.FC<Trends30DaysChartProps> = ({
  targetUserId,
  className = ''
}) => {
  const { user, profile, plan } = useUser();
  const effectiveUserId = targetUserId || user?.uid;

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckinEntry[]>([]);
  const [viewMetric, setViewMetric] = useState<'both' | 'weight' | 'calories'>('both');
  const [loading, setLoading] = useState(true);

  // Target values from profile / diet plan
  const targetWeight = profile?.targetWeight;
  const targetCalories = plan?.diet?.calories 
    ? parseInt(plan.diet.calories.replace(/\D/g, '')) || 2000 
    : 2000;

  // 1. Fetch real-time weight entries
  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'weight_history'),
      where('userId', '==', effectiveUserId)
    );

    const unsubWeight = onSnapshot(q, (snapshot) => {
      const entries: WeightEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          weight: Number(data.weight),
          notes: data.notes
        };
      });

      // Merge with profile.weightHistory if present
      if (profile?.weightHistory && Array.isArray(profile.weightHistory)) {
        profile.weightHistory.forEach(pw => {
          if (!entries.some(e => e.date === pw.date)) {
            entries.push(pw);
          }
        });
      }

      setWeightEntries(entries);
      setLoading(false);
    }, (err) => {
      console.warn("Weight entries fetch note:", err);
      if (profile?.weightHistory) {
        setWeightEntries(profile.weightHistory);
      }
      setLoading(false);
    });

    // 2. Fetch real-time daily check-ins
    const checkinQuery = query(
      collection(db, 'daily_checkins'),
      where('userId', '==', effectiveUserId)
    );

    const unsubCheckins = onSnapshot(checkinQuery, (snapshot) => {
      const checkins: DailyCheckinEntry[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as DailyCheckinEntry));
      setDailyCheckins(checkins);
    }, (err) => {
      console.warn("Daily check-ins fetch note:", err);
    });

    return () => {
      unsubWeight();
      unsubCheckins();
    };
  }, [effectiveUserId, profile?.weightHistory]);

  // Generate continuous last 30 days dataset
  const chartData = useMemo(() => {
    const data: CombinedTrendData[] = [];
    const now = new Date();

    // Map existing records by date
    const weightMap = new Map<string, number>();
    weightEntries.forEach(w => {
      if (w.date && w.weight) {
        weightMap.set(w.date.split('T')[0], w.weight);
      }
    });

    const checkinMap = new Map<string, DailyCheckinEntry>();
    dailyCheckins.forEach(c => {
      if (c.date) {
        checkinMap.set(c.date.split('T')[0], c);
        if (c.weight && !weightMap.has(c.date.split('T')[0])) {
          weightMap.set(c.date.split('T')[0], c.weight);
        }
      }
    });

    // Generate daily points for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      const checkin = checkinMap.get(dateStr);
      const weightVal = weightMap.get(dateStr);
      
      // Calculate calorie estimate (or from checkin / adherence logs)
      let calorieVal: number | undefined = checkin?.caloriesConsumed;
      
      // If user adhered to diet on this date from adherence logs, default to planned calories
      if (!calorieVal && profile?.adherenceLogs) {
        const adheredCount = profile.adherenceLogs.filter(l => l.date === dateStr && l.adhered).length;
        if (adheredCount > 0) {
          calorieVal = targetCalories;
        }
      }

      // If weight Val exists or calorieVal exists or we show interpolated points for registered user
      data.push({
        date: dateStr,
        displayDate,
        weight: weightVal,
        calories: calorieVal,
        sleepHours: checkin?.sleepHours,
        energyLevel: checkin?.energyLevel
      });
    }

    // Forward/backward fill weight to make a continuous smooth line if user has sparse logs
    let lastKnownWeight = profile?.weight || (weightEntries.length > 0 ? weightEntries[0].weight : 70);
    const filledData = data.map(item => {
      if (item.weight) {
        lastKnownWeight = item.weight;
      }
      return {
        ...item,
        weight: item.weight || (item.calories ? lastKnownWeight : undefined)
      };
    });

    return filledData;
  }, [weightEntries, dailyCheckins, profile?.weight, profile?.adherenceLogs, targetCalories]);

  // Summary Metrics
  const validWeights = chartData.filter(d => d.weight !== undefined).map(d => d.weight as number);
  const currentWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1] : (profile?.weight || 0);
  const firstWeight = validWeights.length > 0 ? validWeights[0] : currentWeight;
  const weightChange = +(currentWeight - firstWeight).toFixed(1);

  const validCalories = chartData.filter(d => d.calories !== undefined).map(d => d.calories as number);
  const avgCalories = validCalories.length > 0 
    ? Math.round(validCalories.reduce((a, b) => a + b, 0) / validCalories.length) 
    : targetCalories;

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-sm ${className}`}>
      
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-600/10 text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-purple-500/20">
              Últimos 30 Dias
            </span>
            <span className="text-xs text-gray-500 font-bold">Tendência & Consumo</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Evolução de Peso e Calorias
          </h3>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200 dark:border-white/5">
          <button
            onClick={() => setViewMetric('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMetric === 'both' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Ambos
          </button>
          <button
            onClick={() => setViewMetric('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMetric === 'weight' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Peso (kg)
          </button>
          <button
            onClick={() => setViewMetric('calories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMetric === 'calories' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Calorias (kcal)
          </button>
        </div>
      </div>

      {/* Metric Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
            <span>Peso Atual</span>
            <Scale className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{currentWeight} <span className="text-xs font-bold text-gray-400">kg</span></p>
        </div>

        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
            <span>Variação 30d</span>
            {weightChange <= 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <p className={`text-xl sm:text-2xl font-black ${weightChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {weightChange > 0 ? `+${weightChange}` : weightChange} <span className="text-xs font-bold">kg</span>
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
            <span>Meta Diária</span>
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{targetCalories} <span className="text-xs font-bold text-gray-400">kcal</span></p>
        </div>

        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
            <span>Meta de Peso</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {targetWeight ? `${targetWeight} kg` : '--'}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-zinc-800" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11, fill: '#888888' }}
              interval={4}
              stroke="#888888"
            />
            
            {/* Left Y Axis for Weight */}
            {(viewMetric === 'both' || viewMetric === 'weight') && (
              <YAxis 
                yAxisId="weight"
                orientation="left"
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 11, fill: '#3b82f6' }}
                stroke="#3b82f6"
                unit="kg"
              />
            )}

            {/* Right Y Axis for Calories */}
            {(viewMetric === 'both' || viewMetric === 'calories') && (
              <YAxis 
                yAxisId="calories"
                orientation={viewMetric === 'both' ? 'right' : 'left'}
                domain={[1000, 4000]}
                tick={{ fontSize: 11, fill: '#10b981' }}
                stroke="#10b981"
                unit="kcal"
              />
            )}

            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl shadow-xl text-xs space-y-1 text-white">
                      <p className="font-black text-zinc-400 uppercase tracking-wider mb-1">Data: {label}</p>
                      {payload.map((item, idx) => (
                        <p key={idx} className="font-bold flex items-center justify-between gap-4" style={{ color: item.color }}>
                          <span>{item.name}:</span>
                          <span className="font-mono font-black">{item.value} {item.unit}</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend 
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            />

            {/* Target Weight Reference */}
            {targetWeight && (viewMetric === 'both' || viewMetric === 'weight') && (
              <ReferenceLine 
                yAxisId="weight" 
                y={targetWeight} 
                stroke="#a855f7" 
                strokeDasharray="4 4" 
                label={{ value: `Meta: ${targetWeight}kg`, fill: '#a855f7', fontSize: 10, position: 'insideTopRight' }}
              />
            )}

            {/* Target Calories Reference */}
            {targetCalories && (viewMetric === 'both' || viewMetric === 'calories') && (
              <ReferenceLine 
                yAxisId="calories" 
                y={targetCalories} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                label={{ value: `Plano: ${targetCalories}kcal`, fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}

            {/* Weight Line */}
            {(viewMetric === 'both' || viewMetric === 'weight') && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                name="Peso Corporal"
                unit="kg"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 6, fill: '#60a5fa' }}
                connectNulls
              />
            )}

            {/* Calories Line */}
            {(viewMetric === 'both' || viewMetric === 'calories') && (
              <Line
                yAxisId="calories"
                type="monotone"
                dataKey="calories"
                name="Calorias"
                unit="kcal"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray={viewMetric === 'both' ? '3 3' : undefined}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6, fill: '#34d399' }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-purple-500" />
          Dados sincronizados em tempo real com registros diários e Firestore.
        </span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          FitAI Analytics Pro
        </span>
      </div>
    </div>
  );
};
