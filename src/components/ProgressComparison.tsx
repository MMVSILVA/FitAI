import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../store/userStore';
import { Link } from 'react-router-dom';
import { ExerciseProgress } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award, Zap, History, Loader2, Search } from 'lucide-react';

export const ProgressComparison: React.FC = () => {
  const { plan, getExerciseProgress, planType, theme } = useUser();
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [metric, setMetric] = useState<'weight' | 'reps' | 'volume'>('weight');
  const [allProgressData, setAllProgressData] = useState<Record<string, ExerciseProgress[]>>({});
  const [loading, setLoading] = useState(false);

  const exercises = plan?.days.flatMap(d => d.exercises) || [];
  const uniqueExerciseNames = Array.from(new Set(exercises.map(e => e.name))).sort();

  useEffect(() => {
    if (uniqueExerciseNames.length > 0 && selectedExercises.length === 0) {
      setSelectedExercises([uniqueExerciseNames[0]]);
    }
  }, [uniqueExerciseNames]);

  useEffect(() => {
    const fetchAllProgress = async () => {
      setLoading(true);
      const newProgressData: Record<string, ExerciseProgress[]> = {};
      
      for (const name of selectedExercises) {
        if (!allProgressData[name]) {
          const data = await getExerciseProgress(name);
          newProgressData[name] = data;
        } else {
          newProgressData[name] = allProgressData[name];
        }
      }
      
      setAllProgressData(newProgressData);
      setLoading(false);
    };

    if (selectedExercises.length > 0) {
      fetchAllProgress();
    }
  }, [selectedExercises]);

  if (planType !== 'PREMIUM') {
    return (
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-purple-500/20 rounded-[2.5rem] p-8 sm:p-12 text-center flex flex-col items-center shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-20" />
          <Award className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tighter text-black dark:text-white uppercase italic">Análise Comparativa Pro</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm font-medium leading-relaxed">
          Libere ferramentas de comparação avançadas. Monitore carga, repetições e volume de múltiplos exercícios em tempo real.
        </p>
        <Link 
          to="/checkout?plan=PREMIUM" 
          className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-purple-600/30 uppercase tracking-widest text-xs transform hover:scale-105 active:scale-95"
        >
          Seja PRO para Evoluir
        </Link>
      </div>
    );
  }

  // Combine data for the chart
  // We need a list of unique dates
  const allDates = Array.from(new Set(
    (Object.values(allProgressData) as ExerciseProgress[][]).flatMap(data => data.map(p => new Date(p.date).toLocaleDateString()))
  )).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const chartData = allDates.map(dateStr => {
    const entry: any = { data: dateStr };
    selectedExercises.forEach(exName => {
      const dayData = allProgressData[exName]?.find(p => new Date(p.date).toLocaleDateString() === dateStr);
      if (dayData) {
        if (metric === 'weight') entry[exName] = dayData.weight;
        else if (metric === 'reps') entry[exName] = dayData.reps;
        else entry[exName] = dayData.weight * dayData.reps;
      }
    });
    return entry;
  });

  const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const toggleExercise = (name: string) => {
    setSelectedExercises(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name].slice(-3) // Limit to 3 for clarity
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-black dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              Comparativo de Evolução
            </h3>
            <p className="text-gray-500 text-sm sm:text-base font-medium">Selecione até 3 exercícios para comparar</p>
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-white/5 self-start">
            {(['weight', 'reps', 'volume'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  metric === m 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {m === 'weight' ? 'Carga' : m === 'reps' ? 'Reps' : 'Volume'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(uniqueExerciseNames as string[]).map(name => {
            const isSelected = selectedExercises.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleExercise(name)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  isSelected 
                    ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400' 
                    : 'bg-white dark:bg-black border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-400 dark:hover:border-white/30'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-zinc-900/30 border border-gray-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 h-[350px] sm:h-[450px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : selectedExercises.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#ddd'} vertical={false} />
              <XAxis 
                dataKey="data" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                label={{ 
                  value: metric === 'weight' ? 'Peso (kg)' : metric === 'reps' ? 'Repetições' : 'Volume (kg)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 10, 
                  fill: '#666', 
                  fontSize: 10,
                  className: 'font-bold'
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#18181b' : '#fff', 
                  border: `1px solid ${theme === 'dark' ? '#3f3f46' : '#e5e7eb'}`, 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              {selectedExercises.map((exName, index) => (
                <Line 
                  key={exName}
                  type="monotone" 
                  dataKey={exName} 
                  name={exName}
                  stroke={colors[index % colors.length]} 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: colors[index % colors.length], strokeWidth: 0 }} 
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-800 mb-4" />
            <p className="text-gray-500 font-medium">Selecione exercícios para comparar o histórico.</p>
          </div>
        )}
      </div>

      {selectedExercises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {selectedExercises.map((name, idx) => {
            const data = allProgressData[name] || [];
            const last = data[data.length - 1];
            const max = data.length > 0 ? Math.max(...data.map(p => p.weight)) : 0;
            return (
              <div key={name} className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{name}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {last ? (metric === 'weight' ? last.weight : metric === 'reps' ? last.reps : last.weight * last.reps) : 0}
                      <span className="text-[10px] font-normal text-gray-500 ml-1">
                        {metric === 'weight' ? 'kg' : metric === 'reps' ? 'reps' : 'vol'}
                      </span>
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1 font-bold">Max Carga: {max}kg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
