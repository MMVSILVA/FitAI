import React from 'react';
import { motion } from 'motion/react';
import { Apple, Flame, Dumbbell, Sparkles, ChevronRight, CheckCircle2, PieChart } from 'lucide-react';
import { useUser } from '../store/userStore';

interface DailyMacrosCardProps {
  onNavigateDiet?: () => void;
  className?: string;
}

export const DailyMacrosCard: React.FC<DailyMacrosCardProps> = ({ onNavigateDiet, className = '' }) => {
  const { plan, profile } = useUser();

  // Extract from plan.diet if available, or compute intelligent estimates based on user profile
  const userWeight = profile?.weight || 75;
  const dietData = plan?.diet;

  let calories = 2200;
  let proteinGrams = Math.round(userWeight * 2.0); // 2.0g/kg
  let carbsGrams = Math.round(userWeight * 3.0);   // 3.0g/kg
  let fatGrams = Math.round(userWeight * 0.8);     // 0.8g/kg

  if (dietData) {
    if (dietData.calories) {
      const parsedCal = parseInt(dietData.calories.toString().replace(/\D/g, ''));
      if (!isNaN(parsedCal) && parsedCal > 500) calories = parsedCal;
    }
    if (dietData.macros) {
      const parsedProt = parseInt(dietData.macros.protein?.toString().replace(/\D/g, '') || '');
      const parsedCarbs = parseInt(dietData.macros.carbs?.toString().replace(/\D/g, '') || '');
      const parsedFat = parseInt(dietData.macros.fat?.toString().replace(/\D/g, '') || '');

      if (!isNaN(parsedProt) && parsedProt > 0) proteinGrams = parsedProt;
      if (!isNaN(parsedCarbs) && parsedCarbs > 0) carbsGrams = parsedCarbs;
      if (!isNaN(parsedFat) && parsedFat > 0) fatGrams = parsedFat;
    }
  }

  // Calculate calories from macros (Prot: 4kcal/g, Carbs: 4kcal/g, Fat: 9kcal/g)
  const protCal = proteinGrams * 4;
  const carbsCal = carbsGrams * 4;
  const fatCal = fatGrams * 9;
  const totalMacroCal = protCal + carbsCal + fatCal || 1;

  const protPct = Math.round((protCal / totalMacroCal) * 100);
  const carbsPct = Math.round((carbsCal / totalMacroCal) * 100);
  const fatPct = Math.round((fatCal / totalMacroCal) * 100);

  // Meals adherence
  const meals = dietData?.meals || [];
  const completedMealsCount = meals.filter(m => m.isAdhered).length;
  const totalMealsCount = meals.length || 4;

  return (
    <div className={`bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-sm">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-black dark:text-white tracking-tight">Metas de Macronutrientes</h3>
              <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Hoje
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Distribuição calórica diária baseada no seu objetivo
            </p>
          </div>
        </div>

        {onNavigateDiet && (
          <button
            onClick={onNavigateDiet}
            className="inline-flex items-center gap-1.5 text-xs font-black text-green-600 dark:text-green-400 hover:text-green-500 transition-colors uppercase tracking-wider group"
          >
            Ver Cardápio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Total Calories + Proportional Bar */}
      <div className="mb-6 bg-gray-50 dark:bg-zinc-900/60 p-5 rounded-2xl border border-gray-100 dark:border-white/5 relative z-10">
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Meta Calórica Total
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-black dark:text-white">{calories}</span>
              <span className="text-sm font-bold text-gray-500">kcal / dia</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refeições Feitas</span>
            <p className="text-sm font-black text-green-600 dark:text-green-400 mt-0.5">
              {completedMealsCount} de {totalMealsCount} concluídas
            </p>
          </div>
        </div>

        {/* Visual Macro Distribution Stacked Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-zinc-800 shadow-inner">
          <div 
            style={{ width: `${protPct}%` }} 
            className="bg-purple-500 transition-all duration-500" 
            title={`Proteína: ${protPct}% (${proteinGrams}g)`}
          />
          <div 
            style={{ width: `${carbsPct}%` }} 
            className="bg-emerald-500 transition-all duration-500" 
            title={`Carboidratos: ${carbsPct}% (${carbsGrams}g)`}
          />
          <div 
            style={{ width: `${fatPct}%` }} 
            className="bg-amber-500 transition-all duration-500" 
            title={`Gorduras: ${fatPct}% (${fatGrams}g)`}
          />
        </div>
      </div>

      {/* The 3 Macro Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        
        {/* Proteínas */}
        <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4.5 flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Proteínas
              </span>
              <span className="text-[10px] font-bold text-gray-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                {protPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black text-black dark:text-white">{proteinGrams}</span>
              <span className="text-xs font-bold text-gray-500">gramas</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <span>{protCal} kcal</span>
            <span className="text-[10px] text-purple-500 font-bold">{(proteinGrams / userWeight).toFixed(1)}g / kg</span>
          </div>
        </div>

        {/* Carboidratos */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4.5 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Carboidratos
              </span>
              <span className="text-[10px] font-bold text-gray-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {carbsPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black text-black dark:text-white">{carbsGrams}</span>
              <span className="text-xs font-bold text-gray-500">gramas</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <span>{carbsCal} kcal</span>
            <span className="text-[10px] text-emerald-500 font-bold">Energia & Treino</span>
          </div>
        </div>

        {/* Gorduras */}
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4.5 flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Gorduras Boas
              </span>
              <span className="text-[10px] font-bold text-gray-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {fatPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black text-black dark:text-white">{fatGrams}</span>
              <span className="text-xs font-bold text-gray-500">gramas</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <span>{fatCal} kcal</span>
            <span className="text-[10px] text-amber-500 font-bold">Saúde Hormonal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
