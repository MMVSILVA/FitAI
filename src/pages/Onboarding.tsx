import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePlan } from '../services/aiService';
import { useUser } from '../store/userStore';
import { UserProfile } from '../types';
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
      gender: 'Masculino',
      weight: '' as number | string,
      height: '' as number | string,
      objective: [] as string[],
      level: 'iniciante' as 'iniciante' | 'intermediário' | 'avançado',
      days: 4,
      workoutTime: 60,
      location: 'academia' as 'academia' | 'casa' | 'pouco_equipamento',
      equipment: '',
      restrictions: '',
      dietHistory: '',
      sleepQuality: '',
      fitnessHistory: '',
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

      const profileData: Partial<UserProfile> = {
        age: parseNumber(formData.age),
        gender: formData.gender,
        weight: parseNumber(formData.weight),
        height: parseNumber(formData.height),
        objective: formData.objective,
        fitnessLevel: formData.level,
        daysPerWeek: formData.days,
        workoutTime: formData.workoutTime,
        location: formData.location,
        equipment: formData.equipment,
        restrictions: formData.restrictions,
        dietHistory: formData.dietHistory,
        sleepQuality: formData.sleepQuality,
        fitnessHistory: formData.fitnessHistory
      };
      
      if (isNaN(profileData.age!) || isNaN(profileData.weight!) || isNaN(profileData.height!)) {
        throw new Error("Valores inválidos. Use apenas números.");
      }

      setProfile(profileData);
      const planRes = await generatePlan(profileData);
      
      // Combine workout and diet into a single object as defined in types.ts
      const completePlan = {
        ...planRes.workout,
        diet: planRes.diet
      };
      
      setPlan(completePlan);
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
            animate={{ width: `${(step / 8) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="bg-zinc-950 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-2">Quais seus objetivos?</h2>
              <p className="text-gray-400 mb-6">Escolha um ou mais focos para o seu protocolo.</p>
              <div className="space-y-3 mb-8">
                {[
                  { id: 'hipertrofia', label: 'Hipertrofia', desc: 'Foco em ganho de massa muscular' },
                  { id: 'emagrecimento', label: 'Emagrecimento', desc: 'Foco em perda de gordura' },
                  { id: 'performance', label: 'Performance', desc: 'Foco em força e resistência' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { 
                      const current = [...formData.objective];
                      if (current.includes(opt.id)) {
                        updateForm('objective', current.filter(i => i !== opt.id));
                      } else {
                        updateForm('objective', [...current, opt.id]);
                      }
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      formData.objective.includes(opt.id) 
                        ? 'border-purple-500 bg-purple-500/10 text-white' 
                        : 'border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{opt.label}</p>
                        <p className="text-sm opacity-60">{opt.desc}</p>
                      </div>
                      {formData.objective.includes(opt.id) && (
                        <CheckCircle2 className="w-6 h-6 text-purple-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button 
                disabled={formData.objective.length === 0}
                onClick={handleNext}
                className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Suas informações</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sexo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Masculino', 'Feminino'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateForm('gender', s)}
                        className={`p-3 rounded-xl border font-bold transition-all ${
                          formData.gender === s 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-white/10 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Idade</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={formData.age}
                    onChange={e => updateForm('age', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ex: 30"
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all"
                  />
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
              <h2 className="text-3xl font-bold mb-6">Medidas</h2>
              <div className="space-y-6">
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">Altura (cm)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={formData.height}
                      onChange={e => updateForm('height', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Ex: 175"
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

          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Nível</h2>
              <div className="space-y-3">
                {[
                  { id: 'iniciante', label: 'Iniciante', desc: 'Estou começando agora' },
                  { id: 'intermediário', label: 'Intermediário', desc: 'Já treino há alguns meses' },
                  { id: 'avançado', label: 'Avançado', desc: 'Treino sério há mais de 1 ano' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { updateForm('level', opt.id); handleNext(); }}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      formData.level === opt.id 
                        ? 'border-purple-500 bg-purple-500/10 text-white' 
                        : 'border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <p className="font-bold text-lg">{opt.label}</p>
                    <p className="text-sm opacity-60">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Frequência e Tempo</h2>
              <div className="space-y-8">
                <div>
                  <p className="text-gray-400 mb-4">Dias por semana</p>
                  <div className="flex items-center justify-between bg-black border border-white/10 rounded-xl p-4">
                    <button onClick={() => updateForm('days', Math.max(1, formData.days - 1))} className="w-10 h-10 rounded-lg bg-white/5 text-xl font-bold">-</button>
                    <span className="text-3xl font-bold font-mono">{formData.days}</span>
                    <button onClick={() => updateForm('days', Math.min(7, formData.days + 1))} className="w-10 h-10 rounded-lg bg-white/5 text-xl font-bold">+</button>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-4">Duração média do treino (minutos)</p>
                  <div className="flex items-center justify-between bg-black border border-white/10 rounded-xl p-4">
                    <button onClick={() => updateForm('workoutTime', Math.max(15, formData.workoutTime - 5))} className="w-10 h-10 rounded-lg bg-white/5 text-xl font-bold">-</button>
                    <span className="text-3xl font-bold font-mono">{formData.workoutTime}</span>
                    <button onClick={() => updateForm('workoutTime', Math.min(180, formData.workoutTime + 5))} className="w-10 h-10 rounded-lg bg-white/5 text-xl font-bold">+</button>
                  </div>
                </div>
                <button onClick={handleNext} className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Local e Equipamentos</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Onde você vai treinar?</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'academia', label: 'Academia', desc: 'Acesso a todas as máquinas' },
                      { id: 'casa', label: 'Em Casa', desc: 'Apenas peso do corpo' },
                      { id: 'pouco_equipamento', label: 'Pouco Equipamento', desc: 'Halteres, elásticos, etc' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => updateForm('location', opt.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          formData.location === opt.id 
                            ? 'border-purple-500 bg-purple-500/10 text-white' 
                            : 'border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-sm opacity-60">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Equipamentos disponíveis (opcional)</label>
                  <textarea 
                    value={formData.equipment}
                    onChange={e => updateForm('equipment', e.target.value)}
                    placeholder="Ex: Par de halteres de 5kg, corda..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white min-h-[80px] outline-none focus:border-purple-500"
                  />
                </div>
                <button onClick={handleNext} className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Segurança e Histórico</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Restrições ou Lesões</label>
                  <textarea 
                    value={formData.restrictions}
                    onChange={e => updateForm('restrictions', e.target.value)}
                    placeholder="Ex: Dor no joelho esquerdo, hérnia..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white min-h-[80px] outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Histórico de Atividade Física</label>
                  <textarea 
                    value={formData.fitnessHistory}
                    onChange={e => updateForm('fitnessHistory', e.target.value)}
                    placeholder="Ex: Joguei futebol por 5 anos, parado há 2..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white min-h-[80px] outline-none focus:border-purple-500"
                  />
                </div>
                <button onClick={handleNext} className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-bold mb-6">Estilo de Vida</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Como é sua alimentação hoje?</label>
                  <input 
                    type="text" 
                    value={formData.dietHistory}
                    onChange={e => updateForm('dietHistory', e.target.value)}
                    placeholder="Ex: Como muita fritura, pouca proteína..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Qualidade do sono</label>
                  <input 
                    type="text" 
                    value={formData.sleepQuality}
                    onChange={e => updateForm('sleepQuality', e.target.value)}
                    placeholder="Ex: Durmo 6h, acordo cansado..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white outline-none focus:border-purple-500"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="w-full bg-green-500 text-black p-4 rounded-xl font-bold text-lg hover:bg-green-400 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-[1.02]"
                >
                  <Dumbbell className="w-5 h-5" />
                  Gerar Protocolo FITAI
                </button>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Desenvolvido por NVM Project Management</p>
        </div>
      </div>
    </div>
  );
}
