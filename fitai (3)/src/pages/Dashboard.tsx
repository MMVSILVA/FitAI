import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, Play, Pause, X, TrendingUp, CheckCircle2, Calendar, Users, Download } from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Logo } from '../components/Logo';

export default function Dashboard() {
  const { user, profile, plan, planType, trialEndsAt, logout, calculateIMC, updateExerciseWeight, resetAccount, setPlan } = useUser();
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'evolution' | 'routine' | 'personal'>('workout');
  const navigate = useNavigate();

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  // Routine State
  const [routineData, setRoutineData] = useState({ sleep: '', water: '', stress: '' });
  const [routineSuccess, setRoutineSuccess] = useState(false);

  // Premium State
  const [premiumGoals, setPremiumGoals] = useState('');
  const [premiumGoalsSuccess, setPremiumGoalsSuccess] = useState(false);
  const [ptRequestSuccess, setPtRequestSuccess] = useState(false);
  const [ptMessage, setPtMessage] = useState('');
  const [isGeneratingPT, setIsGeneratingPT] = useState(false);

  const handleGeneratePersonalPlan = async () => {
    if (!ptMessage.trim() && !premiumGoals.trim()) return;
    
    setIsGeneratingPT(true);
    try {
      const { generatePlan } = await import('../services/aiService');
      
      const customProfile = {
        ...profile,
        goal: `${profile.goal}. Pedido específico para o personal: ${ptMessage}. Metas adicionais: ${premiumGoals}`
      };
      
      const newPlan = await generatePlan(customProfile);
      
      // Use the setPlan from the component's useUser hook
      setPlan(newPlan);
      
      setPtRequestSuccess(true);
      setPtMessage('');
      setTimeout(() => setPtRequestSuccess(false), 4000);
    } catch (error) {
      console.error("Error generating PT plan:", error);
    } finally {
      setIsGeneratingPT(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
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
  const isTrialExpired = isFree && trialEndsAt && new Date() >= new Date(trialEndsAt);
  const imcData = calculateIMC();

  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Seu período de teste acabou</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Você aproveitou seus 7 dias gratuitos. Para continuar acessando seu plano e evoluindo, escolha um de nossos planos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
           <Link to="/checkout?plan=PRO" className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors">
             Assinar Pro
           </Link>
           <Link to="/checkout?plan=PREMIUM" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-colors">
             Assinar Premium
           </Link>
        </div>
        <button onClick={handleLogout} className="mt-8 text-gray-500 hover:text-white transition-colors">
          Sair
        </button>
      </div>
    );
  }

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

  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Seu período de teste acabou</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Para continuar acessando seus treinos, dietas e evolução, escolha um de nossos planos.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold text-purple-400 mb-6">R$ 39,90<span className="text-sm text-gray-500 font-normal">/mês</span></p>
            <ul className="text-left space-y-3 mb-8 w-full">
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Treinos ilimitados</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Dieta completa</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Evolução detalhada</li>
            </ul>
            <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors mt-auto">
              Assinar Pro
            </Link>
          </div>

          <div className="bg-purple-900/20 border border-purple-500 p-8 rounded-3xl flex flex-col items-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">
              Recomendado
            </div>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-4xl font-bold text-purple-400 mb-6">R$ 59,90<span className="text-sm text-gray-500 font-normal">/mês</span></p>
            <ul className="text-left space-y-3 mb-8 w-full">
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Tudo do plano Pro</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Chat 24h com Coach IA</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Ajustes diários de treino</li>
            </ul>
            <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold transition-colors mt-auto">
              Assinar Premium
            </Link>
          </div>
        </div>

        <button onClick={handleLogout} className="mt-12 text-gray-500 hover:text-white transition-colors flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
                <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-purple-400 font-medium tracking-wider uppercase">Plano {planType}</p>
                {['vinidoctor@gmail.com', 'vinisilva02@hotmail.com', 'nangelicaalcantara@gmail.com'].includes(user?.email || '') && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold uppercase tracking-tighter">Admin</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="hidden sm:flex items-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4" /> Instalar App
              </button>
            )}
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30 text-purple-400 font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
        <div className="mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
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
          <button 
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            Refazer Plano
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'workout' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('diet')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'diet' ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className="w-5 h-5" />
            Dieta
          </button>
          <button 
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'evolution' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Evolução
          </button>
          <button 
            onClick={() => setActiveTab('routine')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'routine' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Rotina Diária
          </button>
          {planType === 'PREMIUM' && (
            <button 
              onClick={() => setActiveTab('personal')}
              className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'personal' ? 'bg-purple-900 border border-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5" />
              Personal Trainer
            </button>
          )}
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
                              <div className="flex-1 flex flex-col justify-center">
                                <p className="font-bold text-lg">{ex.name}</p>
                                <div className="flex flex-wrap items-center gap-4 mt-1">
                                  <p className="text-gray-400">{ex.sets} séries x {ex.reps}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Carga:</span>
                                    <input 
                                      type="text" 
                                      value={ex.weight || ''} 
                                      onChange={(e) => updateExerciseWeight(idx, i, e.target.value)}
                                      placeholder="Ex: 20kg"
                                      className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm text-white w-24 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3 space-y-2 bg-white/5 p-3 rounded-lg border border-white/10">
                                  {ex.tips && <p className="text-sm text-gray-300"><strong className="text-purple-400">Dica:</strong> {ex.tips}</p>}
                                  {ex.breathing && <p className="text-sm text-gray-300"><strong className="text-blue-400">Respiração:</strong> {ex.breathing}</p>}
                                  {ex.cadence && <p className="text-sm text-gray-300"><strong className="text-green-400">Cadência:</strong> {ex.cadence}</p>}
                                </div>
                              </div>
                              <div className="flex flex-col items-center justify-center gap-3">
                                {ex.imageKeyword && (
                                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 relative">
                                    <img 
                                      src={`https://source.unsplash.com/featured/?fitness,${ex.imageKeyword}`} 
                                      alt={ex.name} 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop'; }}
                                    />
                                  </div>
                                )}
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
          {activeTab === 'routine' && (
            <div className="space-y-8">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Registro de Rotina Diária
                </h3>
                <p className="text-gray-400 mb-8">
                  Registre sua rotina para que a IA possa entender seu contexto e ajustar seu plano de forma mais inteligente (Engenharia Social para IA).
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Horas de sono na última noite</label>
                    <input 
                      type="text" 
                      value={routineData.sleep}
                      onChange={e => setRoutineData({...routineData, sleep: e.target.value})}
                      placeholder="Ex: 7 horas"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Água consumida hoje</label>
                    <input 
                      type="text" 
                      value={routineData.water}
                      onChange={e => setRoutineData({...routineData, water: e.target.value})}
                      placeholder="Ex: 2 litros"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nível de estresse (1-10)</label>
                    <input 
                      type="text" 
                      value={routineData.stress}
                      onChange={e => setRoutineData({...routineData, stress: e.target.value})}
                      placeholder="Ex: 4"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  
                  <button 
                    onClick={() => {
                      setRoutineSuccess(true);
                      setRoutineData({ sleep: '', water: '', stress: '' });
                      setTimeout(() => setRoutineSuccess(false), 3000);
                    }}
                    className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                  >
                    Salvar Rotina
                  </button>
                  {routineSuccess && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
                      Rotina registrada com sucesso! A IA usará esses dados para otimizar seu próximo treino.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && planType === 'PREMIUM' && (
            <div className="space-y-8">
              {/* Premium Goals */}
              <div className="bg-zinc-950 border border-purple-500/30 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Metas Específicas (Premium)
                </h3>
                <p className="text-gray-400 mb-6">
                  Defina metas detalhadas para que seu personal e a IA possam focar exatamente no que você deseja alcançar.
                </p>
                <div className="space-y-4">
                  <textarea 
                    value={premiumGoals}
                    onChange={e => setPremiumGoals(e.target.value)}
                    placeholder="Ex: Quero focar em hipertrofia nas pernas e melhorar meu condicionamento cardiovascular para uma corrida de 5km no mês que vem..."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={() => {
                      setPremiumGoalsSuccess(true);
                      setTimeout(() => setPremiumGoalsSuccess(false), 3000);
                    }}
                    className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-500 transition-colors"
                  >
                    Salvar Metas
                  </button>
                  {premiumGoalsSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
                      Metas salvas com sucesso! Seu personal foi notificado.
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Trainer */}
              <div className="bg-zinc-950 border border-purple-500/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10" />
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Sua Equipe Afiliada
                </h3>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Como assinante Premium, você pode convidar e vincular o seu <strong>Personal Trainer</strong> e seu <strong>Nutricionista/Nutrólogo</strong> ao app. Eles terão acesso ao seu perfil e poderão atualizar seu plano diretamente.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Afiliar Personal */}
                  <div className="bg-black border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold">Personal Trainer</h4>
                        <p className="text-sm text-gray-500">Acompanhamento de treino</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="E-mail do Personal"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                      />
                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl text-sm font-bold transition-colors">
                        Enviar Convite de Vínculo
                      </button>
                    </div>
                  </div>

                  {/* Afiliar Nutricionista */}
                  <div className="bg-black border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center border border-green-500">
                        <Activity className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold">Nutricionista/Nutrólogo</h4>
                        <p className="text-sm text-gray-500">Acompanhamento de dieta</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="E-mail do Nutricionista"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-green-500 outline-none"
                      />
                      <button className="w-full bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl text-sm font-bold transition-colors">
                        Enviar Convite de Vínculo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-white/10 rounded-2xl p-6 mb-6 mt-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-purple-900 flex items-center justify-center">
                      <span className="text-xl font-bold">IA</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Coach Virtual (IA)</h4>
                      <p className="text-sm text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online (Enquanto seus afiliados não entram)
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    "Enquanto você não vincula um profissional real, eu sou seu Coach Virtual Premium. Estou analisando seu perfil e posso gerar treinos super específicos para você."
                  </p>
                </div>
                
                <div className="space-y-4">
                  <textarea 
                    value={ptMessage}
                    onChange={e => setPtMessage(e.target.value)}
                    placeholder="Envie uma mensagem ou solicite um treino/dieta específica ao seu profissional afiliado (ou à IA)."
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all min-h-[100px] resize-none"
                  />
                  <button 
                    onClick={handleGeneratePersonalPlan}
                    disabled={isGeneratingPT}
                    className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPT ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Gerando Novo Treino...
                      </>
                    ) : (
                      'Solicitar Novo Treino Específico'
                    )}
                  </button>
                  {ptRequestSuccess && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/50 rounded-xl text-purple-400 text-sm text-center">
                      Solicitação enviada! O Personal está montando seu treino e você receberá uma notificação em breve.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 py-8 px-6 flex flex-col items-center gap-4 text-gray-500 text-sm">
        <p>© 2026 FitAI. by Márcio Vinícius</p>
      </footer>
    </div>
  );
}
