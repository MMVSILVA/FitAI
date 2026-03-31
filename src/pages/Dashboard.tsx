import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, Play, Pause, X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { getExerciseImage } from '../lib/exerciseImages';

export default function Dashboard() {
  const { profile, plan, planType, trialEndsAt, logout, calculateIMC } = useUser();
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'evolution'>('workout');
  const navigate = useNavigate();

  // Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      // alert('Tempo esgotado!'); // Not using alert as per instructions, using UI instead
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startRest = (seconds: number) => {
    setTimeLeft(seconds);
    setTimerActive(true);
    setShowTimer(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    await logoutFirebase();
    logout();
    navigate('/login');
  };

  if (!profile || !plan) {
    return <Navigate to="/onboarding" />;
  }

  const isFree = planType === 'FREE';
  const imcData = calculateIMC();

  // Mock data for evolution chart
  const chartData = [
    { name: 'Sem 1', peso: profile.weight + 2 },
    { name: 'Sem 2', peso: profile.weight + 1 },
    { name: 'Sem 3', peso: profile.weight + 0.5 },
    { name: 'Atual', peso: profile.weight },
  ];

  const Paywall = ({ feature }: { feature: string }) => (
    <div className="absolute inset-0 backdrop-blur-md bg-black/80 z-10 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4 mt-8">
        <Lock className="w-8 h-8 text-purple-500" />
      </div>
      <h4 className="text-2xl font-bold mb-2">Recurso Bloqueado</h4>
      <p className="text-gray-300 max-w-md mb-8">
        O recurso <strong>{feature}</strong> está disponível apenas nos planos pagos. Escolha seu plano abaixo para liberar:
      </p>
      
      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col">
          <h5 className="text-xl font-bold mb-2">Pro</h5>
          <p className="text-3xl font-bold text-purple-400 mb-4">R$ 39,90<span className="text-sm text-gray-500">/mês</span></p>
          <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1 text-left">
            <li>✓ Treinos ilimitados</li>
            <li>✓ Dieta completa</li>
            <li>✓ Evolução detalhada</li>
          </ul>
          <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors">
            Assinar Pro
          </Link>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500 p-6 rounded-2xl flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
            Recomendado
          </div>
          <h5 className="text-xl font-bold mb-2">Premium</h5>
          <p className="text-3xl font-bold text-purple-400 mb-4">R$ 59,90<span className="text-sm text-gray-500">/mês</span></p>
          <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1 text-left">
            <li>✓ Tudo do Pro</li>
            <li>✓ Chat 24h com Coach IA</li>
            <li>✓ Ajustes diários</li>
          </ul>
          <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-colors">
            Assinar Premium
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FitAI</h1>
              <p className="text-xs text-purple-400 font-medium tracking-wider uppercase">Plano {planType}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Floating Timer */}
      <AnimatePresence>
        {showTimer && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-purple-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Descanso</p>
              <p className={`text-2xl font-bold font-mono ${timeLeft === 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20"
              >
                {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setShowTimer(false)}
                className="p-2 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 pt-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Seu plano está pronto.</h2>
          <p className="text-gray-400">
            Objetivo: <span className="text-white font-medium">{profile.goal}</span> • 
            Nível: <span className="text-white font-medium">{profile.level}</span>
          </p>
          {isFree && trialEndsAt && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-lg text-sm text-purple-300">
              <Timer className="w-4 h-4" />
              Seu período de teste grátis termina em: {new Date(trialEndsAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base ${
              activeTab === 'workout' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('diet')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base ${
              activeTab === 'diet' ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className="w-5 h-5" />
            Dieta
          </button>
          <button 
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base ${
              activeTab === 'evolution' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Evolução
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'workout' && (
            <div className="space-y-8">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Rotina Semanal ({profile.days} dias)
                </h3>
                
                <div className="grid gap-4">
                  {plan.workout.days.map((day, idx) => (
                    <div key={idx} className="bg-black border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-purple-400">{day.day}</h4>
                        <span className="text-sm font-medium bg-white/5 px-3 py-1 rounded-full">{day.focus}</span>
                      </div>
                      
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => {
                          // Extrai os segundos do texto (ex: "60s" -> 60)
                          const restSeconds = parseInt(ex.rest.replace(/\D/g, '')) || 60;
                          
                          return (
                            <div key={i} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-white/5 last:border-0">
                              <div className="w-full sm:w-24 h-24 bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                                <img 
                                  src={getExerciseImage(ex.imageKeyword || ex.name)} 
                                  alt={ex.name}
                                  className="w-full h-full object-cover opacity-80"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 flex flex-col justify-center">
                                <p className="font-bold text-lg">{ex.name}</p>
                                <p className="text-gray-400">{ex.sets} séries x {ex.reps}</p>
                              </div>
                              <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-2">
                                <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-md text-center">
                                  {ex.rest} rest
                                </span>
                                <button 
                                  onClick={() => startRest(restSeconds)}
                                  className="text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Timer className="w-3 h-3" /> Iniciar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progression Paywall */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8 min-h-[400px]">
                <h3 className="text-xl font-bold mb-4">Progressão de Carga & Ajustes</h3>
                
                {isFree ? (
                  <Paywall feature="Progressão de Carga Automática" />
                ) : (
                  <p className="text-gray-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5">
                    {plan.workout.progression}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'diet' && (
            <div className="space-y-8">
              {/* Macros Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Calorias</p>
                  <p className="text-3xl font-bold text-white">{plan.diet.calories}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/dia</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Proteína</p>
                  <p className="text-3xl font-bold text-purple-400">{plan.diet.macros.protein}g</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Carboidratos</p>
                  <p className="text-3xl font-bold text-green-400">{plan.diet.macros.carbs}g</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Gorduras</p>
                  <p className="text-3xl font-bold text-yellow-400">{plan.diet.macros.fat}g</p>
                </div>
              </div>

              {/* Meals Paywall */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8 min-h-[500px]">
                <h3 className="text-xl font-bold mb-6">Plano Alimentar Completo</h3>
                
                {isFree ? (
                  <Paywall feature="Refeições Detalhadas" />
                ) : (
                  <div className="grid gap-4">
                    {plan.diet.meals.map((meal, idx) => (
                      <div key={idx} className="bg-black border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-green-400">{meal.name}</h4>
                          <span className="text-sm font-medium bg-white/5 px-3 py-1 rounded-full">{meal.time}</span>
                        </div>
                        <ul className="space-y-2">
                          {meal.foods.map((food, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                              <span className="text-green-500 mt-1">•</span>
                              {food}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    
                    <div className="mt-8 p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                      <h4 className="font-bold text-purple-400 mb-4">Recomendações do Coach</h4>
                      <ul className="space-y-2">
                        {plan.diet.recommendations.map((rec, i) => (
                          <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                            <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="space-y-8">
              {/* IMC Card */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Seu Corpo</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-48 h-48 rounded-full border-8 border-blue-500/20 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 border-8 border-blue-500 rounded-full border-t-transparent border-r-transparent rotate-45"></div>
                    <span className="text-4xl font-bold text-white">{imcData?.value}</span>
                    <span className="text-sm text-gray-400">IMC</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-blue-400 mb-2">{imcData?.category}</h4>
                    <p className="text-gray-400 mb-4">
                      Seu Índice de Massa Corporal é calculado com base na sua altura ({profile.height}cm) e peso ({profile.weight}kg).
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl">
                        <p className="text-sm text-gray-500">Peso Atual</p>
                        <p className="text-xl font-bold">{profile.weight} kg</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl">
                        <p className="text-sm text-gray-500">Objetivo</p>
                        <p className="text-xl font-bold">{profile.goal}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evolution Chart Paywall */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8 min-h-[400px]">
                <h3 className="text-xl font-bold mb-6">Histórico de Peso</h3>
                
                {isFree ? (
                  <Paywall feature="Gráficos de Evolução" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 py-8 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 FitAI. by Márcio Vinícius</p>
      </footer>
    </div>
  );
}
