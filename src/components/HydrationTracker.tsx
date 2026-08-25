import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  Plus, 
  Minus, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Edit3, 
  X, 
  Clock, 
  Coffee, 
  Activity, 
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { HydrationData, HydrationLogItem } from '../types';

interface HydrationTrackerProps {
  className?: string;
  compact?: boolean;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({ className = '', compact = false }) => {
  const { user, profile, setProfile } = useUser();
  const todayStr = new Date().toISOString().split('T')[0];

  // Default target based on weight (35ml per kg) or 2500ml fallback
  const calculatedDefaultGoal = useMemo(() => {
    if (profile?.weight && profile.weight > 30) {
      return Math.round((profile.weight * 35) / 100) * 100;
    }
    return 2500;
  }, [profile?.weight]);

  const [hydration, setHydration] = useState<HydrationData>({
    goal: calculatedDefaultGoal,
    date: todayStr,
    logs: [],
    streakDays: 0
  });

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(calculatedDefaultGoal.toString());
  const [showCustomAddModal, setShowCustomAddModal] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('300');
  const [customDrinkType, setCustomDrinkType] = useState<'water' | 'tea' | 'coconut_water' | 'shake'>('water');
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load hydration state from Firestore / LocalStorage
  useEffect(() => {
    if (!user) {
      // Load local storage fallback for guests
      const local = localStorage.getItem(`fitai_hydration_${todayStr}`);
      if (local) {
        try {
          setHydration(JSON.parse(local));
        } catch (e) {}
      } else {
        setHydration(prev => ({ ...prev, goal: calculatedDefaultGoal, date: todayStr, logs: [] }));
      }
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.hydration && data.hydration.date === todayStr) {
          setHydration(data.hydration);
        } else {
          // New day reset with retained goal
          const existingGoal = data.hydration?.goal || profile?.hydration?.goal || calculatedDefaultGoal;
          const newDayData: HydrationData = {
            goal: existingGoal,
            date: todayStr,
            logs: [],
            streakDays: data.hydration?.streakDays || 0
          };
          setHydration(newDayData);
        }
      }
    }, (err) => {
      console.warn("Hydration snapshot error, using local state:", err);
    });

    return () => unsubscribe();
  }, [user, todayStr, calculatedDefaultGoal]);

  // Sync update to Firestore & LocalStorage
  const saveHydration = async (newData: HydrationData) => {
    setHydration(newData);
    localStorage.setItem(`fitai_hydration_${todayStr}`, JSON.stringify(newData));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { hydration: newData });
      } catch (err) {
        console.error("Error saving hydration to Firestore:", err);
      }
    }
  };

  // Current total intake (ml)
  const currentIntake = useMemo(() => {
    return hydration.logs.reduce((acc, curr) => acc + curr.amount, 0);
  }, [hydration.logs]);

  // Progress percentage (0 - 100+)
  const progressPercent = useMemo(() => {
    if (!hydration.goal || hydration.goal <= 0) return 0;
    return Math.min(100, Math.round((currentIntake / hydration.goal) * 100));
  }, [currentIntake, hydration.goal]);

  const rawPercent = useMemo(() => {
    if (!hydration.goal || hydration.goal <= 0) return 0;
    return Math.round((currentIntake / hydration.goal) * 100);
  }, [currentIntake, hydration.goal]);

  const remainingMl = Math.max(0, hydration.goal - currentIntake);

  // Add water log
  const handleAddWater = (amount: number, type: 'water' | 'tea' | 'coconut_water' | 'shake' = 'water') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLogItem: HydrationLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: timeStr,
      amount,
      type
    };

    const updatedLogs = [...hydration.logs, newLogItem];
    const newTotal = updatedLogs.reduce((a, b) => a + b.amount, 0);

    const updatedData: HydrationData = {
      ...hydration,
      logs: updatedLogs
    };

    saveHydration(updatedData);

    if (newTotal >= hydration.goal && currentIntake < hydration.goal) {
      showToast('🎉 Parabéns! Você atingiu sua meta de hidratação hoje!');
    } else {
      showToast(`+${amount}ml adicionados!`);
    }
  };

  // Undo last log
  const handleUndo = () => {
    if (hydration.logs.length === 0) return;
    const lastItem = hydration.logs[hydration.logs.length - 1];
    const updatedLogs = hydration.logs.slice(0, -1);

    const updatedData: HydrationData = {
      ...hydration,
      logs: updatedLogs
    };

    saveHydration(updatedData);
    showToast(`-${lastItem.amount}ml removidos.`);
  };

  // Reset current day
  const handleResetDay = () => {
    if (!window.confirm("Deseja zerar os registros de hidratação de hoje?")) return;
    const updatedData: HydrationData = {
      ...hydration,
      logs: []
    };
    saveHydration(updatedData);
    showToast("Contador de água reiniciado para hoje.");
  };

  // Save new goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(goalInput, 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 10000) {
      alert("Por favor, insira uma meta entre 500ml e 10.000ml.");
      return;
    }

    const updatedData: HydrationData = {
      ...hydration,
      goal: parsed
    };

    saveHydration(updatedData);
    setShowGoalModal(false);
    showToast(`Meta atualizada para ${parsed}ml!`);
  };

  // Save custom amount
  const handleSaveCustomAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmountInput, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed > 3000) {
      alert("Por favor, insira um valor válido entre 10ml e 3.000ml.");
      return;
    }

    handleAddWater(parsed, customDrinkType);
    setShowCustomAddModal(false);
  };

  // Quick preset buttons for common container sizes
  const quickPresets = [
    { label: '+200 ml', amount: 200, name: 'Copo' },
    { label: '+300 ml', amount: 300, name: 'Caneca' },
    { label: '+500 ml', amount: 500, name: 'Garrafinha' },
    { label: '+750 ml', amount: 750, name: 'Squeeze' },
    { label: '+1000 ml', amount: 1000, name: 'Garrafa 1L' },
  ];

  return (
    <div 
      id="hydration-tracker-card"
      className={`bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden transition-all ${className}`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-base text-black dark:text-white tracking-tight flex items-center gap-2">
              Hidratação Diária
              {rawPercent >= 100 && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" /> Meta Concluída
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {remainingMl > 0 
                ? `Faltam ${remainingMl.toLocaleString('pt-BR')} ml para sua meta`
                : `Você superou a meta diária em +${(currentIntake - hydration.goal).toLocaleString('pt-BR')} ml!`}
            </p>
          </div>
        </div>

        {/* Goal Edit Button */}
        <button
          type="button"
          onClick={() => {
            setGoalInput(hydration.goal.toString());
            setShowGoalModal(true);
          }}
          className="p-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-cyan-500/30 transition-all flex items-center gap-1"
          title="Editar meta diária"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Meta: {hydration.goal.toLocaleString('pt-BR')}ml</span>
        </button>
      </div>

      {/* Main Hydration Progress Visualization */}
      <div className="bg-gradient-to-br from-cyan-50/50 via-sky-50/30 to-blue-50/20 dark:from-cyan-950/20 dark:via-zinc-900/60 dark:to-zinc-900/40 border border-cyan-500/10 dark:border-cyan-500/10 rounded-2xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Circular / Wave Progress Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            {/* Background SVG Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-gray-200/80 dark:stroke-zinc-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-cyan-500 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={264 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Water Ripple Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Droplet className="w-4 h-4 text-cyan-500 mb-0.5 fill-current animate-bounce" />
              <span className="text-2xl font-black text-black dark:text-white font-mono tracking-tight">
                {rawPercent}%
              </span>
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                {currentIntake.toLocaleString('pt-BR')} ml
              </span>
            </div>
          </div>

          {/* Progress Breakdown & Motivational Status */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-gray-300">
                Consumo Registrado
              </span>
              <span className="font-black text-cyan-600 dark:text-cyan-400 text-sm">
                {currentIntake.toLocaleString('pt-BR')} <span className="text-gray-400 font-normal text-xs">/ {hydration.goal.toLocaleString('pt-BR')} ml</span>
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-3 bg-gray-200/80 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
              <span>💧 {hydration.logs.length} ingestões hoje</span>
              {remainingMl > 0 ? (
                <span>Faltam {(remainingMl / 250).toFixed(1)} copos de 250ml</span>
              ) : (
                <span className="text-emerald-500 font-bold">Excelente hidratação! ✨</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Intake Action Buttons */}
      <div className="space-y-2 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Adicionar Água Rapidamente
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {quickPresets.map((preset) => (
            <button
              key={preset.amount}
              type="button"
              onClick={() => handleAddWater(preset.amount)}
              className="bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-white/5 hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 p-2.5 rounded-2xl transition-all flex flex-col items-center justify-center text-center group hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-black text-sm group-hover:text-cyan-500">
                <Plus className="w-3.5 h-3.5" />
                {preset.label}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Controls: Custom Amount, Undo, View History */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomAddModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Outra Quantidade
          </button>

          {hydration.logs.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 border border-gray-200 dark:border-white/5 transition-all flex items-center gap-1"
              title="Desfazer última adição"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hydration.logs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogsDrawer(!showLogsDrawer)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-all flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-cyan-500" />
              {showLogsDrawer ? 'Ocultar Horários' : 'Ver Horários'}
              {showLogsDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Logs History Accordion */}
      <AnimatePresence>
        {showLogsDrawer && hydration.logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Registros de Hoje ({hydration.logs.length})
              </span>
              <button
                type="button"
                onClick={handleResetDay}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                Limpar Dia
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {[...hydration.logs].reverse().map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900/60 px-3 py-2 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Droplet className="w-3 h-3 text-cyan-500 fill-current" />
                    <span className="font-bold text-black dark:text-white">+{log.amount} ml</span>
                    {log.type && log.type !== 'water' && (
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded font-medium">
                        {log.type}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 font-mono text-[11px]">{log.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Meta Diária */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-500 fill-current" /> Meta Diária de Água
              </h3>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              A recomendação padrão de saúde é de <strong>35 ml por kg</strong> de peso corporal. 
              {profile?.weight && (
                <span> Para seu peso atual ({profile.weight}kg), a meta recomendada é de <strong>{Math.round((profile.weight * 35)/100)*100} ml</strong> por dia.</span>
              )}
            </p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Meta em Mililitros (ml)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="500"
                    max="10000"
                    required
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-lg font-bold text-black dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    ml / dia
                  </span>
                </div>
              </div>

              {/* Quick Goal buttons */}
              <div className="flex gap-2">
                {[2000, 2500, 3000, 3500, 4000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGoalInput(val.toString())}
                    className="flex-1 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-white/10 hover:border-cyan-500 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300"
                  >
                    {val / 1000}L
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 font-bold p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Adicionar Quantidade Personalizada */}
      {showCustomAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" /> Registrar Ingestão de Líquidos
              </h3>
              <button 
                onClick={() => setShowCustomAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Quantidade (ml) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max="3000"
                    required
                    placeholder="Ex: 350"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-lg font-bold text-black dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    ml
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Tipo de Bebida
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {[
                    { id: 'water', label: 'Água Pura' },
                    { id: 'tea', label: 'Chá / Infusão' },
                    { id: 'coconut_water', label: 'Água de Coco' },
                    { id: 'shake', label: 'Shake / Whey' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCustomDrinkType(t.id as any)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        customDrinkType === t.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomAddModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 font-bold p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30"
                >
                  Registrar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
