import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Moon, 
  Zap, 
  Sparkles, 
  Check, 
  Calendar, 
  Save, 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Droplets, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Flame,
  Plus
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { 
  doc, 
  collection, 
  addDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc 
} from 'firebase/firestore';
import { DailyCheckinEntry } from '../types';

interface DailyCheckinFormProps {
  className?: string;
  onSuccess?: () => void;
}

export const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({ className = '', onSuccess }) => {
  const { user, profile, setProfile, updateWeight } = useUser();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState(profile?.weight ? profile.weight.toString() : '');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepQuality, setSleepQuality] = useState<number>(4); // 1 to 5
  const [energyLevel, setEnergyLevel] = useState<number>(4); // 1 to 5
  const [stressLevel, setStressLevel] = useState<number>(3); // 1 to 10
  const [waterIntakeMl, setWaterIntakeMl] = useState<string>('2500');
  const [caloriesConsumed, setCaloriesConsumed] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [recentLogs, setRecentLogs] = useState<DailyCheckinEntry[]>([]);

  const sleepQualityOptions = [
    { value: 1, label: 'Péssimo', icon: '😴', desc: 'Noite agitada / insônia' },
    { value: 2, label: 'Ruim', icon: '🥱', desc: 'Acordei cansado(a)' },
    { value: 3, label: 'Regular', icon: '😐', desc: 'Descanso moderado' },
    { value: 4, label: 'Bom', icon: '😊', desc: 'Sono reparador' },
    { value: 5, label: 'Excelente', icon: '🌟', desc: '100% revigorado(a)' },
  ];

  const energyLevelOptions = [
    { value: 1, label: 'Baixa', icon: '🔋', color: 'text-red-500' },
    { value: 2, label: 'Leve', icon: '⚡', color: 'text-orange-500' },
    { value: 3, label: 'Moderada', icon: '⚡⚡', color: 'text-yellow-500' },
    { value: 4, label: 'Alta', icon: '🔥', color: 'text-emerald-500' },
    { value: 5, label: 'Máxima', icon: '⚡⚡⚡', color: 'text-purple-500' },
  ];

  // Load existing check-in for today if any
  useEffect(() => {
    if (!user) return;

    const fetchTodayCheckin = async () => {
      try {
        const q = query(
          collection(db, 'daily_checkins'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const logs: DailyCheckinEntry[] = [];
        snap.forEach(doc => {
          const d = doc.data() as DailyCheckinEntry;
          logs.push({ ...d, id: doc.id });
        });
        
        // Sort in memory by date descending and limit to latest 5
        logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const recent = logs.slice(0, 5);
        setRecentLogs(recent);

        const todayLog = logs.find(l => l.date === todayStr);
        if (todayLog) {
          setHasLoggedToday(true);
          if (todayLog.weight) setWeight(todayLog.weight.toString());
          if (todayLog.sleepHours) setSleepHours(todayLog.sleepHours.toString());
          if (todayLog.sleepQuality) setSleepQuality(todayLog.sleepQuality);
          if (todayLog.energyLevel) setEnergyLevel(todayLog.energyLevel);
          if (todayLog.stressLevel) setStressLevel(todayLog.stressLevel);
          if (todayLog.waterIntakeMl) setWaterIntakeMl(todayLog.waterIntakeMl.toString());
          if (todayLog.caloriesConsumed) setCaloriesConsumed(todayLog.caloriesConsumed.toString());
          if (todayLog.notes) setNotes(todayLog.notes);
        }
      } catch (e) {
        console.warn("Could not fetch daily check-ins:", e);
      }
    };

    fetchTodayCheckin();
  }, [user, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToastMessage('Faça login para registrar seu check-in diário.');
      return;
    }

    setIsSubmitting(true);

    try {
      const numericWeight = weight ? parseFloat(weight.replace(',', '.')) : null;
      const numericSleep = sleepHours ? parseFloat(sleepHours.replace(',', '.')) : null;
      const numericWater = waterIntakeMl ? parseInt(waterIntakeMl) : null;
      const numericCalories = caloriesConsumed ? parseInt(caloriesConsumed) : null;

      const checkinData: Record<string, any> = {
        userId: user.uid,
        date,
        sleepQuality: Number(sleepQuality) || 3,
        energyLevel: Number(energyLevel) || 3,
        stressLevel: Number(stressLevel) || 3,
        notes: (notes || '').trim(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      if (numericWeight !== null && !isNaN(numericWeight)) {
        checkinData.weight = numericWeight;
      }
      if (numericSleep !== null && !isNaN(numericSleep)) {
        checkinData.sleepHours = numericSleep;
      }
      if (numericWater !== null && !isNaN(numericWater)) {
        checkinData.waterIntakeMl = numericWater;
      }
      if (numericCalories !== null && !isNaN(numericCalories)) {
        checkinData.caloriesConsumed = numericCalories;
      }

      // Strip any undefined keys as Firestore rejects undefined
      Object.keys(checkinData).forEach(key => {
        if (checkinData[key] === undefined) {
          delete checkinData[key];
        }
      });

      // 1. Save or update checkin in Firestore
      const docId = `${user.uid}_${date}`;
      await setDoc(doc(db, 'daily_checkins', docId), checkinData, { merge: true });

      // 2. If weight is provided, update user profile and weight_history collection
      if (numericWeight && numericWeight > 20 && numericWeight < 350) {
        try {
          await updateWeight(numericWeight);
          
          // Also record in weight_history collection for charts
          await setDoc(doc(db, 'weight_history', docId), {
            userId: user.uid,
            date,
            weight: numericWeight,
            notes: `Check-in diário (${sleepHours}h sono, energia ${energyLevel}/5)`,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (wErr) {
          console.warn("Weight history sync warning:", wErr);
        }
      }

      setHasLoggedToday(true);
      setToastMessage('✅ Check-in diário gravado com sucesso no Firestore!');
      setTimeout(() => setToastMessage(null), 3000);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving daily checkin:", error);
      setToastMessage('❌ Erro ao salvar check-in. Tente novamente.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-8 shadow-sm ${className}`}>
      
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Check-in Diário de Bem-Estar
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Registre peso diário, sono e disposição para alimentar os gráficos de evolução
            </p>
          </div>
        </div>

        {hasLoggedToday && (
          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Check-in de Hoje Realizado
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Top Row: Date & Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-500" /> Data do Registro
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-500" /> Peso Corporal (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 78.5"
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 pr-12 text-sm font-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                KG
              </span>
            </div>
          </div>
        </div>

        {/* Sleep: Hours & Quality */}
        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-200 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-500" /> Qualidade e Duração do Sono
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-bold">Horas dormidas:</span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs font-black text-center text-gray-900 dark:text-white outline-none"
              />
              <span className="text-xs font-bold text-gray-400">h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {sleepQualityOptions.map(opt => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSleepQuality(opt.value)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  sleepQuality === opt.value
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/5 text-gray-700 dark:text-zinc-300 hover:border-indigo-400'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs font-black">{opt.label}</span>
                <span className={`text-[9px] ${sleepQuality === opt.value ? 'text-indigo-100' : 'text-gray-400'}`}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy & Vitality Level */}
        <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Nível de Energia e Disposição (1 a 5)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {energyLevelOptions.map(opt => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setEnergyLevel(opt.value)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  energyLevel === opt.value
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20 scale-[1.02]'
                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/5 text-gray-700 dark:text-zinc-300 hover:border-amber-400'
                }`}
              >
                <span className="text-xl font-bold">{opt.icon}</span>
                <span className="text-xs font-black">{opt.label}</span>
                <span className={`text-[10px] font-bold ${energyLevel === opt.value ? 'text-amber-100' : 'text-gray-400'}`}>Nível {opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Details: Water, Calories, Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-500" /> Água Ingerida (ml)
            </label>
            <input
              type="number"
              step="50"
              value={waterIntakeMl}
              onChange={(e) => setWaterIntakeMl(e.target.value)}
              placeholder="Ex: 2500"
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-500" /> Calorias Consumidas Estimadas (kcal)
            </label>
            <input
              type="number"
              step="50"
              value={caloriesConsumed}
              onChange={(e) => setCaloriesConsumed(e.target.value)}
              placeholder="Ex: 2100 (Opcional)"
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Notas do Dia / Sensações (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Treino muito produtivo, alimentação 100% regrada."
            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Gravando no Firestore...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{hasLoggedToday ? 'Atualizar Check-in Diário' : 'Salvar Registro de Hoje'}</span>
            </>
          )}
        </button>
      </form>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-3 bg-zinc-900 text-white text-xs font-bold rounded-xl text-center border border-zinc-700 shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
