import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Sparkles, 
  Flame, 
  Clock, 
  ChefHat, 
  Check, 
  Copy, 
  Bookmark, 
  RotateCw, 
  Sliders, 
  AlertCircle, 
  Apple, 
  Plus, 
  X,
  Share2,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useUser } from '../store/userStore';

export interface GeneratedRecipe {
  title: string;
  description: string;
  mealType: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  ingredients: {
    item: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
  chefTip: string;
  tags: string[];
}

interface AiRecipeGeneratorProps {
  initialCalories?: number;
  initialProtein?: number;
  initialCarbs?: number;
  initialFat?: number;
  onSavedToPlan?: (recipe: GeneratedRecipe) => void;
}

export const AiRecipeGenerator: React.FC<AiRecipeGeneratorProps> = ({
  initialCalories,
  initialProtein,
  initialCarbs,
  initialFat,
  onSavedToPlan
}) => {
  const { profile, plan } = useUser();

  // Prefer values from props, or profile/plan, or sensible defaults for a single meal
  const defaultMealCalories = initialCalories 
    ? Math.round(initialCalories / 4) 
    : (plan?.diet?.calories ? Math.round(plan.diet.calories / 4) : 450);

  const defaultMealProtein = initialProtein 
    ? Math.round(initialProtein / 4) 
    : (plan?.diet?.macros?.protein ? Math.round(plan.diet.macros.protein / 4) : 35);

  const defaultMealCarbs = initialCarbs 
    ? Math.round(initialCarbs / 4) 
    : (plan?.diet?.macros?.carbs ? Math.round(plan.diet.macros.carbs / 4) : 45);

  const defaultMealFat = initialFat 
    ? Math.round(initialFat / 4) 
    : (plan?.diet?.macros?.fats ? Math.round(plan.diet.macros.fats / 4) : 15);

  const [mealType, setMealType] = useState<string>('Almoço');
  const [targetCalories, setTargetCalories] = useState<number>(defaultMealCalories);
  const [targetProtein, setTargetProtein] = useState<number>(defaultMealProtein);
  const [targetCarbs, setTargetCarbs] = useState<number>(defaultMealCarbs);
  const [targetFat, setTargetFat] = useState<number>(defaultMealFat);
  const [dietaryPreference, setDietaryPreference] = useState<string>('Hiperproteico');
  const [prepTimeMax, setPrepTimeMax] = useState<string>('20');
  const [customIngredients, setCustomIngredients] = useState<string>('');
  const [selectedQuickIngredients, setSelectedQuickIngredients] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedFavorites, setSavedFavorites] = useState<GeneratedRecipe[]>(() => {
    try {
      const stored = localStorage.getItem('fitai_favorite_recipes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const quickIngredientsList = [
    'Ovos', 'Frango', 'Aveia', 'Banana', 'Batata Doce', 
    'Whey Protein', 'Arroz', 'Azeite de Oliva', 'Brócolis', 
    'Iogurte Grego', 'Patinho Moído', 'Queijo Cottage', 'Atum'
  ];

  const mealTypes = [
    { label: 'Café da Manhã', icon: '🍳' },
    { label: 'Almoço', icon: '🥗' },
    { label: 'Lanche / Pós-Treino', icon: '⚡' },
    { label: 'Jantar', icon: '🍲' },
    { label: 'Ceia Proteica', icon: '🌙' }
  ];

  const dietaryOptions = [
    'Hiperproteico', 'Equilibrada', 'Low Carb', 'Sem Lactose', 
    'Sem Glúten', 'Vegetariana', 'Vegana', 'Cetogênica'
  ];

  const toggleQuickIngredient = (ing: string) => {
    setSelectedQuickIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleGenerateRecipe = async () => {
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const combinedIngredients = [
        ...selectedQuickIngredients,
        customIngredients.trim()
      ].filter(Boolean).join(', ');

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFat,
          dietaryPreference,
          availableIngredients: combinedIngredients,
          prepTimeMax,
          userGoal: profile?.goal || plan?.objective || 'Hipertrofia'
        })
      });

      const data = await response.json();
      if (data && data.recipe) {
        setRecipe(data.recipe);
      }
    } catch (error) {
      console.error('Error generating recipe with Gemini:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyRecipe = () => {
    if (!recipe) return;
    
    const text = `🥗 *${recipe.title}* (${recipe.mealType})
⏱️ Preparo: ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min | 👥 Rendimento: ${recipe.servings} porção(ões)

🔥 *Macronutrientes por porção:*
- Calorias: ${recipe.macros.calories} kcal
- Proteínas: ${recipe.macros.protein}g
- Carboidratos: ${recipe.macros.carbs}g
- Gorduras: ${recipe.macros.fats}g
- Fibras: ${recipe.macros.fiber}g

📋 *Ingredientes:*
${recipe.ingredients.map(i => `• ${i.amount} de ${i.item}`).join('\n')}

👨‍🍳 *Modo de Preparo:*
${recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

💡 *Dica do Chef FitAI:*
${recipe.chefTip}

_Gerado com inteligência artificial pelo FitAI_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleFavorite = () => {
    if (!recipe) return;
    const exists = savedFavorites.some(r => r.title === recipe.title);
    let updated: GeneratedRecipe[];
    if (exists) {
      updated = savedFavorites.filter(r => r.title !== recipe.title);
      setIsSaved(false);
    } else {
      updated = [recipe, ...savedFavorites];
      setIsSaved(true);
    }
    setSavedFavorites(updated);
    localStorage.setItem('fitai_favorite_recipes', JSON.stringify(updated));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full pointer-events-none -mt-40" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none -mb-32" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
              Nutrição de Precisão com Gemini
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Gerador de Receitas por Macronutrientes
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Crie refeições saudáveis, saborosas e perfeitamente ajustadas às suas metas de calorias, proteínas, carboidratos e gorduras.
          </p>
        </div>

        {savedFavorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRecipe(savedFavorites[0])}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-green-500/40 transition-all"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Favoritos ({savedFavorites.length})
            </button>
          </div>
        )}
      </div>

      {/* Controls & Inputs Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Side: Parameters Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Meal Type Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
              1. Tipo de Refeição
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mealTypes.map(mt => (
                <button
                  key={mt.label}
                  type="button"
                  onClick={() => setMealType(mt.label)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                    mealType === mt.label
                      ? 'bg-green-500/10 border-green-500 text-black dark:text-white font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-black/30 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="text-xl">{mt.icon}</span>
                  <span className="text-xs font-bold leading-tight">{mt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Macro Targets Sliders / Inputs */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-green-500" />
                2. Metas de Macronutrientes desta Refeição
              </label>
              <span className="text-xs font-bold font-mono text-green-600 dark:text-green-400">
                {targetCalories} kcal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Calorias</span>
                  <Flame className="w-3 h-3 text-orange-500" />
                </div>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={e => setTargetCalories(Number(e.target.value))}
                  className="w-full text-lg font-black text-black dark:text-white bg-transparent outline-none font-mono"
                />
                <span className="text-[9px] text-gray-400">kcal alvo</span>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Proteína</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <input
                  type="number"
                  value={targetProtein}
                  onChange={e => setTargetProtein(Number(e.target.value))}
                  className="w-full text-lg font-black text-blue-600 dark:text-blue-400 bg-transparent outline-none font-mono"
                />
                <span className="text-[9px] text-gray-400">gramas (g)</span>
              </div>

              {/* Carbs */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Carboidratos</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <input
                  type="number"
                  value={targetCarbs}
                  onChange={e => setTargetCarbs(Number(e.target.value))}
                  className="w-full text-lg font-black text-amber-600 dark:text-amber-400 bg-transparent outline-none font-mono"
                />
                <span className="text-[9px] text-gray-400">gramas (g)</span>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Gorduras</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <input
                  type="number"
                  value={targetFat}
                  onChange={e => setTargetFat(Number(e.target.value))}
                  className="w-full text-lg font-black text-rose-600 dark:text-rose-400 bg-transparent outline-none font-mono"
                />
                <span className="text-[9px] text-gray-400">gramas (g)</span>
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              3. Preferência ou Dieta
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(diet => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => setDietaryPreference(diet)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    dietaryPreference === diet
                      ? 'bg-green-600 text-white border-green-500 shadow-sm'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:border-gray-300'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Pantry & Prep Time (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Ingredients in Fridge */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              4. O que você tem em casa? (Opcional)
            </label>
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickIngredientsList.map(ing => (
                <button
                  key={ing}
                  type="button"
                  onClick={() => toggleQuickIngredient(ing)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all border ${
                    selectedQuickIngredients.includes(ing)
                      ? 'bg-purple-600/20 text-purple-600 dark:text-purple-300 border-purple-500/40'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:border-gray-300'
                  }`}
                >
                  {selectedQuickIngredients.includes(ing) ? '✓ ' : '+ '}{ing}
                </button>
              ))}
            </div>

            <textarea
              value={customIngredients}
              onChange={e => setCustomIngredients(e.target.value)}
              placeholder="Digite outros ingredientes (ex: espinafre, açafrão, canela, pasta de amendoim...)"
              className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-black dark:text-white outline-none focus:border-green-500 transition-all h-20 resize-none"
            />
          </div>

          {/* Prep Time */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              5. Tempo Máximo de Preparo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: '15', label: '< 15 min', desc: 'Ultra rápido' },
                { val: '30', label: '15-30 min', desc: 'Prático' },
                { val: '45', label: '30+ min', desc: 'Gourmet' }
              ].map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setPrepTimeMax(t.val)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    prepTimeMax === t.val
                      ? 'bg-green-500/10 border-green-500 text-black dark:text-white font-bold'
                      : 'bg-gray-50 dark:bg-black/30 border-gray-200 dark:border-white/5 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold">{t.label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateRecipe}
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Criando Receita com Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Receita Personalizada
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Recipe Card */}
      <AnimatePresence>
        {recipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 bg-gray-50 dark:bg-black/50 border border-green-500/30 rounded-3xl p-6 sm:p-8 mt-6 shadow-2xl"
          >
            {/* Header of Recipe */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    {recipe.mealType}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Dificuldade {recipe.difficulty}
                  </span>
                  {recipe.tags?.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                      #{t}
                    </span>
                  ))}
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                  {recipe.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {recipe.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyRecipe}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSaved || savedFavorites.some(r => r.title === recipe.title)
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved || savedFavorites.some(r => r.title === recipe.title) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {isSaved || savedFavorites.some(r => r.title === recipe.title) ? 'Favoritada' : 'Favoritar'}
                </button>

                <button
                  onClick={handleGenerateRecipe}
                  title="Gerar outra variação"
                  className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-green-500 transition-all"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nutrition & Timing Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Calorias</p>
                <p className="text-xl font-black text-black dark:text-white mt-0.5">{recipe.macros.calories} <span className="text-xs font-normal text-gray-400">kcal</span></p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 text-center">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Proteína</p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{recipe.macros.protein} <span className="text-xs font-normal text-blue-400">g</span></p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-center">
                <p className="text-[10px] font-bold text-amber-500 uppercase">Carboidratos</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{recipe.macros.carbs} <span className="text-xs font-normal text-amber-400">g</span></p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 text-center">
                <p className="text-[10px] font-bold text-rose-500 uppercase">Gorduras</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{recipe.macros.fats} <span className="text-xs font-normal text-rose-400">g</span></p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-center">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Fibras</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{recipe.macros.fiber} <span className="text-xs font-normal text-emerald-400">g</span></p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tempo Total</p>
                <p className="text-xl font-black text-black dark:text-white mt-0.5">{recipe.prepTimeMinutes + recipe.cookTimeMinutes} <span className="text-xs font-normal text-gray-400">min</span></p>
              </div>
            </div>

            {/* Content: Ingredients & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Ingredients List (5 cols) */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <h5 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-green-500" />
                  Ingredientes & Quantidades
                </h5>
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start justify-between text-xs py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {ing.item}
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400 font-mono shrink-0 ml-2">
                        {ing.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step-by-Step Instructions (7 cols) */}
              <div className="md:col-span-7 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <h5 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-purple-500" />
                  Modo de Preparo Passo a Passo
                </h5>
                <ol className="space-y-3">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Chef's Pro Tip */}
            {recipe.chefTip && (
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-green-600 dark:text-green-400">
                    Dica do Chef & Nutricionista IA
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-200 mt-0.5 leading-relaxed">
                    {recipe.chefTip}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
