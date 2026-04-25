import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../store/userStore';
import { ExerciseProgress } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award, Zap, History, Loader2, Search } from 'lucide-react';

export const ProgressComparison: React.FC = () => {
  const { plan, getExerciseProgress, planType } = useUser();
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [progressData, setProgressData] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const exercises = plan?.days.flatMap(d => d.exercises) || [];
  const uniqueExerciseNames = Array.from(new Set(exercises.map(e => e.name)));

  useEffect(() => {
    if (uniqueExerciseNames.length > 0 && !selectedExercise) {
      setSelectedExercise(uniqueExerciseNames[0]);
    }
  }, [uniqueExerciseNames, selectedExercise]);

  useEffect(() => {
    if (selectedExercise) {
      const fetchProgress = async () => {
        setLoading(true);
        const data = await getExerciseProgress(selectedExercise);
        setProgressData(data);
        setLoading(false);
      };
      fetchProgress();
    }
  }, [selectedExercise]);

  if (planType !== 'PREMIUM') {
    return (
      <div className="bg-zinc-950 border border-purple-500/20 rounded-3xl p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
          <Award className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Análise Comparativa Premium</h3>
        <p className="text-gray-400 mb-8 max-w-sm">
          Acompanhe sua evolução de carga e repetições detalhadamente com gráficos comparativos exclusivos.
        </p>
        <button className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
          Disponível no Plano PREMIUM
        </button>
      </div>
    );
  }

  const chartData = progressData.map(p => ({
    data: new Date(p.date).toLocaleDateString(),
    carga: p.weight,
    reps: p.reps,
    volume: p.weight * p.reps
  }));

  const lastEntry = progressData.length > 1 ? progressData[progressData.length - 1] : null;
  const prevEntry = progressData.length > 1 ? progressData[progressData.length - 2] : null;
  
  const progression = lastEntry && prevEntry 
    ? ((lastEntry.weight * lastEntry.reps) - (prevEntry.weight * prevEntry.reps)) / (prevEntry.weight * prevEntry.reps) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            Progresso de Carga
          </h3>
          <p className="text-gray-500 text-base font-medium">Compare sua evolução por exercício</p>
        </div>

        <div className="relative">
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-2.5 pr-10 appearance-none focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm min-w-[240px]"
          >
            {uniqueExerciseNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
          <p className="text-xs font-black text-purple-500 uppercase tracking-widest mb-1.5">Pico de Carga</p>
          <p className="text-4xl font-black text-white">
            {progressData.length > 0 ? Math.max(...progressData.map(p => p.weight)) : 0}
            <span className="text-sm font-normal text-gray-600 ml-1">kg</span>
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
          <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1.5">Volume Total (Último)</p>
          <p className="text-4xl font-black text-white">
            {lastEntry ? lastEntry.weight * lastEntry.reps : 0}
            <span className="text-sm font-normal text-gray-600 ml-1">kg</span>
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
          <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-1.5">Evolução %</p>
          <p className={`text-4xl font-black ${progression >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {progression > 0 ? '+' : ''}{progression.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 h-[400px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : progressData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
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
                label={{ value: 'Carga (kg)', angle: -90, position: 'insideLeft', offset: 10, fill: '#666', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                itemStyle={{ color: '#a855f7' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="carga" 
                name="Carga (kg)"
                stroke="#a855f7" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                name="Volume (Total)"
                stroke="#3b82f6" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <History className="w-12 h-12 text-gray-800 mb-4" />
            <p className="text-gray-500 font-medium">Sem histórico registrado para este exercício.</p>
            <p className="text-gray-700 text-sm">Registre seus treinos no Dashboard para ver sua evolução aqui.</p>
          </div>
        )}
      </div>

      <div className="bg-purple-900/10 border border-purple-500/20 p-6 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h4 className="font-bold text-white mb-1">Dica Premium de Progressão</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Baseado no seu histórico, você está pronto para aumentar a carga neste exercício em 5%. 
            Mantenha a técnica perfeita e foque na cadência controlada.
          </p>
        </div>
      </div>
    </div>
  );
};
