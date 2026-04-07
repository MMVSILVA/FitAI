import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePlan, UserProfile } from '../services/aiService';
import { useUser } from '../store/userStore';
import { Dumbbell, Loader2, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, authLoading, setProfile, setPlan, startTrial } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('fitai_onboarding_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      age: '' as number | string,
      weight: '' as number | string,
      height: '' as number | string,
      goal: ['Hipertrofia'] as string[],
      level: 'Iniciante',
      days: 4,
    };
  });

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem('fitai_onboarding_step');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const handleNext = () => {
    setStep(s => {
      const next = s + 1;
      localStorage.setItem('fitai_onboarding_step', next.toString());
      return next;
    });
  };
  
  const handleBack = () => {
    setStep(s => {
      const prev = s - 1;
      localStorage.setItem('fitai_onboarding_step', prev.toString());
      return prev;
    });
  };

  const updateForm = (field: string, value: string | number | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      localStorage.setItem('fitai_onboarding_form', JSON.stringify(newData));
      return newData;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.age || !formData.weight || !formData.height) {
      setError('Por favor, preencha todos os campos de medidas.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const parseNumber = (val: string | number) => {
        if (typeof val === 'string') {
          return Number(val.replace(',', '.'));
        }
        return val;
      };

      const profileData: UserProfile = {
        ...formData,
        age: parseNumber(formData.age),
        weight: parseNumber(formData.weight),
        height: parseNumber(formData.height),
        goal: formData.goal.join(', '),
      };
      
      if (isNaN(profileData.age) || isNaN(profileData.weight) || isNaN(profileData.height)) {
        throw new Error("Valores inválidos. Use apenas números.");
      }

      setProfile(profileData);
      const plan = await generatePlan(profileData);
      setPlan(plan);
      startTrial();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative">
        <button 
          onClick={() => { setLoading(false); setStep(1); }}
          className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Cancelar
        </button>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-8"
        >
          <Loader2 className="w-16 h-16 text-purple-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 text-center">A IA está criando seu plano...</h2>
        <p className="text-gray-400 text-center max-w-md">
          Analisando seu perfil, calculando macros e estruturando sua progressão de carga. Isso pode levar alguns segundos.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-md">
        {step > 1 ? (
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </button>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar ao Início
          </button>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-2 rounded-full mb-8 sm:mb-12 overflow-hidden">
          <motion.div 
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="bg-zinc-950 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-2">Qual seu objetivo principal?</h2>
              <p className="text-gray-400 mb-6">Você pode escolher mais de uma opção.</p>
              <div className="space-y-3 mb-8">
                {['Emagrecimento', 'Hipertrofia', 'Manutenção', 'Condicionamento'].map(goal => {
                  const isSelected = formData.goal.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => {
                        setFormData(prev => {
                          const newGoals = isSelected 
                            ? prev.goal.filter(g => g !== goal)
                            : [...prev.goal, goal];
                          // Ensure at least one goal is selected
                          return { ...prev, goal: newGoals.length > 0 ? newGoals : [goal] };
                        });
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-500/10 text-white' 
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="font-medium text-lg">{goal}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Suas medidas básicas</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Idade</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={formData.age}
                    onChange={e => updateForm('age', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ex: 30"
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Peso (kg)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={formData.weight}
                      onChange={e => updateForm('weight', e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Ex: 75.5"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Altura (m)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={formData.height}
                      onChange={e => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        if (!rawValue) {
                          updateForm('height', '');
                          return;
                        }
                        const numValue = parseInt(rawValue, 10);
                        const formatted = (numValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        updateForm('height', formatted);
                      }}
                      placeholder="Ex: 1,75"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleNext}
                  className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Nível de experiência</h2>
              <div className="space-y-3">
                {['Iniciante', 'Intermediário', 'Avançado'].map(level => (
                  <button
                    key={level}
                    onClick={() => { updateForm('level', level); handleNext(); }}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      formData.level === level 
                        ? 'border-purple-500 bg-purple-500/10 text-white' 
                        : 'border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium text-lg">{level}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Disponibilidade</h2>
              <p className="text-gray-400 mb-6">Quantos dias por semana você pode treinar?</p>
              
              <div className="flex items-center justify-between bg-black border border-white/10 rounded-xl p-4 mb-8">
                <button 
                  onClick={() => updateForm('days', Math.max(1, formData.days - 1))}
                  className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl hover:bg-white/10"
                >
                  -
                </button>
                <span className="text-4xl font-bold">{formData.days}</span>
                <button 
                  onClick={() => updateForm('days', Math.min(7, formData.days + 1))}
                  className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl hover:bg-white/10"
                >
                  +
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                className="w-full bg-green-500 text-black p-4 rounded-xl font-bold text-lg hover:bg-green-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <Dumbbell className="w-5 h-5" />
                Gerar Meu Plano com IA
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>by Márcio Vinícius</p>
        </div>
      </div>
    </div>
  );
}
