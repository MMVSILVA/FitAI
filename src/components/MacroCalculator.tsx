import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Flame, 
  Dumbbell, 
  Sparkles, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Info, 
  Activity, 
  Apple, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Target,
  Sliders,
  Check
} from 'lucide-react';
import { useUser } from '../store/userStore';

interface MacroCalculatorProps {
  onSaved?: () => void;
  className?: string;
}

export function MacroCalculator({ onSaved, className = '' }: MacroCalculatorProps) {
  const { user, profile, plan, setPlan, saveToFirestore } = useUser();

  // User baseline metrics
  const weight = Number(profile?.weight) || 75;
  const height = Number(profile?.height) || 175;
  const age = Number(profile?.age) || 28;
  const gender = profile?.gender || 'male';

  // Calculator base parameters
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete'>('moderate');
  const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>('bulk');
  const [proteinPerKg, setProteinPerKg] = useState<number>(2.0); // g/kg

  // Custom Targets State
  const [targetCalories, setTargetCalories] = useState<number>(2400);
  const [targetProtein, setTargetProtein] = useState<number>(150); // g
  const [targetCarbs, setTargetCarbs] = useState<number>(270); // g
  const [targetFat, setTargetFat] = useState<number>(65); // g

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Initialize from existing plan if available
  useEffect(() => {
    if (plan?.diet) {
      const existingCal = parseInt(String(plan.diet.calories || '').replace(/\D/g, '')) || 2400;
      const existingProt = parseInt(String(plan.diet.macros?.protein || '').replace(/\D/g, '')) || Math.round(weight * 2.0);
      const existingCarbs = parseInt(String(plan.diet.macros?.carbs || '').replace(/\D/g, '')) || 250;
      const existingFat = parseInt(String(plan.diet.macros?.fat || '').replace(/\D/g, '')) || 65;

      setTargetCalories(existingCal);
      setTargetProtein(existingProt);
      setTargetCarbs(existingCarbs);
      setTargetFat(existingFat);

      if (weight > 0) {
        setProteinPerKg(Number((existingProt / weight).toFixed(1)));
      }
    }
  }, [plan?.diet, weight]);

  // Harris-Benedict & Mifflin-St Jeor BMR calculation
  const bmr = Math.round(
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
  );

  const activityMultipliers = {
    sedentary: 1.2, // Pouco ou nenhum exercício
    light: 1.375, // Exercício leve 1-3 dias/semana
    moderate: 1.55, // Exercício moderado 3-5 dias/semana
    heavy: 1.725, // Treino pesado 6-7 dias/semana
    athlete: 1.9 // Treino 2x ao dia ou trabalho braçal intenso
  };

  const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

  // Recalculate automatic macros based on formula
  const handleAutoCalculate = (customGoal?: 'cut' | 'maintain' | 'bulk', customProtRatio?: number) => {
    const selectedGoal = customGoal || goal;
    const selectedProtRatio = customProtRatio || proteinPerKg;

    let cal = tdee;
    if (selectedGoal === 'cut') {
      cal = Math.round(tdee * 0.80); // Déficit de 20%
    } else if (selectedGoal === 'bulk') {
      cal = Math.round(tdee * 1.15); // Superávit de 15%
    }

    const protGrams = Math.round(weight * selectedProtRatio);
    const protKcal = protGrams * 4;

    // Fat: ~25% of total calories (minimum 0.7g/kg)
    const fatKcal = Math.round(cal * 0.25);
    const fatGrams = Math.max(Math.round(weight * 0.7), Math.round(fatKcal / 9));
    const actualFatKcal = fatGrams * 9;

    // Remainder in Carbohydrates
    const remainingKcal = Math.max(0, cal - protKcal - actualFatKcal);
    const carbsGrams = Math.round(remainingKcal / 4);

    setTargetCalories(cal);
    setTargetProtein(protGrams);
    setTargetFat(fatGrams);
    setTargetCarbs(carbsGrams);
    setProteinPerKg(selectedProtRatio);
  };

  // Adjust protein slider
  const handleProteinSliderChange = (newRatio: number) => {
    setProteinPerKg(newRatio);
    const newProtGrams = Math.round(weight * newRatio);
    setTargetProtein(newProtGrams);

    // Rebalance carbs to match target calories
    const protKcal = newProtGrams * 4;
    const fatKcal = targetFat * 9;
    const remKcal = Math.max(0, targetCalories - protKcal - fatKcal);
    setTargetCarbs(Math.round(remKcal / 4));
  };

  // Calculate actual total calories from current macros
  const calculatedMacroKcal = targetProtein * 4 + targetCarbs * 4 + targetFat * 9;
  const protPercent = Math.round(((targetProtein * 4) / (calculatedMacroKcal || 1)) * 100);
  const carbsPercent = Math.round(((targetCarbs * 4) / (calculatedMacroKcal || 1)) * 100);
  const fatPercent = Math.round(((targetFat * 9) / (calculatedMacroKcal || 1)) * 100);

  // Save new macronutrient goals
  const handleSaveMacros = async () => {
    setSaving(true);
    try {
      const updatedDiet = {
        ...(plan?.diet || {}),
        calories: `${targetCalories} kcal`,
        macros: {
          protein: `${targetProtein}g`,
          carbs: `${targetCarbs}g`,
          fat: `${targetFat}g`
        }
      };

      const updatedPlan = {
        ...(plan || { title: 'Meu Plano Personalizado', days: [] }),
        diet: updatedDiet
      };

      // 1. Update local store
      setPlan(updatedPlan as any);

      // 2. Persist to Firestore
      if (user?.uid) {
        await saveToFirestore({
          plan: updatedPlan
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);

      if (onSaved) onSaved();
    } catch (err) {
      console.error("Error saving macros:", err);
    } finally {
      setSaving(false);
    }
  };

  // Presets
  const applyPreset = (name: string, calOffset: number, protG: number, carbG: number, fatG: number, protRatio: number) => {
    const cal = Math.round(tdee + calOffset);
    setTargetCalories(cal);
    setTargetProtein(protG);
    setTargetCarbs(carbG);
    setTargetFat(fatG);
    setProteinPerKg(protRatio);
  };

  return (
    <div className={`bg-gray-50 dark:bg-zinc-950 border border-purple-500/20 rounded-3xl p-4 sm:p-8 shadow-xl transition-all ${className}`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              Calculadora de Macronutrientes
              <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Nutrição Pro
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Calcule seu gasto energético real e ajuste com precisão suas metas diárias de calorias e proteínas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-500/30 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          {showFormulaDetails ? 'Ocultar Fórmulas' : 'Ver Fórmulas (Mifflin-St Jeor)'}
        </button>
      </div>

      {/* Formula Explanation Collapsible */}
      <AnimatePresence>
        {showFormulaDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-600/5 dark:bg-purple-950/20 border border-purple-500/20 text-xs text-gray-700 dark:text-gray-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-4 h-4" /> Metodologia Científica Aplicada
              </div>
              <p>
                <strong>TMB (Taxa Metabólica Basal):</strong> {bmr} kcal/dia calculada para {weight}kg, {height}cm e {age} anos.
              </p>
              <p>
                <strong>GET (Gasto Energético Total):</strong> {tdee} kcal/dia com fator de atividade ({activityMultipliers[activityLevel]}x).
              </p>
              <p className="text-[11px] text-gray-500">
                • 1g de Proteína = 4 kcal • 1g de Carboidrato = 4 kcal • 1g de Gordura = 9 kcal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Base Parameters (Activity & Objective) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        
        {/* Nível de Atividade */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            1. Nível de Atividade Semanal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'sedentary', label: 'Sedentário', sub: 'Trabalho sentado' },
              { id: 'light', label: 'Leve', sub: '1-3x/semana' },
              { id: 'moderate', label: 'Moderado', sub: '3-5x/semana' },
              { id: 'heavy', label: 'Intenso', sub: '6-7x/semana' },
              { id: 'athlete', label: 'Atleta', sub: '2 treinos/dia' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivityLevel(item.id as any);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activityLevel === item.id
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-purple-500/30'
                }`}
              >
                <p className="text-xs font-black">{item.label}</p>
                <p className={`text-[10px] ${activityLevel === item.id ? 'text-purple-200' : 'text-gray-500'}`}>
                  {item.sub}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Objetivo Nutricional */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-purple-500" />
            2. Objetivo Atual
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setGoal('cut');
                handleAutoCalculate('cut', 2.2);
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                goal === 'cut'
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                  : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-orange-500/30'
              }`}
            >
              <TrendingDown className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-black">Secar / Cut</p>
              <p className="text-[9px] opacity-80">-20% kcal</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setGoal('maintain');
                handleAutoCalculate('maintain', 1.8);
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                goal === 'maintain'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-blue-500/30'
              }`}
            >
              <Activity className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-black">Manutenção</p>
              <p className="text-[9px] opacity-80">Recomp GET</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setGoal('bulk');
                handleAutoCalculate('bulk', 2.0);
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                goal === 'bulk'
                  ? 'bg-green-600 text-white border-green-500 shadow-md shadow-green-600/20'
                  : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-green-500/30'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-black">Hipertrofia</p>
              <p className="text-[9px] opacity-80">+15% kcal</p>
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Sliders & Goal Adjustments */}
      <div className="bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-7 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h4 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Ajuste Fino de Metas Diárias
            </h4>
            <p className="text-xs text-gray-500">
              Personalize suas calorias e o aporte de proteínas por quilo de peso ({weight}kg).
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleAutoCalculate()}
            className="text-xs font-black text-purple-600 dark:text-purple-400 hover:bg-purple-600/10 px-3 py-1.5 rounded-xl border border-purple-500/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recalcular Padrão
          </button>
        </div>

        {/* Calorias e Proteína Sliders */}
        <div className="space-y-6">
          
          {/* Calorias Diárias */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-black text-black dark:text-white">Meta de Calorias Diárias</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1200"
                  max="6000"
                  step="50"
                  value={targetCalories}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setTargetCalories(val);
                    // Rebalance carbs
                    const pKcal = targetProtein * 4;
                    const fKcal = targetFat * 9;
                    setTargetCarbs(Math.max(0, Math.round((val - pKcal - fKcal) / 4)));
                  }}
                  className="w-24 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/20 rounded-xl px-3 py-1.5 text-right font-black text-amber-600 dark:text-amber-400 text-base focus:border-amber-500 outline-none"
                />
                <span className="text-xs font-bold text-gray-500">kcal/dia</span>
              </div>
            </div>
            <input
              type="range"
              min="1400"
              max="4500"
              step="50"
              value={targetCalories}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTargetCalories(val);
                const pKcal = targetProtein * 4;
                const fKcal = targetFat * 9;
                setTargetCarbs(Math.max(0, Math.round((val - pKcal - fKcal) / 4)));
              }}
              className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-bold">
              <span>Déficit Severo (1500 kcal)</span>
              <span>GET Médio ({tdee} kcal)</span>
              <span>Superávit Alto (3500+ kcal)</span>
            </div>
          </div>

          {/* Proteína Diária */}
          <div className="p-4 rounded-2xl bg-purple-600/5 dark:bg-purple-950/20 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="text-sm font-black text-black dark:text-white">Meta de Proteína</span>
                  <span className="ml-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    ({proteinPerKg}g / kg)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="400"
                  step="5"
                  value={targetProtein}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setTargetProtein(val);
                    if (weight > 0) setProteinPerKg(Number((val / weight).toFixed(1)));
                    const pKcal = val * 4;
                    const fKcal = targetFat * 9;
                    setTargetCarbs(Math.max(0, Math.round((targetCalories - pKcal - fKcal) / 4)));
                  }}
                  className="w-20 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/20 rounded-xl px-3 py-1.5 text-right font-black text-purple-600 dark:text-purple-400 text-base focus:border-purple-500 outline-none"
                />
                <span className="text-xs font-bold text-gray-500">gramas</span>
              </div>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.0"
              step="0.1"
              value={proteinPerKg}
              onChange={(e) => handleProteinSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-bold">
              <span>Saúde Básica (1.4g/kg)</span>
              <span>Recomendado Hipertrofia (2.0g/kg)</span>
              <span>Cutting Seco (2.6g/kg)</span>
            </div>
          </div>

          {/* Carboidratos e Gorduras (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Carboidratos */}
            <div className="p-4 rounded-2xl bg-green-600/5 dark:bg-green-950/20 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider">
                  Carboidratos
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="20"
                    max="600"
                    step="5"
                    value={targetCarbs}
                    onChange={(e) => setTargetCarbs(Number(e.target.value) || 0)}
                    className="w-16 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/20 rounded-xl px-2 py-1 text-right font-black text-green-600 dark:text-green-400 text-sm focus:border-green-500 outline-none"
                  />
                  <span className="text-xs font-bold text-gray-500">g</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                {targetCarbs * 4} kcal • Energia para treinos de alta intensidade
              </p>
            </div>

            {/* Gorduras */}
            <div className="p-4 rounded-2xl bg-yellow-600/5 dark:bg-yellow-950/20 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  Gorduras Boas (Lipídios)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="20"
                    max="200"
                    step="5"
                    value={targetFat}
                    onChange={(e) => setTargetFat(Number(e.target.value) || 0)}
                    className="w-16 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/20 rounded-xl px-2 py-1 text-right font-black text-yellow-600 dark:text-yellow-400 text-sm focus:border-yellow-500 outline-none"
                  />
                  <span className="text-xs font-bold text-gray-500">g</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                {targetFat * 9} kcal • Essencial para síntese hormonal e absorção
              </p>
            </div>

          </div>

        </div>

        {/* Visual Macro Ratio Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between text-xs font-black mb-2">
            <span className="text-gray-500 dark:text-gray-400">Distribuição Calórica Atual:</span>
            <span className="text-black dark:text-white font-mono">
              {calculatedMacroKcal} kcal calculadas
            </span>
          </div>

          <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-zinc-800 shadow-inner">
            <div 
              style={{ width: `${protPercent}%` }} 
              className="bg-purple-600 flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
              title={`Proteína: ${protPercent}% (${targetProtein * 4} kcal)`}
            >
              {protPercent > 12 && `P ${protPercent}%`}
            </div>
            <div 
              style={{ width: `${carbsPercent}%` }} 
              className="bg-green-500 flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
              title={`Carboidratos: ${carbsPercent}% (${targetCarbs * 4} kcal)`}
            >
              {carbsPercent > 12 && `C ${carbsPercent}%`}
            </div>
            <div 
              style={{ width: `${fatPercent}%` }} 
              className="bg-yellow-500 flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
              title={`Gorduras: ${fatPercent}% (${targetFat * 9} kcal)`}
            >
              {fatPercent > 12 && `G ${fatPercent}%`}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              Proteínas: {targetProtein}g ({protPercent}%)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-green-600 dark:text-green-400">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              Carboidratos: {targetCarbs}g ({carbsPercent}%)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-yellow-600 dark:text-yellow-400">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              Gorduras: {targetFat}g ({fatPercent}%)
            </span>
          </div>
        </div>

      </div>

      {/* Quick Presets Selection */}
      <div className="mb-8 space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Presets Rápidos de Dieta
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('Hipertrofia Limpa', 300, Math.round(weight * 2.2), 300, 65, 2.2)}
            className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-500 text-left transition-all group"
          >
            <p className="text-xs font-black text-black dark:text-white group-hover:text-purple-500 transition-colors">Hipertrofia Limpa</p>
            <p className="text-[10px] text-gray-500">2.2g/kg Prot • +300kcal</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Cutting Agressivo', -500, Math.round(weight * 2.4), 160, 50, 2.4)}
            className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500 text-left transition-all group"
          >
            <p className="text-xs font-black text-black dark:text-white group-hover:text-orange-500 transition-colors">Cutting Agressivo</p>
            <p className="text-[10px] text-gray-500">2.4g/kg Prot • Low Carb</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Recomposição Corporal', 0, Math.round(weight * 2.0), 240, 60, 2.0)}
            className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500 text-left transition-all group"
          >
            <p className="text-xs font-black text-black dark:text-white group-hover:text-blue-500 transition-colors">Recomposição</p>
            <p className="text-[10px] text-gray-500">2.0g/kg Prot • Equilibrado</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Manutenção Saudável', 0, Math.round(weight * 1.8), 280, 70, 1.8)}
            className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-green-500 text-left transition-all group"
          >
            <p className="text-xs font-black text-black dark:text-white group-hover:text-green-500 transition-colors">Manutenção</p>
            <p className="text-[10px] text-gray-500">1.8g/kg Prot • Saudável</p>
          </button>
        </div>
      </div>

      {/* Save Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-black dark:text-white">
            Meta selecionada: <span className="text-purple-600 dark:text-purple-400 font-black">{targetCalories} kcal</span> ({targetProtein}g P • {targetCarbs}g C • {targetFat}g G)
          </p>
          <p className="text-[11px] text-gray-500">
            Atualiza automaticamente seus cards de refeições, metas diárias e planejamento nutricional.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveMacros}
          disabled={saving}
          className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
            savedSuccess
              ? 'bg-green-600 text-white shadow-green-600/30'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando Metas...
            </>
          ) : savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Metas Salvas na Dieta!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Metas na Dieta
            </>
          )}
        </button>
      </div>

    </div>
  );
}
